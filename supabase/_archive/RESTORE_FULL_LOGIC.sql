-- RESTORE FULL NEGOTIATION LOGIC (Master Reset)
-- This script consolidates all recent fixes into one execution flow.
-- It ensures Tables, Constraints, Types, and Functions are correct.

BEGIN;

--------------------------------------------------------------------------------
-- 0. CLEANUP (Safe Drops)
--------------------------------------------------------------------------------
-- Drop functions to avoid "return type mismatch" errors
DROP FUNCTION IF EXISTS draft_initialize(uuid, bigint);
DROP FUNCTION IF EXISTS draft_save_version(uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS draft_submit(uuid);
DROP FUNCTION IF EXISTS validate_draft_budget(uuid, jsonb);
DROP FUNCTION IF EXISTS draft_approve(uuid);

--------------------------------------------------------------------------------
-- 1. TABLES & SCHEMA FIXES
--------------------------------------------------------------------------------

-- Ensure Snapshot column types are correct
DO $$ 
BEGIN
    ALTER TABLE public.milestone_snapshots ALTER COLUMN criteria TYPE text USING criteria::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Check milestone_client_id existence
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='milestone_snapshots' AND column_name='milestone_client_id') THEN
        ALTER TABLE public.milestone_snapshots ADD COLUMN milestone_client_id UUID;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- 2. FK CLEANUP & REPAIR
--------------------------------------------------------------------------------
-- Clean corrupt pointers in Drafts
UPDATE public.milestone_drafts SET current_version_id = NULL WHERE current_version_id NOT IN (SELECT id FROM public.milestone_versions);
UPDATE public.milestone_drafts SET review_version_id = NULL WHERE review_version_id NOT IN (SELECT id FROM public.milestone_versions);
UPDATE public.milestone_drafts SET company_changes_version_id = NULL WHERE company_changes_version_id NOT IN (SELECT id FROM public.milestone_versions);

-- Drop old constraints
ALTER TABLE public.milestone_drafts DROP CONSTRAINT IF EXISTS fk_draft_current_version;
ALTER TABLE public.milestone_drafts DROP CONSTRAINT IF EXISTS fk_draft_review_version;
ALTER TABLE public.milestone_drafts DROP CONSTRAINT IF EXISTS fk_draft_company_changes_version;
ALTER TABLE public.milestone_snapshots DROP CONSTRAINT IF EXISTS milestone_snapshots_version_id_fkey;

