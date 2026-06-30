-- 20260124_add_negotiation_notifications.sql
-- Adds missing create_notification calls to:
-- 1. draft_submit (Student submits -> Notify Company 'terms_proposed')
-- 2. draft_send_changes (Company submits -> Notify Student 'terms_updated')
-- 3. draft_approve (Company approves -> Notify Student 'terms_agreed')

BEGIN;

-- Helper to ensure secure notification function exists (from previous migrations)
-- We assume create_notification(user_id, type, payload) exists.

-- 1. Submit (Student -> S1)
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
    v_company_id UUID;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    SELECT company_id INTO v_company_id FROM contracts WHERE id = p_contract_id;

    -- Verification
    IF v_state NOT IN ('STUDENT_EDITING', 'WAITING_STUDENT_REVIEW') THEN
         RETURN jsonb_build_object('status', 'ERROR', 'reason', 'Invalid State: ' || v_state);
    END IF;

    -- Validate Budget Hard
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation; 
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_COMPANY_REVIEW',
        review_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    -- NOTIFICATION
    PERFORM public.create_notification(
        v_company_id,
        'terms_proposed', -- Using existing type or new 'milestone_draft_submitted'
        jsonb_build_object('contract_id', p_contract_id, 'draft_id', v_draft_id)
    );

    RETURN v_validation;
END;
$$;


-- 2. Send Changes (Company -> S3)
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
    v_student_id UUID;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    SELECT student_id INTO v_student_id FROM contracts WHERE id = p_contract_id;

    -- Verification
    IF v_state != 'COMPANY_EDITING' THEN
         RETURN jsonb_build_object('status', 'ERROR', 'reason', 'Invalid State: ' || v_state);
    END IF;

    -- Validate Budget Hard
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation;
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_STUDENT_REVIEW',
        company_changes_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    -- NOTIFICATION
    PERFORM public.create_notification(
        v_student_id,
        'terms_updated', -- Company sent counter-proposal
        jsonb_build_object('contract_id', p_contract_id, 'draft_id', v_draft_id)
    );

    RETURN v_validation;
END;
$$;


-- 3. Approve (Company -> S4)
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
    v_student_id UUID;
BEGIN
    SELECT id, state, review_version_id INTO v_draft_id, v_state, v_review_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    SELECT student_id INTO v_student_id FROM contracts WHERE id = p_contract_id;

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
        (s.amount_minor / 100.0), 
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
        status = 'awaiting_funding',
        terms_version = terms_version + 1,
        company_approved_version = terms_version + 1,
        student_approved_version = terms_version + 1,
        updated_at = now()
    WHERE id = p_contract_id;

    -- NOTIFICATION
    PERFORM public.create_notification(
        v_student_id,
        'terms_agreed',
        jsonb_build_object('contract_id', p_contract_id)
    );

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'APPROVED');
END;
$$;

COMMIT;
