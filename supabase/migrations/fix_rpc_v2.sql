-- FIX: Create V2 Function to bypass PGRST203 (Ambiguous Function) completely.
-- We rename the function to avoids conflicts with existing signatures.

BEGIN;

CREATE OR REPLACE FUNCTION public.contract_upsert_milestone_v2(
    p_contract_id uuid,
    p_milestone_id uuid,
    p_title text,
    p_amount numeric,
    p_due_at timestamptz,
    p_criteria text
)
RETURNS TABLE (new_id uuid, new_version int)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_contract_status text;
    v_current_version int;
    v_criteria_json jsonb;
BEGIN
    -- Validate Contract Status
    SELECT terms_status, terms_version INTO v_contract_status, v_current_version
    FROM contracts
    WHERE id = p_contract_id;

    IF v_contract_status IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    -- Standard Permission Check
    IF (auth.uid() != (SELECT company_id FROM contracts WHERE id = p_contract_id)) AND 
       (auth.uid() != (SELECT student_id FROM contracts WHERE id = p_contract_id)) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Auto-Draft Logic
    IF v_contract_status != 'draft' THEN
        UPDATE contracts
        SET terms_status = 'draft',
            terms_version = terms_version + 1,
            updated_at = now()
        WHERE id = p_contract_id
        RETURNING terms_version INTO v_current_version;
    END IF;

    -- JSON Usage
    BEGIN
        v_criteria_json := p_criteria::jsonb;
    EXCEPTION WHEN OTHERS THEN
        v_criteria_json := jsonb_build_array(p_criteria);
    END;

    -- Upsert
    IF p_milestone_id IS NULL THEN
        INSERT INTO milestones (contract_id, title, amount, acceptance_criteria, due_at, idx, created_by, updated_by)
        VALUES (
            p_contract_id, 
            p_title, 
            p_amount, 
            v_criteria_json, 
            p_due_at, 
            (SELECT COALESCE(MAX(idx), 0) + 1 FROM milestones WHERE contract_id = p_contract_id), 
            auth.uid(), 
            auth.uid()
        ) RETURNING id INTO new_id;
    ELSE
        UPDATE milestones 
        SET title = p_title, amount = p_amount, acceptance_criteria = v_criteria_json, due_at = p_due_at, updated_by = auth.uid(), updated_at = now()
        WHERE id = p_milestone_id AND contract_id = p_contract_id 
        RETURNING id INTO new_id;
    END IF;

    RETURN QUERY SELECT new_id, v_current_version;
END;
$$;

COMMIT;
