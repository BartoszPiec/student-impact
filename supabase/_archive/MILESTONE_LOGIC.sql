-- RPC: Submit work for a specific milestone
CREATE OR REPLACE FUNCTION public.submit_milestone_work(
    p_milestone_id UUID,
    p_description TEXT,
    p_files JSONB,
    p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_m_status TEXT;
    v_contract_id UUID;
    v_company_id UUID;
    v_conf_application_id UUID; 
    v_conf_service_order_id UUID;
BEGIN
    -- Check current status and get contract_id
    SELECT status, contract_id INTO v_m_status, v_contract_id 
    FROM public.milestones 
    WHERE id = p_milestone_id;
    
    -- Get context from contract
    SELECT company_id, application_id, service_order_id 
    INTO v_company_id, v_conf_application_id, v_conf_service_order_id
    FROM public.contracts
    WHERE id = v_contract_id;

    -- Logic to satisfy deliverables_source_check (XOR constraint)
    IF v_conf_service_order_id IS NOT NULL THEN
        -- It is a Service Order contract
        v_conf_application_id := NULL; -- Ensure app_id is null
    ELSE
        -- It is an Application contract
        -- Fallback: If contract missing application_id, try param
        IF v_conf_application_id IS NULL THEN
            IF p_application_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.applications WHERE id = p_application_id) THEN
                v_conf_application_id := p_application_id;
            END IF;
        END IF;
        -- If still null, we might fail constraint, but that means data is corrupted (orphan contract)
    END IF;

    IF v_m_status NOT IN ('funded', 'in_progress', 'released') THEN
        -- Allow submission
    END IF;

    -- Insert deliverable
    INSERT INTO public.deliverables (
        application_id,
        service_order_id, 
        student_id,    
        company_id,    
        contract_id,   
        description, 
        files, 
        status,
        milestone_id,
        version
    ) VALUES (
        v_conf_application_id,
        v_conf_service_order_id,
        auth.uid(),
        v_company_id,
        v_contract_id,
        p_description,
        p_files,
        'pending',
        p_milestone_id,
        1
    );

    -- Update milestone status
    UPDATE public.milestones 
    SET status = 'delivered'
    WHERE id = p_milestone_id;

    RETURN jsonb_build_object('status', 'OK');
END;
$$;

-- RPC: Review milestone work (Accept/Reject)
CREATE OR REPLACE FUNCTION public.review_milestone_work(
    p_milestone_id UUID,
    p_decision TEXT, -- 'accepted' or 'rejected'
    p_feedback TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_decision = 'accepted' THEN
        -- 1. Mark milestone as completed (implies funds released/paid)
        UPDATE public.milestones 
        SET status = 'completed',
            delivered_at = now(),
            accepted_at = now()
        WHERE id = p_milestone_id;

        -- 2. Check if ALL milestones are completed to close the contract
        IF NOT EXISTS (
            SELECT 1 FROM public.milestones 
            WHERE contract_id = (SELECT contract_id FROM public.milestones WHERE id = p_milestone_id)
            AND status != 'completed'
        ) THEN
            UPDATE public.contracts 
            SET status = 'completed'
            WHERE id = (SELECT contract_id FROM public.milestones WHERE id = p_milestone_id);
        END IF;

    ELSIF p_decision = 'rejected' THEN
        -- Revert status to in_progress for corrections
        UPDATE public.milestones 
        SET status = 'in_progress'
        WHERE id = p_milestone_id;
    END IF;

    -- Update linked deliverables status
    -- We update ALL pending deliverables for this milestone to the decision status
    -- This ensures the history reflects the review.
    UPDATE public.deliverables
    SET status = CASE WHEN p_decision = 'accepted' THEN 'accepted' ELSE 'rejected' END,
        company_feedback = p_feedback,
        updated_at = now()
    WHERE milestone_id = p_milestone_id 
    AND status = 'pending';

    RETURN jsonb_build_object('status', 'OK', 'decision', p_decision);
END;
$$;
