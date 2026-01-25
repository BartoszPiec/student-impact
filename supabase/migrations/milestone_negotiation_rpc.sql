-- MILESTONE NEGOTIATION LOGIC (RPCs)
-- Part 1: Validation & Core Transitions

BEGIN;

-- 1. Helper: Budget Validation Logic
-- Returns JSON object with status and details
CREATE OR REPLACE FUNCTION validate_draft_budget(
    p_draft_id UUID,
    p_milestone_items JSONB -- Array of {amount_minor: int}
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_agreed_total BIGINT;
    v_sum BIGINT := 0;
    v_item JSONB;
    v_amount BIGINT;
BEGIN
    SELECT agreed_total_minor INTO v_agreed_total 
    FROM milestone_drafts WHERE id = p_draft_id;

    -- Calculate Sum & Check for Negatives
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_milestone_items)
    LOOP
        v_amount := (v_item->>'amount_minor')::BIGINT;
        IF v_amount < 0 THEN
            RETURN jsonb_build_object('status', 'INVALID', 'reason', 'Negative amount found');
        END IF;
        v_sum := v_sum + v_amount;
    END LOOP;

    IF v_sum = v_agreed_total THEN
        RETURN jsonb_build_object('status', 'OK', 'delta', 0);
    ELSIF v_sum < v_agreed_total THEN
        RETURN jsonb_build_object('status', 'UNDER', 'delta', v_agreed_total - v_sum);
    ELSE
        RETURN jsonb_build_object('status', 'OVER', 'delta', v_sum - v_agreed_total);
    END IF;
END;
$$;

-- 2. Initialize Draft (Bootstrap)
-- Called when opening negotiation for the first time
CREATE OR REPLACE FUNCTION draft_initialize(
    p_contract_id UUID,
    p_total_amount_minor BIGINT
)
RETURNS UUID -- Returns draft_id
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Check if exists
    SELECT id INTO v_draft_id FROM milestone_drafts WHERE contract_id = p_contract_id;
    
    IF v_draft_id IS NOT NULL THEN
        -- Verify total match? Optional. For now just return existing.
        RETURN v_draft_id;
    END IF;

    -- Create Draft Header
    INSERT INTO milestone_drafts (contract_id, agreed_total_minor, state)
    VALUES (p_contract_id, p_total_amount_minor, 'STUDENT_EDITING')
    RETURNING id INTO v_draft_id;

    RETURN v_draft_id;
END;
$$;

-- 3. Save Version (The main "Update" action)
-- Creates a NEW version snapshot.
CREATE OR REPLACE FUNCTION draft_save_version(
    p_contract_id UUID,
    p_base_version_id UUID, -- For optimistic locking / lineage
    p_items JSONB           -- Array of {client_id, title, amount_minor, criteria, position}
)
RETURNS TABLE (new_version_id UUID, validation_result JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
    v_role draft_author_role;
    v_new_ver_id UUID;
    v_item JSONB;
    v_next_ver_num INT;
    v_user_role text;
BEGIN
    -- 1. Get Draft Context
    SELECT id, state INTO v_draft_id, v_state 
    FROM milestone_drafts WHERE contract_id = p_contract_id;
    
    IF v_draft_id IS NULL THEN RAISE EXCEPTION 'Draft not initialized'; END IF;

    -- 2. Determine User Role
    IF auth.uid() = (SELECT student_id FROM contracts WHERE id = p_contract_id) THEN
        v_role := 'STUDENT';
    ELSIF auth.uid() = (SELECT company_id FROM contracts WHERE id = p_contract_id) THEN
        v_role := 'COMPANY';
    ELSE
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 3. State Guard
    -- Student can edit in S0 (STUDENT_EDITING) or S3 (WAITING_STUDENT_REVIEW)
    -- Company can edit in S2 (COMPANY_EDITING)
    IF v_role = 'STUDENT' AND v_state NOT IN ('STUDENT_EDITING', 'WAITING_STUDENT_REVIEW') THEN
        RAISE EXCEPTION 'Student cannot edit in state %', v_state;
    END IF;
    IF v_role = 'COMPANY' AND v_state NOT IN ('COMPANY_EDITING') THEN
        RAISE EXCEPTION 'Company cannot edit in state %', v_state;
    END IF;

    -- 4. Calculate Version Number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_ver_num 
    FROM draft_versions WHERE draft_id = v_draft_id;

    -- 5. Create Version Header
    INSERT INTO draft_versions (draft_id, version_number, author_role, base_version_id)
    VALUES (v_draft_id, v_next_ver_num, v_role, p_base_version_id)
    RETURNING id INTO v_new_ver_id;

    -- 6. Insert Snapshots
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO milestone_snapshots (
            version_id, milestone_client_id, title, amount_minor, criteria, position
        ) VALUES (
            v_new_ver_id,
            (v_item->>'client_id')::UUID,
            v_item->>'title',
            (v_item->>'amount_minor')::BIGINT,
            COALESCE(v_item->'criteria', '[]'::jsonb),
            (v_item->>'position')::INT
        );
    END LOOP;

    -- 7. Update Draft Head Pointer
    UPDATE milestone_drafts 
    SET current_version_id = v_new_ver_id, updated_at = now()
    WHERE id = v_draft_id;

    -- 8. Return Validation (to give frontend instant feedback)
    validation_result := validate_draft_budget(v_draft_id, p_items);
    new_version_id := v_new_ver_id;
    RETURN NEXT;
END;
$$;

-- 4. Submit (Student -> S1)
CREATE OR REPLACE FUNCTION draft_submit(
    p_contract_id UUID
)
RETURNS JSONB -- validation status
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_current_ver_id UUID;
    v_state draft_state;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Verification
    IF v_state NOT IN ('STUDENT_EDITING', 'WAITING_STUDENT_REVIEW') THEN
         RAISE EXCEPTION 'Invalid transition from %', v_state;
    END IF;

    -- Validate Budget Hard
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation; -- Return error, don't transition
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_COMPANY_REVIEW',
        review_version_id = v_current_ver_id -- Lock this version for review
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;

COMMIT;
