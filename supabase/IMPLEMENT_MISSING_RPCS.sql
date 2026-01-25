-- IMPLEMENT EXTRA MISSING RPCS (Init, Save, Submit)
-- Part 1 of Negotiation Logic

BEGIN;

-- 1. Initialize Draft
DROP FUNCTION IF EXISTS draft_initialize(uuid, bigint);

CREATE OR REPLACE FUNCTION draft_initialize(
    p_contract_id UUID,
    p_total_amount_minor BIGINT
)
RETURNS UUID -- Returns Draft ID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_ver_id UUID;
BEGIN
    -- Check existing
    SELECT id INTO v_draft_id FROM milestone_drafts WHERE contract_id = p_contract_id;
    
    IF v_draft_id IS NOT NULL THEN
        RETURN v_draft_id;
    END IF;

    -- Create Draft
    INSERT INTO milestone_drafts (contract_id, state)
    VALUES (p_contract_id, 'STUDENT_EDITING')
    RETURNING id INTO v_draft_id;

    -- Create Version 1
    INSERT INTO milestone_versions (draft_id, version_number, created_by)
    VALUES (v_draft_id, 1, auth.uid())
    RETURNING id INTO v_ver_id;

    -- Create Default Snapshots
    INSERT INTO milestone_snapshots (version_id, position, title, amount_minor, criteria)
    VALUES (
        v_ver_id, 
        0, 
        'Pierwszy Etap', 
        p_total_amount_minor, 
        'Opis zakresu prac...'
    );

    -- Update Pointers
    UPDATE milestone_drafts
    SET current_version_id = v_ver_id
    WHERE id = v_draft_id;

    RETURN v_draft_id;
END;
$$;


-- 2. Save Version (Auto-save)
DROP FUNCTION IF EXISTS draft_save_version(uuid, uuid, jsonb);

CREATE OR REPLACE FUNCTION draft_save_version(
    p_contract_id UUID,
    p_base_version_id UUID, -- Optional input for optimistic locking (ignored for now)
    p_items JSONB -- Array of items
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_current_ver_num INTEGER;
    v_new_ver_id UUID;
    v_item JSONB;
BEGIN
    SELECT id, current_version_id INTO v_draft_id, v_new_ver_id -- repurpose v_new_ver_id temp
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Get current version number
    SELECT version_number INTO v_current_ver_num 
    FROM milestone_versions WHERE id = v_new_ver_id;

    IF v_current_ver_num IS NULL THEN v_current_ver_num := 0; END IF;

    -- Create New Version
    INSERT INTO milestone_versions (draft_id, version_number, created_by)
    VALUES (v_draft_id, v_current_ver_num + 1, auth.uid())
    RETURNING id INTO v_new_ver_id;

    -- Insert Items
    IF p_items IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO milestone_snapshots (
                version_id, 
                position, 
                title, 
                amount_minor, 
                criteria
            )
            VALUES (
                v_new_ver_id,
                (v_item->>'position')::INTEGER,
                (v_item->>'title'),
                (v_item->>'amount_minor')::BIGINT,
                (v_item->>'criteria')
            );
        END LOOP;
    END IF;

    -- Update Draft Pointer
    UPDATE milestone_drafts
    SET current_version_id = v_new_ver_id,
        updated_at = now()
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'version_id', v_new_ver_id);
END;
$$;


-- 3. Submit (Student -> Company)
DROP FUNCTION IF EXISTS draft_submit(uuid);

CREATE OR REPLACE FUNCTION draft_submit(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
    v_current_ver_id UUID;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    IF v_state != 'STUDENT_EDITING' THEN
         RAISE EXCEPTION 'Invalid transition from % to WAITING_COMPANY_REVIEW', v_state;
    END IF;

    -- Validate Budget (Must be OK to submit)
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;
    
    -- CALL VALIDATOR
    v_validation := validate_draft_budget(v_draft_id, v_items);
    
    IF (v_validation->>'status') != 'OK' THEN
        RAISE EXCEPTION 'Budget validation failed: %', (v_validation->>'status');
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_COMPANY_REVIEW',
        review_version_id = v_current_ver_id -- Lock this version for review
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'WAITING_COMPANY_REVIEW');
END;
$$;

COMMIT;
