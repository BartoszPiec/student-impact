-- FIX COMPANY ACTIONS (Send Changes, Request Changes, Approve)
-- These RPCs are needed for the Company to interact with the negotiation.

-- 1. SEARCH PATH & SECURITY
-- We force search_path to public to avoid "column does not exist" type errors if role is weird.

-- 2. DRAFT SEND CHANGES (Company submits their edit)
CREATE OR REPLACE FUNCTION public.draft_send_changes(p_contract_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
    v_current_ver_id UUID;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM public.milestone_drafts WHERE contract_id = p_contract_id;

    IF v_draft_id IS NULL THEN RAISE EXCEPTION 'Draft not found'; END IF;

    -- Strict State Check
    IF v_state != 'COMPANY_EDITING' THEN
        RAISE EXCEPTION 'Invalid transition from % (Expected COMPANY_EDITING). Status might have changed.', v_state;
    END IF;

    -- Validate Budget (Using our fixed validator)
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM public.milestone_snapshots WHERE version_id = v_current_ver_id;
    
    v_validation := public.validate_draft_budget(v_draft_id, v_items);
    IF (v_validation->>'status') != 'OK' THEN 
        RAISE EXCEPTION 'Budget validation failed: %', (v_validation->>'status'); 
    END IF;

    -- Update Logic:
    -- 1. Set state to WAITING_STUDENT_REVIEW
    -- 2. Set 'company_changes_version_id' to the current version (so Student sees it)
    UPDATE public.milestone_drafts 
    SET state = 'WAITING_STUDENT_REVIEW', 
        company_changes_version_id = v_current_ver_id,
        updated_at = now()
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'WAITING_STUDENT_REVIEW');
END;
$$;


-- 3. DRAFT REQUEST CHANGES (Company rejects Student proposal)
CREATE OR REPLACE FUNCTION public.draft_request_changes(p_contract_id UUID, p_feedback TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
BEGIN
    SELECT id, state INTO v_draft_id, v_state
    FROM public.milestone_drafts WHERE contract_id = p_contract_id;

    IF v_state != 'WAITING_COMPANY_REVIEW' THEN
        RAISE EXCEPTION 'Invalid transition from %', v_state;
    END IF;

    -- Move back to STUDENT_EDITING
    -- We don't change versions here, just state. Student will edit starting from what they sent.
    -- Optionally we could save feedback in a field if we had one. For now just state transition.
    UPDATE public.milestone_drafts 
    SET state = 'STUDENT_EDITING',
        updated_at = now()
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'STUDENT_EDITING');
END;
$$;


-- 4. DRAFT APPROVE (Company approves Student proposal OR Student approves Company changes)
-- This function needs to handle both directions or just final approval.
-- Assuming "Final Approval" makes it APPROVED and locks it.
CREATE OR REPLACE FUNCTION public.draft_approve(p_contract_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
    v_target_ver_id UUID;
    v_snapshot RECORD;
    v_milestone_id UUID;
BEGIN
    SELECT id, state, current_version_id, review_version_id, company_changes_version_id 
    INTO v_draft_id, v_state, v_target_ver_id, v_target_ver_id, v_target_ver_id -- logic below corrects this
    FROM public.milestone_drafts WHERE contract_id = p_contract_id;

    IF v_draft_id IS NULL THEN
        RETURN jsonb_build_object('status', 'ERROR', 'message', 'Draft not found for this contract');
    END IF;

    -- Logic: Which version is being approved?
    IF v_state = 'WAITING_COMPANY_REVIEW' THEN
        -- Company approves Student's review_version
        SELECT review_version_id INTO v_target_ver_id FROM public.milestone_drafts WHERE id = v_draft_id;
    ELSIF v_state = 'WAITING_STUDENT_REVIEW' THEN
        -- Student approves Company's changes_version
        SELECT company_changes_version_id INTO v_target_ver_id FROM public.milestone_drafts WHERE id = v_draft_id;
    ELSE
        RETURN jsonb_build_object('status', 'ERROR', 'message', format('Cannot approve in state %s', v_state));
    END IF;

    -- 1. Update Draft State
    UPDATE public.milestone_drafts SET state = 'APPROVED' WHERE id = v_draft_id;

    -- 2. DELETE OLD MILESTONES from Contract (Replace Logic)
    DELETE FROM public.milestones WHERE contract_id = p_contract_id;

    -- 3. INSERT NEW MILESTONES based on Snapshot
    FOR v_snapshot IN SELECT * FROM public.milestone_snapshots WHERE version_id = v_target_ver_id ORDER BY position LOOP
        INSERT INTO public.milestones (
            contract_id, 
            idx, 
            title, 
            acceptance_criteria, 
            amount, 
            status,
            created_by,
            updated_by
        )
        SELECT 
            p_contract_id,
            v_snapshot.position,
            v_snapshot.title,
            v_snapshot.criteria, -- Description/Criteria mapping
            (v_snapshot.amount_minor / 100.0), -- Convert back to main unit
            'awaiting_funding', -- Default status
            c.company_id,
            c.company_id
        FROM public.contracts c WHERE c.id = p_contract_id;
    END LOOP;

    -- 4. Mark Terms as Agreed
    UPDATE public.contracts SET terms_status = 'agreed' WHERE id = p_contract_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'APPROVED');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', SQLERRM, 'details', SQLSTATE);
END;
$$;
