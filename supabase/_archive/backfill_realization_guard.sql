-- ============================================================
-- Backfill Script for Realization Guard
-- EXECUTE THIS in Supabase SQL Editor to migrate existing orders.
-- ============================================================

DO $$
DECLARE
  r RECORD;
  v_contract_id uuid;
BEGIN
  RAISE NOTICE 'Starting Backfill...';

  -- ===========================
  -- 1. APPLICATIONS
  -- ===========================
  RAISE NOTICE 'Migrating Applications...';
  FOR r IN 
    SELECT * FROM public.applications 
    WHERE status = 'accepted' AND contract_id IS NULL 
  LOOP
    BEGIN
      -- Create contract (defaults to awaiting_funding)
      SELECT public.ensure_contract_for_application(r.id) INTO v_contract_id;
      
      -- If Application was already "delivered" or "completed", update Contract state
      IF r.realization_status = 'completed' THEN
        UPDATE public.contracts 
        SET status = 'completed', updated_at = now() 
        WHERE id = v_contract_id;
        
        UPDATE public.milestones 
        SET status = 'released', funded_at = now(), delivered_at = now(), accepted_at = now(), updated_at = now() 
        WHERE contract_id = v_contract_id;

      ELSIF r.realization_status = 'delivered' THEN
        UPDATE public.contracts 
        SET status = 'delivered', updated_at = now() 
        WHERE id = v_contract_id;
        
        UPDATE public.milestones 
        SET status = 'delivered', funded_at = now(), delivered_at = now(), updated_at = now() 
        WHERE contract_id = v_contract_id;

      ELSIF r.realization_status = 'in_progress' OR r.status = 'accepted' THEN
        -- We assume old orders are "Funded" implicitly or trust-based, 
        -- so we move them to 'active'/'funded' so they don't get stuck in 'awaiting_funding'.
        -- Unless you want to FORCE funding for old orders. 
        -- Here we assume migration = "make it work like before but with new structures".
        UPDATE public.contracts 
        SET status = 'active', updated_at = now() 
        WHERE id = v_contract_id;

        UPDATE public.milestones 
        SET status = 'funded', funded_at = now(), updated_at = now() 
        WHERE contract_id = v_contract_id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate Application %: %', r.id, SQLERRM;
    END;
  END LOOP;

  -- ===========================
  -- 2. SERVICE ORDERS
  -- ===========================
  RAISE NOTICE 'Migrating Service Orders...';
  FOR r IN 
    SELECT * FROM public.service_orders 
    WHERE status IN ('accepted', 'completed') AND contract_id IS NULL 
  LOOP
    BEGIN
      SELECT public.ensure_contract_for_service_order(r.id) INTO v_contract_id;

      IF r.status = 'completed' THEN
        UPDATE public.contracts 
        SET status = 'completed', updated_at = now() 
        WHERE id = v_contract_id;
        
        UPDATE public.milestones 
        SET status = 'released', funded_at = now(), delivered_at = now(), accepted_at = now(), updated_at = now() 
        WHERE contract_id = v_contract_id;
      
      ELSE -- 'accepted'
        -- Treating accepted service orders as active/funded
        UPDATE public.contracts 
        SET status = 'active', updated_at = now() 
        WHERE id = v_contract_id;
        
        UPDATE public.milestones 
        SET status = 'funded', funded_at = now(), updated_at = now() 
        WHERE contract_id = v_contract_id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate Service Order %: %', r.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill Complete.';
END $$;
