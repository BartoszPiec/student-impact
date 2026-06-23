-- 20260123_escrow_sequential_privatefiles_v2.sql
-- Patch for Student Impact sprint (milestones) aligned with 20260121_refactor_v1.sql
-- Implements:
-- 1) Sequential escrow (fund only next milestone by default)
-- 2) Auto-accept window per contract (milestones.auto_accept_at) + cron-friendly RPC
-- 3) Private deliverables bucket + enforce downloads via signed URL

BEGIN;

-- ------------------------------------------------------------
-- A) Contracts: funding mode (sequential vs full)
-- ------------------------------------------------------------
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS funding_mode text NOT NULL DEFAULT 'full';

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_funding_mode_check;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_funding_mode_check
  CHECK (funding_mode IN ('sequential','full'));

-- ------------------------------------------------------------
-- B) Milestones: auto-accept timestamps
-- ------------------------------------------------------------
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS auto_accept_at timestamptz;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS released_at timestamptz;

-- ------------------------------------------------------------
-- C) Storage: deliverables bucket PRIVATE + lock down direct reads
--    Downloads happen via signed URLs generated on server (service role)
-- ------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'deliverables';

-- Drop any existing deliverables policies (names vary across iterations)
DROP POLICY IF EXISTS "deliverables_bucket_read" ON storage.objects;
DROP POLICY IF EXISTS "deliverables_bucket_upload" ON storage.objects;
DROP POLICY IF EXISTS "Deliverables Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Deliverables Participant Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Allow authenticated uploads
CREATE POLICY "deliverables_bucket_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'deliverables' AND auth.role() = 'authenticated'
);

-- Deny direct reads for clients; only service role can read (signed URLs should be used)
CREATE POLICY "deliverables_bucket_read" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'deliverables' AND auth.role() = 'service_role'
);

-- ------------------------------------------------------------
-- D) Negotiation: patch draft_approve to avoid invalid milestone status 'pending'
--    First milestone -> awaiting_funding, others -> draft
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.draft_approve(uuid);

CREATE OR REPLACE FUNCTION public.draft_approve(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_draft_id UUID;
    v_review_ver_id UUID;
    v_state draft_state;
BEGIN
    SELECT id, state, review_version_id INTO v_draft_id, v_state, v_review_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Update Draft State
    UPDATE milestone_drafts
    SET state = 'APPROVED'
    WHERE id = v_draft_id;

    -- Clear Existing Final Milestones
    DELETE FROM milestones WHERE contract_id = p_contract_id;

    -- Insert Final Milestones from Snapshot
    -- IMPORTANT: Set status 'awaiting_funding' for the FIRST one
    INSERT INTO milestones (
        contract_id,
        title,
        amount,
        acceptance_criteria,
        idx,
        created_by,
        updated_by,
        status
    )
    SELECT
        p_contract_id,
        s.title,
        (s.amount_minor / 100.0),
        s.criteria,
        s.position,
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        CASE WHEN s.position = 0 THEN 'awaiting_funding' ELSE 'draft' END
    FROM milestone_snapshots s
    WHERE s.version_id = v_review_ver_id
    ORDER BY s.position;

    -- Update Contract Terms + Status
    UPDATE contracts
    SET terms_status = 'agreed',
        status = 'awaiting_funding',
        terms_version = terms_version + 1,
        company_approved_version = terms_version + 1,
        student_approved_version = terms_version + 1,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'APPROVED');
END;
$$;

