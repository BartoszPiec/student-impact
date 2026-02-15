-- 20260205_auto_accept_sync_app_status.sql
-- Patch: auto_accept_due_milestones_v2 - sync applications.status when contract completes
-- Also adds application status sync when contract is funded (active)

-- Replaces existing function with added application status sync
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

    -- Check if all milestones are final → complete contract
    IF NOT EXISTS (
      SELECT 1 FROM public.milestones
      WHERE contract_id = v_row.contract_id
        AND status NOT IN ('released','refunded','accepted')
    ) THEN
      UPDATE public.contracts
      SET status = 'completed',
          updated_at = now()
      WHERE id = v_row.contract_id;

      -- Sync application status to completed
      UPDATE public.applications
      SET status = 'completed',
          realization_status = 'completed',
          updated_at = now()
      WHERE id = (SELECT application_id FROM public.contracts WHERE id = v_row.contract_id)
        AND status IN ('accepted', 'in_progress');
    END IF;

    v_done := v_done + 1;
  END LOOP;

  RETURN jsonb_build_object('status','OK','processed', v_done);
END;
$$;

-- Also patch review_delivery_v2 to sync application status on contract completion
CREATE OR REPLACE FUNCTION public.review_delivery_v2(
    p_milestone_id UUID,
    p_decision TEXT,
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
    SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;

    SELECT * INTO v_contract FROM public.contracts WHERE id = v_milestone.contract_id FOR UPDATE;

    IF v_contract.company_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Only client company can review work';
    END IF;

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

        UPDATE public.deliverables
        SET status = 'rejected',
            company_feedback = 'Odrzucono automatycznie (zastąpione nowszą wersją)',
            updated_at = now()
        WHERE milestone_id = p_milestone_id
          AND status = 'pending'
          AND id != COALESCE(v_latest_deliv_id, '00000000-0000-0000-0000-000000000000'::uuid);

        v_next := public._activate_next_milestone(v_contract.id);

        IF NOT EXISTS (
            SELECT 1 FROM public.milestones
            WHERE contract_id = v_contract.id
              AND status NOT IN ('released','refunded','accepted')
        ) THEN
            UPDATE public.contracts
            SET status = 'completed',
                updated_at = now()
            WHERE id = v_contract.id;

            -- NEW: Sync application status to completed
            IF v_contract.application_id IS NOT NULL THEN
                UPDATE public.applications
                SET status = 'completed',
                    realization_status = 'completed',
                    updated_at = now()
                WHERE id = v_contract.application_id
                  AND status IN ('accepted', 'in_progress');
            END IF;
        END IF;

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

-- Also patch company_fund_contract_v2 to sync application status
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
        SELECT m.id INTO v_target
        FROM public.milestones m
        WHERE m.contract_id = p_contract_id
          AND m.status = 'awaiting_funding'
        ORDER BY m.idx ASC
        LIMIT 1
        FOR UPDATE;

        IF v_target IS NULL THEN
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

    -- NEW: Sync application status to in_progress when contract becomes active
    IF v_contract.application_id IS NOT NULL THEN
        UPDATE public.applications
        SET status = 'in_progress',
            updated_at = now()
        WHERE id = v_contract.application_id
          AND status = 'accepted';
    END IF;

    RETURN jsonb_build_object(
        'status', 'OK',
        'funding_mode', v_mode,
        'funded_milestones', v_updated_count
    );
END;
$$;
