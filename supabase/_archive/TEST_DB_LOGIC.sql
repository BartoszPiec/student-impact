-- MANUAL TEST OF NEGOTIATION WORKFLOW
-- This script simulates what the Frontend does.
-- Run this and check the Messages/Results.

BEGIN;

DO $$
DECLARE
    v_contract_id UUID;
    v_draft_id UUID;
    v_save_res JSONB;
    v_submit_res JSONB;
    v_snapshot_count INTEGER;
    v_items JSONB;
BEGIN
    RAISE NOTICE '--- STARTING MANUAL TEST ---';

    -- 1. Find a target contract (or create dummy)
    SELECT id INTO v_contract_id FROM contracts LIMIT 1;
    IF v_contract_id IS NULL THEN
        RAISE EXCEPTION 'No contracts found to test with.';
    END IF;
    RAISE NOTICE 'Testing with Contract ID: %', v_contract_id;

    -- 2. Init Draft
    v_draft_id := draft_initialize(v_contract_id, 1000000); -- 10k PLN
    RAISE NOTICE 'Draft initialized ID: %', v_draft_id;

    -- 3. Prepare Items (2 items splitting the 10k)
    -- 5000 + 5000 = 10000. Should be OK.
    v_items := jsonb_build_array(
        jsonb_build_object(
            'client_id', gen_random_uuid(),
            'title', 'Test Etap 1',
            'amount_minor', 500000,
            'criteria', 'Criteria 1',
            'position', 0
        ),
        jsonb_build_object(
            'client_id', gen_random_uuid(),
            'title', 'Test Etap 2',
            'amount_minor', 500000,
            'criteria', 'Criteria 2',
            'position', 1
        )
    );

    -- 4. Save Version
    v_save_res := draft_save_version(v_contract_id, NULL, v_items);
    RAISE NOTICE 'Save Result: %', v_save_res;

    -- 5. Validate Storage
    SELECT count(*) INTO v_snapshot_count 
    FROM milestone_snapshots 
    WHERE version_id = (v_save_res->>'version_id')::UUID;
    
    RAISE NOTICE 'Snapshots found for new version: %', v_snapshot_count;
    
    IF v_snapshot_count != 2 THEN
        RAISE EXCEPTION 'Expected 2 snapshots, found %', v_snapshot_count;
    END IF;

    -- 6. Submit
    -- This should pass validation because 5k+5k = 10k.
    -- NOTE: We must ensure the contract budget is actually 10k for validation to pass, 
    -- OR we temporarily update contract budget to match our test logic.
    UPDATE contracts SET budget = 10000.00 WHERE id = v_contract_id;
    
    v_submit_res := draft_submit(v_contract_id);
    RAISE NOTICE 'Submit Result: %', v_submit_res;

    RAISE NOTICE '--- TEST COMPLETED SUCCESSFULLY ---';
    
    -- Rollback everything so we don't mess up real data
    RAISE EXCEPTION 'TEST OK - ROLLING BACK'; 

EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'TEST OK - ROLLING BACK' THEN
        RAISE NOTICE 'SUCCESS: Logic works as expected.';
    ELSE
        RAISE NOTICE 'FAILURE: %', SQLERRM;
    END IF;
END $$;

COMMIT;