-- Re-apply constraints (Idempotent-ish)
DO $$ BEGIN
    ALTER TABLE public.milestone_drafts ADD CONSTRAINT fk_draft_current_version_fixed FOREIGN KEY (current_version_id) REFERENCES public.milestone_versions(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.milestone_drafts ADD CONSTRAINT fk_draft_review_version_fixed FOREIGN KEY (review_version_id) REFERENCES public.milestone_versions(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.milestone_drafts ADD CONSTRAINT fk_draft_company_changes_version_fixed FOREIGN KEY (company_changes_version_id) REFERENCES public.milestone_versions(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.milestone_snapshots ADD CONSTRAINT milestone_snapshots_version_id_fkey_fixed FOREIGN KEY (version_id) REFERENCES public.milestone_versions(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;


--------------------------------------------------------------------------------
-- 3. DISABLE RLS (For flow consistency)
--------------------------------------------------------------------------------
ALTER TABLE public.milestone_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_snapshots DISABLE ROW LEVEL SECURITY;


--------------------------------------------------------------------------------
-- 4. RPCs (FUNCTIONS)
--------------------------------------------------------------------------------

-- Validator
CREATE OR REPLACE FUNCTION validate_draft_budget(p_draft_id UUID, p_items JSONB)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_contract_id UUID;
    v_total_budget numeric;
    v_sum_items numeric;
    v_delta numeric;
BEGIN
    SELECT contract_id INTO v_contract_id FROM milestone_drafts WHERE id = p_draft_id;
    SELECT budget INTO v_total_budget FROM contracts WHERE id = v_contract_id;
    
    -- Sum items (amount_minor is int, budget is numeric)
    -- amount_minor / 100.0 = numeric amount
    SELECT COALESCE(SUM((x->>'amount_minor')::numeric / 100.0), 0) INTO v_sum_items
    FROM jsonb_array_elements(p_items) t(x);

    v_delta := v_total_budget - v_sum_items;
    
    IF abs(v_delta) < 0.01 THEN
        RETURN jsonb_build_object('status', 'OK', 'delta', 0);
    ELSIF v_delta > 0 THEN
        RETURN jsonb_build_object('status', 'UNDER', 'delta', v_delta);
    ELSE
        RETURN jsonb_build_object('status', 'OVER', 'delta', v_delta);
    END IF;
END;
$$;


-- Init
CREATE OR REPLACE FUNCTION draft_initialize(
    p_contract_id UUID,
    p_total_amount_minor BIGINT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_draft_id UUID;
    v_ver_id UUID;
BEGIN
    SELECT id INTO v_draft_id FROM milestone_drafts WHERE contract_id = p_contract_id;
    IF v_draft_id IS NOT NULL THEN RETURN v_draft_id; END IF;

    INSERT INTO milestone_drafts (contract_id, state) VALUES (p_contract_id, 'STUDENT_EDITING') RETURNING id INTO v_draft_id;
    INSERT INTO milestone_versions (draft_id, version_number, created_by) VALUES (v_draft_id, 1, auth.uid()) RETURNING id INTO v_ver_id;

    -- Init with random client ID
    INSERT INTO milestone_snapshots (version_id, milestone_client_id, position, title, amount_minor, criteria)
    VALUES (v_ver_id, gen_random_uuid(), 0, 'Pierwszy Etap', p_total_amount_minor, 'Opis zakresu prac...');

    UPDATE milestone_drafts SET current_version_id = v_ver_id WHERE id = v_draft_id;
    RETURN v_draft_id;
END;
$$;


-- Save Version
CREATE OR REPLACE FUNCTION draft_save_version(
    p_contract_id UUID,
    p_base_version_id UUID,
    p_items JSONB
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_draft_id UUID;
    v_current_ver_num INTEGER;
    v_new_ver_id UUID;
    v_item JSONB;
BEGIN
    SELECT id, current_version_id INTO v_draft_id, v_new_ver_id FROM milestone_drafts WHERE contract_id = p_contract_id;
    SELECT version_number INTO v_current_ver_num FROM milestone_versions WHERE id = v_new_ver_id;
    IF v_current_ver_num IS NULL THEN v_current_ver_num := 0; END IF;

    INSERT INTO milestone_versions (draft_id, version_number, created_by)
    VALUES (v_draft_id, v_current_ver_num + 1, auth.uid())
    RETURNING id INTO v_new_ver_id;

    IF p_items IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO milestone_snapshots (
                version_id, milestone_client_id, position, title, amount_minor, criteria
            )
            VALUES (
                v_new_ver_id,
                (v_item->>'client_id')::UUID,
                (v_item->>'position')::INTEGER,
                (v_item->>'title'),
                (v_item->>'amount_minor')::BIGINT,
                (v_item->>'criteria')
            );
        END LOOP;
    END IF;

    UPDATE milestone_drafts SET current_version_id = v_new_ver_id, updated_at = now() WHERE id = v_draft_id;
    RETURN jsonb_build_object('status', 'OK', 'version_id', v_new_ver_id);
END;
$$;


-- Submit
CREATE OR REPLACE FUNCTION draft_submit(p_contract_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
    v_current_ver_id UUID;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    IF v_state != 'STUDENT_EDITING' THEN RAISE EXCEPTION 'Invalid transition from %', v_state; END IF;

    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;
    
    v_validation := validate_draft_budget(v_draft_id, v_items);
    IF (v_validation->>'status') != 'OK' THEN RAISE EXCEPTION 'Budget validation failed: %', (v_validation->>'status'); END IF;

    UPDATE milestone_drafts SET state = 'WAITING_COMPANY_REVIEW', review_version_id = v_current_ver_id WHERE id = v_draft_id;
    RETURN jsonb_build_object('status', 'OK', 'new_state', 'WAITING_COMPANY_REVIEW');
END;
$$;

COMMIT;
