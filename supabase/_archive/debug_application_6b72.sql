-- ============================================================
-- DEBUG SCRIPT for App ID: 6b72ad79-0175-42bf-a100-6acf5485503f
-- Run this in Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_app_id uuid := '6b72ad79-0175-42bf-a100-6acf5485503f';
  v_exists boolean;
  v_status text;
  v_real_status text;
  v_contract_id uuid;
  v_offer_id uuid;
  v_company_id uuid;
BEGIN
  -- 1. Check existence and basic data
  SELECT EXISTS(SELECT 1 FROM public.applications WHERE id = v_app_id) INTO v_exists;
  
  IF NOT v_exists THEN
    RAISE NOTICE '❌ Application % DOES NOT EXIST.', v_app_id;
    RETURN;
  END IF;

  SELECT status, realization_status, contract_id, offer_id 
  INTO v_status, v_real_status, v_contract_id, v_offer_id
  FROM public.applications 
  WHERE id = v_app_id;

  RAISE NOTICE '✅ Application Found:';
  RAISE NOTICE '   Status: %', v_status;
  RAISE NOTICE '   Realization Status: %', v_real_status;
  RAISE NOTICE '   Contract ID: %', v_contract_id;
  RAISE NOTICE '   Offer ID: %', v_offer_id;

  -- 2. Check Offer Owner (Company)
  SELECT company_id INTO v_company_id FROM public.offers WHERE id = v_offer_id;
  RAISE NOTICE '   Offer Owner (Company ID): %', v_company_id;

  -- 3. Diagnosis
  IF v_status <> 'accepted' THEN
    RAISE NOTICE '⚠️ WARNING: Status is NOT "accepted". Backfill script skipped this.';
  END IF;

  IF v_contract_id IS NULL THEN
    RAISE NOTICE '⚠️ WARNING: No Contract created yet.';
    
    -- Attempt Fix if it looks valid
    IF v_status = 'accepted' OR v_real_status IN ('in_progress','delivered','completed') THEN
       RAISE NOTICE '🛠️ Attempting to FIX (Force Contract Creation)...';
       
       -- Force update status to accepted if needed for ensuring contract
       IF v_status <> 'accepted' THEN
         UPDATE public.applications SET status = 'accepted' WHERE id = v_app_id;
         RAISE NOTICE '   -> Forced status to "accepted"';
       END IF;

       -- Create Contract
       SELECT public.ensure_contract_for_application(v_app_id) INTO v_contract_id;
       RAISE NOTICE '   -> Created Contract: %', v_contract_id;
       
       -- Sync Status
       UPDATE public.contracts SET status = 'active', updated_at = now() WHERE id = v_contract_id;
       UPDATE public.milestones SET status = 'funded', funded_at = now(), updated_at = now() WHERE contract_id = v_contract_id;
       
       RAISE NOTICE '✅ FIXED. Contract created and funded.';
    END IF;
  ELSE
    RAISE NOTICE 'INFO: Contract already exists.';
  END IF;

END $$;
