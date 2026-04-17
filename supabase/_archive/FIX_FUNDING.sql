-- RPC: Fund the ENTIRE contract (all milestones)
CREATE OR REPLACE FUNCTION public.company_fund_contract(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT;
BEGIN
    -- 1. Update all milestones for this contract that are waiting for funding
    UPDATE public.milestones
    SET status = 'funded'
    WHERE contract_id = p_contract_id
    AND status = 'awaiting_funding';

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- 2. Update contract status to active
    UPDATE public.contracts 
    SET status = 'active'
    WHERE id = p_contract_id
    AND status != 'completed';

    RETURN jsonb_build_object(
        'status', 'OK',
        'funded_milestones', v_updated_count,
        'message', 'Contract fully funded'
    );
END;
$$;
