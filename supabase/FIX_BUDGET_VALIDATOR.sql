-- FORCE UPDATE VALIDATOR TO SECURITY DEFINER (FIX COLUMN NAME)
-- The column in 'contracts' is 'total_amount', not 'budget'.

CREATE OR REPLACE FUNCTION public.validate_draft_budget(p_draft_id UUID, p_items JSONB)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, extensions
AS $$
DECLARE
    v_contract_id UUID;
    v_total_budget numeric;
    v_sum_items numeric;
    v_delta numeric;
BEGIN
    -- Explicit table references
    SELECT c.contract_id INTO v_contract_id FROM public.milestone_drafts c WHERE c.id = p_draft_id;
    
    IF v_contract_id IS NULL THEN
        RAISE EXCEPTION 'Draft % not found', p_draft_id;
    END IF;

    -- FIX: Use 'total_amount' instead of 'budget'
    SELECT c.total_amount INTO v_total_budget FROM public.contracts c WHERE c.id = v_contract_id;
    
    IF v_total_budget IS NULL THEN
        RAISE NOTICE 'Contract % has NULL total_amount', v_contract_id;
        v_total_budget := 0;
    END IF;
    
    -- Sum items
    SELECT COALESCE(SUM((x->>'amount_minor')::numeric / 100.0), 0) INTO v_sum_items
    FROM jsonb_array_elements(p_items) t(x);

    v_delta := v_total_budget - v_sum_items;
    
    -- Tolerance 0.01
    IF abs(v_delta) < 0.01 THEN
        RETURN jsonb_build_object('status', 'OK', 'delta', 0);
    ELSIF v_delta > 0 THEN
        RETURN jsonb_build_object('status', 'UNDER', 'delta', v_delta);
    ELSE
        RETURN jsonb_build_object('status', 'OVER', 'delta', v_delta);
    END IF;
END;
$$;
