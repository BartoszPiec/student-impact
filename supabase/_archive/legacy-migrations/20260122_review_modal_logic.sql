-- Migration: 20260122_review_modal_logic.sql
-- Purpose: Change review_delivery_v2 to set status 'delivered' instead of 'completed' when all done.
-- This allows the Frontend to show a "Review Required" modal before moving to 'completed'.

CREATE OR REPLACE FUNCTION public.review_delivery_v2(
    p_milestone_id UUID,
    p_decision TEXT, -- 'accepted', 'rejected'
    p_feedback TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_milestone record;
    v_contract record;
    v_latest_deliv_id UUID;
    v_all_released BOOLEAN;
BEGIN
    -- 1. Validate Milestone
    SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;

    -- 2. Validate Contract
    SELECT * INTO v_contract FROM public.contracts WHERE id = v_milestone.contract_id;

    -- Security Check: Caller must be the Company
    IF v_contract.company_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Only client company can review work';
    END IF;

    -- 3. Handle Decision
    IF p_decision = 'accepted' THEN
        -- Accept Milestone -> Auto-Release Funds (Simple Model)
        UPDATE public.milestones 
        SET status = 'released', -- Signal payout complete
            accepted_at = now(),
            released_at = now()
        WHERE id = p_milestone_id;

        -- Check Contract Completion
        v_all_released := NOT EXISTS (
            SELECT 1 FROM public.milestones 
            WHERE contract_id = v_contract.id 
            AND status NOT IN ('released', 'accepted')
        );

        IF v_all_released THEN
            -- CHANGE: Don't set 'completed' yet. Set 'delivered' to signal "All Done, Waiting Review".
            UPDATE public.contracts 
            SET status = 'delivered' 
            WHERE id = v_contract.id AND status != 'delivered';
        END IF;

    ELSIF p_decision = 'rejected' THEN
        -- Reject Milestone -> Back to in_progress
        UPDATE public.milestones 
        SET status = 'in_progress'
        WHERE id = p_milestone_id;
        
        -- If contract was delivered, maybe revert it?
        UPDATE public.contracts
        SET status = 'active'
        WHERE id = v_contract.id AND status = 'delivered';

    ELSE
        RAISE EXCEPTION 'Invalid decision: %', p_decision;
    END IF;

    -- 4. Update Deliverables History
    SELECT id INTO v_latest_deliv_id 
    FROM public.deliverables 
    WHERE milestone_id = p_milestone_id AND status = 'pending'
    ORDER BY created_at DESC 
    LIMIT 1;

    IF v_latest_deliv_id IS NOT NULL THEN
        UPDATE public.deliverables
        SET status = CASE WHEN p_decision = 'accepted' THEN 'accepted' ELSE 'rejected' END,
            company_feedback = p_feedback,
            updated_at = now()
        WHERE id = v_latest_deliv_id;
    END IF;

    -- Cleanup older pending
    UPDATE public.deliverables
    SET status = 'rejected',
        company_feedback = 'Odrzucono automatycznie (zastąpione nowszą wersją)',
        updated_at = now()
    WHERE milestone_id = p_milestone_id 
      AND status = 'pending' 
      AND id != COALESCE(v_latest_deliv_id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- 5. Send Notification
    BEGIN
        IF p_decision = 'accepted' THEN
             PERFORM public.create_notification(
                v_contract.student_id,
                'milestone_accepted',
                jsonb_build_object(
                    'milestone_id', p_milestone_id,
                    'contract_id', v_contract.id,
                    'title', v_milestone.title,
                    'amount', v_milestone.amount
                )
            );
        ELSIF p_decision = 'rejected' THEN
             PERFORM public.create_notification(
                v_contract.student_id,
                'milestone_rejected',
                jsonb_build_object(
                    'milestone_id', p_milestone_id,
                    'contract_id', v_contract.id,
                    'title', v_milestone.title,
                    'reason', p_feedback
                )
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    RETURN jsonb_build_object(
        'status', 'OK', 
        'decision', p_decision, 
        'contract_status', (SELECT status FROM public.contracts WHERE id = v_contract.id)
    );
END;
$$;
