-- FIX DRAFT SUBMIT LOGIC
-- Problem: draft_submit rejected submissions from WAITING_STUDENT_REVIEW (counter-proposal).
-- Solution: Allow WAITING_STUDENT_REVIEW in the state check.

CREATE OR REPLACE FUNCTION public.draft_submit(p_contract_id UUID)
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

    -- ALLOW BOTH 'STUDENT_EDITING' AND 'WAITING_STUDENT_REVIEW' (Counter-Proposal)
    IF v_state NOT IN ('STUDENT_EDITING', 'WAITING_STUDENT_REVIEW') THEN 
        RAISE EXCEPTION 'Invalid transition from %', v_state; 
    END IF;

    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM public.milestone_snapshots WHERE version_id = v_current_ver_id;
    
    v_validation := public.validate_draft_budget(v_draft_id, v_items);
    IF (v_validation->>'status') != 'OK' THEN 
        RAISE EXCEPTION 'Budget validation failed: %', (v_validation->>'status'); 
    END IF;

    -- Update to WAITING_COMPANY_REVIEW
    -- Also update 'review_version_id' to point to current (what company will see)
    UPDATE public.milestone_drafts 
    SET state = 'WAITING_COMPANY_REVIEW', 
        review_version_id = v_current_ver_id,
        updated_at = now()
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'WAITING_COMPANY_REVIEW');
END;
$$;
