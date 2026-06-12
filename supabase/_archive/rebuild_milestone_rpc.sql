-- CRITICAL REBUILD of contract_upsert_milestone_draft to fix PGRST203 (Ambiguous Function)
-- This script explicitly DROPS both potential signatures (text and jsonb) before creating the definitive one.

BEGIN;

-- 1. Drop the JSONB version if it exists
DROP FUNCTION IF EXISTS public.contract_upsert_milestone_draft(uuid, uuid, text, numeric, timestamptz, jsonb);

-- 2. Drop the TEXT version if it exists
DROP FUNCTION IF EXISTS public.contract_upsert_milestone_draft(uuid, uuid, text, numeric, timestamptz, text);

-- 3. Recreate the function using TEXT for p_criteria to match frontend `JSON.stringify` logic
-- We parse the text to JSONB inside the function to be safe.
CREATE OR REPLACE FUNCTION public.contract_upsert_milestone_draft(
    p_contract_id uuid,
    p_milestone_id uuid,
    p_title text,
    p_amount numeric,
    p_due_at timestamptz,
    p_criteria text -- ACCEPT TEXT to resolve ambiguity
)
RETURNS TABLE (new_id uuid, new_version int)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_contract_status text;
    v_current_version int;
    v_is_company boolean;
    v_is_student boolean;
    v_criteria_json jsonb;
BEGIN
    -- Validate Contract Status
    SELECT terms_status, terms_version INTO v_contract_status, v_current_version
    FROM contracts
    WHERE id = p_contract_id;

    IF v_contract_status IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    -- Permission Check
    v_is_company := (auth.uid() = (SELECT company_id FROM contracts WHERE id = p_contract_id));
    v_is_student := (auth.uid() = (SELECT student_id FROM contracts WHERE id = p_contract_id));

    IF NOT (v_is_company OR v_is_student) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- If status is NOT draft, bump version and set to draft
    IF v_contract_status != 'draft' THEN
        UPDATE contracts
        SET terms_status = 'draft',
            terms_version = terms_version + 1,
            updated_at = now()
        WHERE id = p_contract_id
        RETURNING terms_version INTO v_current_version;
    END IF;

    -- Safe Cast to JSONB
    BEGIN
        v_criteria_json := p_criteria::jsonb;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: treat as a simple string wrapped in array if parsing fails
        v_criteria_json := jsonb_build_array(p_criteria);
    END;

    -- Upsert logic
    IF p_milestone_id IS NULL THEN
        -- INSERT
        INSERT INTO milestones (
            contract_id,
            title,
            amount,
            acceptance_criteria,
            due_at,
            idx,
            created_by,
            updated_by
        ) VALUES (
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
        -- UPDATE
        UPDATE milestones
        SET
            title = p_title,
            amount = p_amount,
            acceptance_criteria = v_criteria_json,
            due_at = p_due_at,
            updated_by = auth.uid(),
            updated_at = now()
        WHERE id = p_milestone_id AND contract_id = p_contract_id
        RETURNING id INTO new_id;
    END IF;

    -- Return the ID and Version for frontend sync
    RETURN QUERY SELECT new_id, v_current_version;
END;
$$;

COMMIT;
