-- 20260124_force_cleanup_negotiation_v2.sql
-- FORCE CLEANUP V2: Explicitly drop any legacy versions of these functions
-- to ensure they don't raise P0001 exceptions or 42P13 parameter name conflicts.

BEGIN;

-- 1. Drop EVERYTHING related to negotiation RPCs
-- We use CASCADE to ensure dependencies are handled, though mostly these are standalone.
DROP FUNCTION IF EXISTS public.validate_draft_budget(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.draft_submit(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.draft_send_changes(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.draft_request_changes(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.draft_approve(uuid) CASCADE;

-- 2. Helper: Budget Validation Logic (Ensure it exists)
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


-- 3. Re-create Send Changes (Company) (JSONB)
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
        RETURN v_validation; -- Return error struct, DO NOT RAISE EXCEPTION
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_STUDENT_REVIEW',
        company_changes_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;


-- 4. Re-create Submit (Student) (JSONB)
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
        RETURN v_validation; -- Return error struct, DO NOT RAISE EXCEPTION
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_COMPANY_REVIEW',
        review_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;

-- 5. Re-create Request Changes (Company) (JSONB)
CREATE OR REPLACE FUNCTION draft_request_changes(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
BEGIN
    SELECT id, state INTO v_draft_id, v_state
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Verification
    IF v_state != 'WAITING_COMPANY_REVIEW' THEN
         RETURN jsonb_build_object('status', 'ERROR', 'reason', 'Invalid State: ' || v_state);
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'COMPANY_EDITING'
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'COMPANY_EDITING');
END;
$$;


-- 6. Re-create Approve (Company) (JSONB)
CREATE OR REPLACE FUNCTION draft_approve(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_review_ver_id UUID;
    v_state draft_state;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, review_version_id INTO v_draft_id, v_state, v_review_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Verification
    IF v_state != 'WAITING_COMPANY_REVIEW' THEN
         RETURN jsonb_build_object('status', 'ERROR', 'reason', 'Invalid State: ' || v_state);
    END IF;

    -- Verify the REVIEW VERSION budget
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_review_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation;
    END IF;

    -- 1. Update Draft State
    UPDATE milestone_drafts
    SET state = 'APPROVED'
    WHERE id = v_draft_id;

    -- 2. Clear Existing Final Milestones
    DELETE FROM milestones WHERE contract_id = p_contract_id;

    -- 3. Insert Final Milestones
    INSERT INTO milestones (
        contract_id,
        title,
        amount,
        acceptance_criteria,
        idx,
        created_by,
        updated_by,
        status
    )
    SELECT
        p_contract_id,
        s.title,
        (s.amount_minor / 100.0), -- Convert back to major units
        s.criteria,
        s.position,
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        CASE WHEN s.position = 0 THEN 'awaiting_funding' ELSE 'draft' END
    FROM milestone_snapshots s
    WHERE s.version_id = v_review_ver_id
    ORDER BY s.position;

    -- 4. Update Contract Status
    UPDATE contracts
    SET terms_status = 'agreed',
        status = 'awaiting_funding', -- Sync with first milestone
        terms_version = terms_version + 1,
        company_approved_version = terms_version + 1,
        student_approved_version = terms_version + 1,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'APPROVED');
END;
$$;

COMMIT;
