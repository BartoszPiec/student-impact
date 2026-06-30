-- ============================================================
-- RESET ORDER TO ESCROW (PENDING FUNDING)
-- Target ID: 5de321ff-ddc6-422a-b2a7-6d395be3ff95
-- ============================================================

DO $$
DECLARE
  v_target_id uuid := '5de321ff-ddc6-422a-b2a7-6d395be3ff95';
  v_contract_id uuid;
BEGIN

  -- 1. Find Contract
  SELECT id INTO v_contract_id
  FROM public.contracts
  WHERE application_id = v_target_id OR service_order_id = v_target_id
  LIMIT 1;

  IF v_contract_id IS NULL THEN
    RAISE NOTICE 'Contract not found for ID %', v_target_id;
    RETURN;
  END IF;

  -- 2. Reset Contract Status
  UPDATE public.contracts
  SET status = 'awaiting_funding',
      updated_at = now()
  WHERE id = v_contract_id;

  -- 3. Reset Milestones (All of them or just the first?)
  -- Resetting all to pending for simplicity of test
  UPDATE public.milestones
  SET status = 'awaiting_funding',
      funded_at = NULL,
      accepted_at = NULL,
      delivered_at = NULL,
      updated_at = now()
  WHERE contract_id = v_contract_id;

  -- 4. Reset Application Realization Status (if applicable)
  UPDATE public.applications
  SET realization_status = NULL
  WHERE id = v_target_id;

  RAISE NOTICE 'Order % reset to Escrow (Pending Funding).', v_target_id;

END $$;
