CREATE OR REPLACE FUNCTION validate_draft_budget(
    p_draft_id UUID,
    p_items JSONB -- Array of { amount_minor: 123 }
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_contract_id UUID;
    v_total_budget_minor BIGINT;
    v_sum_minor BIGINT;
    v_item JSONB;
    v_diff BIGINT;
    v_contract_found BOOLEAN;
BEGIN
    -- 1. Get Contract Budget from the draft's parent contract
    SELECT c.budget, c.id INTO v_total_budget_minor, v_contract_id
    FROM milestone_drafts d
    JOIN contracts c ON c.id = d.contract_id
    WHERE d.id = p_draft_id;

    -- Basic check if contract exists
    IF v_contract_id IS NULL THEN
        RETURN jsonb_build_object('status', 'ERROR', 'message', 'Contract not found for draft');
    END IF;

    -- Convert numeric budget (e.g. 100.00) to minor units (10000)
    -- Handle NULL budget as 0
    v_total_budget_minor := COALESCE(v_total_budget_minor, 0) * 100;

    -- 2. Sum Items from the passed JSON payload
    v_sum_minor := 0;
    IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Accumulate amount_minor (safely casting)
            v_sum_minor := v_sum_minor + COALESCE((v_item->>'amount_minor')::BIGINT, 0);
        END LOOP;
    END IF;

    -- 3. Calculate Difference (Budget - Sum)
    -- Positive diff = UNDER (Budget > Sum, money left)
    -- Negative diff = OVER (Budget < Sum, overspent)
    -- Zero = OK
    v_diff := v_total_budget_minor - v_sum_minor;

    -- 4. Return Validation Result
    IF v_diff = 0 THEN
        RETURN jsonb_build_object(
            'status', 'OK', 
            'diff', 0
        );
    ELSIF v_diff > 0 THEN
        RETURN jsonb_build_object(
            'status', 'UNDER', 
            'diff', v_diff,
            'message', format('Brakuje %s PLN', (v_diff / 100.0)::numeric(10,2))
        );
    ELSE
        RETURN jsonb_build_object(
            'status', 'OVER', 
            'diff', v_diff,
            'message', format('Przekroczono o %s PLN', (abs(v_diff) / 100.0)::numeric(10,2))
        );
    END IF;
END;
$$;
