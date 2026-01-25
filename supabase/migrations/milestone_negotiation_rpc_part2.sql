-- MILESTONE NEGOTIATION LOGIC (RPCs)
-- Part 2: Negotiation Loop & Approval

BEGIN;

-- 5. Request Changes (Company: S1 -> S2)
-- Company sees the plan, rejects it, and wants to propose changes.
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
         RAISE EXCEPTION 'Invalid transition from % to COMPANY_EDITING', v_state;
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'COMPANY_EDITING'
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'COMPANY_EDITING');
END;
$$;


-- 6. Send Changes (Company: S2 -> S3)
-- Company submits their counter-proposal to Student.
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
         RAISE EXCEPTION 'Invalid transition from %', v_state;
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
        company_changes_version_id = v_current_ver_id -- Lock this version for student to see diff
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;


-- 7. Approve (Company: S1 -> S4)
-- Company accepts the plan. Writes to Final Milestones table and updates contract.
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
    v_rec RECORD;
BEGIN
    SELECT id, state, review_version_id INTO v_draft_id, v_state, v_review_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Verification
    IF v_state != 'WAITING_COMPANY_REVIEW' THEN
         RAISE EXCEPTION 'Invalid transition from % to APPROVED', v_state;
    END IF;

    -- Verify the REVIEW VERSION budget (source of truth is what was submitted)
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

    -- 2. Clear Existing Final Milestones (Legacy/Cleanup)
    DELETE FROM milestones WHERE contract_id = p_contract_id;

    -- 3. Insert Final Milestones from Snapshot
    -- IMPORTANT: Set status 'awaiting_funding' for the FIRST one, others 'pending'
    -- This triggers the Escrow badge in StatusTab.
    INSERT INTO milestones (
        contract_id,
        title,
        amount, -- numeric
        due_at,
        acceptance_criteria,
        idx,
        created_by,
        updated_by,
        status -- Explicit status
    )
    SELECT
        p_contract_id,
        s.title,
        (s.amount_minor / 100.0), 
        null, 
        s.criteria,
        s.position,
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        CASE WHEN s.position = 0 THEN 'awaiting_funding' ELSE 'pending' END
    FROM milestone_snapshots s
    WHERE s.version_id = v_review_ver_id
    ORDER BY s.position;

    -- 4. Update Contract Status
    UPDATE contracts
    SET terms_status = 'agreed',
        terms_version = terms_version + 1,
        company_approved_version = terms_version + 1, -- Sync
        student_approved_version = terms_version + 1,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'APPROVED');
END;
$$;

COMMIT;