GRANT EXECUTE ON FUNCTION public.draft_approve(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.draft_approve(uuid) TO service_role;

-- ------------------------------------------------------------
-- E) Helper: activate next milestone (draft -> awaiting_funding)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._activate_next_milestone(p_contract_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next uuid;
BEGIN
  SELECT m.id INTO v_next
  FROM public.milestones m
  WHERE m.contract_id = p_contract_id
    AND m.status = 'draft'
  ORDER BY m.idx ASC
  LIMIT 1
  FOR UPDATE;

  IF v_next IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.milestones
  SET status = 'awaiting_funding',
      updated_at = now()
  WHERE id = v_next;

  UPDATE public.contracts
  SET status = 'awaiting_funding',
      updated_at = now()
  WHERE id = p_contract_id
    AND status != 'completed';

  RETURN v_next;
END;
$$;

GRANT EXECUTE ON FUNCTION public._activate_next_milestone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._activate_next_milestone(uuid) TO service_role;

-- ------------------------------------------------------------
-- F) Funding: company_fund_contract_v2 supports sequential by default
--    sequential: fund ONLY the current awaiting_funding milestone (1 step)
--    full: fund all draft/awaiting milestones
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.company_fund_contract_v2(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_contract record;
    v_updated_count INT := 0;
    v_mode text;
    v_target uuid;
BEGIN
    SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;

    IF v_contract.company_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Only company can fund contract';
    END IF;

    v_mode := COALESCE(v_contract.funding_mode, 'full');

    IF v_mode = 'full' THEN
        UPDATE public.milestones
        SET status = 'funded',
            funded_at = now(),
            updated_at = now()
        WHERE contract_id = p_contract_id
          AND status IN ('draft', 'awaiting_funding');

        GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    ELSE
        -- sequential: fund only next awaiting_funding milestone
        SELECT m.id INTO v_target
        FROM public.milestones m
        WHERE m.contract_id = p_contract_id
          AND m.status = 'awaiting_funding'
        ORDER BY m.idx ASC
        LIMIT 1
        FOR UPDATE;

        IF v_target IS NULL THEN
            -- if none is awaiting_funding, activate the first draft milestone, then fund it
            PERFORM public._activate_next_milestone(p_contract_id);

            SELECT m.id INTO v_target
            FROM public.milestones m
            WHERE m.contract_id = p_contract_id
              AND m.status = 'awaiting_funding'
            ORDER BY m.idx ASC
            LIMIT 1
            FOR UPDATE;
        END IF;

        IF v_target IS NULL THEN
            RETURN jsonb_build_object(
              'status','NOOP',
              'funding_mode', v_mode,
              'funded_milestones', 0,
              'message', 'No milestone to fund'
            );
        END IF;

        UPDATE public.milestones
        SET status = 'funded',
            funded_at = now(),
            updated_at = now()
        WHERE id = v_target;

        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    END IF;

    UPDATE public.contracts
    SET status = 'active',
        updated_at = now()
    WHERE id = p_contract_id
      AND status != 'completed';

    RETURN jsonb_build_object(
        'status', 'OK',
        'funding_mode', v_mode,
        'funded_milestones', v_updated_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.company_fund_contract_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.company_fund_contract_v2(uuid) TO service_role;

-- ------------------------------------------------------------
-- G) Delivery submit: patch submit_delivery_v2 to set auto_accept_at
--    Keep signature + deliverables statuses from refactor_v1 (deliverables.status='pending')
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_delivery_v2(
    p_milestone_id UUID,
    p_description TEXT,
    p_files JSONB,
    p_contract_id UUID -- Optional, validation check
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_milestone record;
    v_contract record;
    v_app_id UUID;
    v_so_id UUID;
    v_review_days int;
BEGIN
    -- 1. Validate Milestone
    SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;

    -- 2. Validate Contract
    SELECT * INTO v_contract FROM public.contracts WHERE id = v_milestone.contract_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;

    -- Optional validation check
    IF p_contract_id IS NOT NULL AND p_contract_id != v_contract.id THEN
        RAISE EXCEPTION 'Contract mismatch';
    END IF;

    -- Security Check: Caller must be the Student
    IF v_contract.student_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Only assigned student can submit work';
    END IF;

    v_review_days := COALESCE(v_contract.review_window_days, 8);

    -- 3. Resolve Project Context (App vs Service Order)
    v_app_id := v_contract.application_id;
    v_so_id := v_contract.service_order_id;

    -- Ensure mutual exclusivity for deliverables constraint
    IF v_so_id IS NOT NULL THEN
        v_app_id := NULL;
    END IF;

    -- 4. Insert Deliverable (History) - status pending
    INSERT INTO public.deliverables (
        contract_id,
        milestone_id,
        student_id,
        company_id,
        application_id,
        service_order_id,
        description,
        files,
        status,
        version
    ) VALUES (
        v_contract.id,
        v_milestone.id,
        auth.uid(),
        v_contract.company_id,
        v_app_id,
        v_so_id,
        p_description,
        p_files,
        'pending',
        (SELECT COALESCE(MAX(version), 0) + 1 FROM public.deliverables WHERE milestone_id = p_milestone_id)
    );

    -- 5. Update Milestone Status + Auto-accept window
    UPDATE public.milestones
    SET status = 'delivered',
        delivered_at = now(),
        auto_accept_at = now() + make_interval(days => v_review_days),
        updated_at = now()
    WHERE id = p_milestone_id;

    -- Optional: surface to contract-level UI
    UPDATE public.contracts
    SET status = 'delivered',
        updated_at = now()
    WHERE id = v_contract.id
      AND status != 'completed';

    -- 6. Send Notification to Company (best-effort)
    BEGIN
        PERFORM public.create_notification(
            v_contract.company_id,
            'milestone_delivered',
            jsonb_build_object(
                'milestone_id', p_milestone_id,
                'contract_id', v_contract.id,
                'title', v_milestone.title
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- ignore
    END;

    RETURN jsonb_build_object('status', 'OK', 'milestone_status', 'delivered');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_delivery_v2(uuid, text, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_delivery_v2(uuid, text, jsonb, uuid) TO service_role;

-- ------------------------------------------------------------
-- H) Review: accept -> release + activate next milestone (sequential)
--    Keep deliverables update logic (latest pending only)
-- ------------------------------------------------------------
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
    v_next uuid;
BEGIN
    -- 1. Validate Milestone
    SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;

    -- 2. Validate Contract
    SELECT * INTO v_contract FROM public.contracts WHERE id = v_milestone.contract_id FOR UPDATE;

    -- Security Check: Caller must be the Company
    IF v_contract.company_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Only client company can review work';
    END IF;

    -- Find latest pending deliverable
    SELECT id INTO v_latest_deliv_id
    FROM public.deliverables
    WHERE milestone_id = p_milestone_id AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    IF p_decision = 'accepted' THEN
        UPDATE public.milestones
        SET status = 'released',
            accepted_at = now(),
            released_at = now(),
            updated_at = now()
        WHERE id = p_milestone_id;

        IF v_latest_deliv_id IS NOT NULL THEN
            UPDATE public.deliverables
            SET status = 'accepted',
            company_feedback = p_feedback,
                updated_at = now()
            WHERE id = v_latest_deliv_id;
        END IF;

        -- mark older pending as rejected (superseded)
        UPDATE public.deliverables
        SET status = 'rejected',
            company_feedback = 'Odrzucono automatycznie (zastąpione nowszą wersją)',
            updated_at = now()
        WHERE milestone_id = p_milestone_id
          AND status = 'pending'
          AND id != COALESCE(v_latest_deliv_id, '00000000-0000-0000-0000-000000000000'::uuid);

        -- Activate next milestone (draft -> awaiting_funding)
        v_next := public._activate_next_milestone(v_contract.id);

        -- Complete contract if all milestones final
        IF NOT EXISTS (
            SELECT 1 FROM public.milestones
            WHERE contract_id = v_contract.id
              AND status NOT IN ('released','refunded','accepted')
        ) THEN
            UPDATE public.contracts
            SET status = 'completed',
                updated_at = now()
            WHERE id = v_contract.id;
        END IF;

        -- Notify student (best-effort)
        BEGIN
            PERFORM public.create_notification(
                v_contract.student_id,
                'milestone_accepted',
                jsonb_build_object('milestone_id', p_milestone_id, 'contract_id', v_contract.id, 'next_milestone_id', v_next)
            );
        EXCEPTION WHEN OTHERS THEN
        END;

        RETURN jsonb_build_object('status','OK','decision','accepted','next_milestone_id', v_next);

    ELSIF p_decision = 'rejected' THEN
        UPDATE public.milestones
        SET status = 'in_progress',
            updated_at = now()
        WHERE id = p_milestone_id;

        IF v_latest_deliv_id IS NOT NULL THEN
            UPDATE public.deliverables
            SET status = 'rejected',
                company_feedback = p_feedback,
                updated_at = now()
            WHERE id = v_latest_deliv_id;
        END IF;

        UPDATE public.contracts
        SET status = 'active',
            updated_at = now()
        WHERE id = v_contract.id
          AND status != 'completed';

        BEGIN
            PERFORM public.create_notification(
                v_contract.student_id,
                'milestone_rejected',
                jsonb_build_object('milestone_id', p_milestone_id, 'contract_id', v_contract.id)
            );
        EXCEPTION WHEN OTHERS THEN
        END;

        RETURN jsonb_build_object('status','OK','decision','rejected');
    ELSE
        RAISE EXCEPTION 'Invalid decision: %', p_decision;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_delivery_v2(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_delivery_v2(uuid, text, text) TO service_role;

-- ------------------------------------------------------------
-- I) Cron-friendly RPC: auto-accept due delivered milestones
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_accept_due_milestones_v2(p_limit int DEFAULT 100)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_done int := 0;
  v_next uuid;
  v_latest_deliv_id uuid;
BEGIN
  FOR v_row IN
    SELECT m.id as milestone_id, m.contract_id
    FROM public.milestones m
    WHERE m.status = 'delivered'
      AND m.auto_accept_at IS NOT NULL
      AND m.auto_accept_at <= now()
    ORDER BY m.auto_accept_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.milestones
    SET status = 'released',
        accepted_at = now(),
        released_at = now(),
        updated_at = now()
    WHERE id = v_row.milestone_id;

    -- Latest pending deliverable -> accepted
    SELECT id INTO v_latest_deliv_id
    FROM public.deliverables
    WHERE milestone_id = v_row.milestone_id AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_latest_deliv_id IS NOT NULL THEN
      UPDATE public.deliverables
      SET status = 'accepted',
          company_feedback = COALESCE(company_feedback, 'Auto-accepted (timeout)'),
          updated_at = now()
      WHERE id = v_latest_deliv_id;
    END IF;

    -- Older pending deliverables -> rejected (superseded)
    UPDATE public.deliverables
    SET status = 'rejected',
        company_feedback = 'Odrzucono automatycznie (timeout – zastąpione)',
        updated_at = now()
    WHERE milestone_id = v_row.milestone_id
      AND status = 'pending'
      AND id != COALESCE(v_latest_deliv_id, '00000000-0000-0000-0000-000000000000'::uuid);

    v_next := public._activate_next_milestone(v_row.contract_id);

    IF NOT EXISTS (
      SELECT 1 FROM public.milestones
      WHERE contract_id = v_row.contract_id
        AND status NOT IN ('released','refunded','accepted')
    ) THEN
      UPDATE public.contracts
      SET status = 'completed',
          updated_at = now()
      WHERE id = v_row.contract_id;
    END IF;

    v_done := v_done + 1;
  END LOOP;

  RETURN jsonb_build_object('status','OK','processed', v_done);
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_accept_due_milestones_v2(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_accept_due_milestones_v2(int) TO authenticated;

COMMIT;
