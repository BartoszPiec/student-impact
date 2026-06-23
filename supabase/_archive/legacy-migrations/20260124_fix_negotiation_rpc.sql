-- 20260124_fix_negotiation_rpc.sql
-- Force update of negotiation RPCs to ensure they return JSON validation results
-- instead of raising exceptions for budget mismatches.

BEGIN;

-- 1. Helper: Budget Validation Logic
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

    IF v_agreed_total IS NULL THEN
        RETURN jsonb_build_object('status', 'ERROR', 'reason', 'Draft not found');
    END IF;

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


-- 2. Send Changes (Company)
CREATE OR REPLACE FUNCTION draft_send_changes(
    p_contract_id UUID
)
RETURNS JSONB
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
    IF v_state != 'COMPANY_EDITING' THEN
         RETURN jsonb_build_object('status', 'ERROR', 'reason', 'Invalid State: ' || v_state);
    END IF;

    -- Validate Budget Hard
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation; -- Return error
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_STUDENT_REVIEW',
        company_changes_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;


-- 3. Submit (Student)
CREATE OR REPLACE FUNCTION draft_submit(
    p_contract_id UUID
)
RETURNS JSONB 
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
         RETURN jsonb_build_object('status', 'ERROR', 'reason', 'Invalid State: ' || v_state);
    END IF;

    -- Validate Budget Hard
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation; -- Return error
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_COMPANY_REVIEW',
        review_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;

COMMIT;
