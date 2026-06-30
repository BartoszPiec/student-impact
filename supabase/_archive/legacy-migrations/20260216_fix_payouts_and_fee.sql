-- 20260216_fix_payouts_and_fee.sql
-- Fix: review_delivery_v2 and auto_accept_due_milestones_v2 now create payout records
-- with contract-level platform fee when milestones are accepted/auto-accepted.
-- Previously these functions did NOT create payout records at all.

-- ============================================================
-- 1. Patch review_delivery_v2 — add payout creation on accept
-- ============================================================
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
    v_platform_fee numeric;
    v_commission_rate numeric;
    v_net_amount numeric;
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

        -- *** NEW: Create payout record with contract-level platform fee ***
        v_commission_rate := COALESCE(v_contract.commission_rate, public.default_commission_rate(v_contract.source_type, NULL, false));
        v_platform_fee := ROUND(v_milestone.amount * v_commission_rate, 2);
        v_net_amount := ROUND(v_milestone.amount - v_platform_fee, 2);

        INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
        VALUES (p_milestone_id, v_contract.id, v_milestone.amount, v_platform_fee, v_net_amount, 'pending');

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

            -- Sync application status to completed
            IF v_contract.application_id IS NOT NULL THEN
                UPDATE public.applications
                SET status = 'completed',
                    realization_status = 'completed',
                    updated_at = now()
                WHERE id = v_contract.application_id
                  AND status <> 'completed'
                  AND status IN ('accepted', 'in_progress', 'delivered');
            END IF;
        END IF;

        BEGIN
            PERFORM public.create_notification(
                v_contract.student_id,
                'milestone_accepted',
                jsonb_build_object(
                    'milestone_id', p_milestone_id,
                    'contract_id', v_contract.id,
                    'next_milestone_id', v_next,
                    'payout_amount', v_net_amount
                )
            );
        EXCEPTION WHEN OTHERS THEN
        END;

        RETURN jsonb_build_object(
            'status','OK',
            'decision','accepted',
            'next_milestone_id', v_next,
            'payout_gross', v_milestone.amount,
            'payout_fee', v_platform_fee,
            'payout_net', v_net_amount
        );

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


-- ==================================================================
-- 2. Patch auto_accept_due_milestones_v2 — add payout on auto-accept
-- ==================================================================
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
  v_milestone_amount numeric;
  v_platform_fee numeric;
  v_commission_rate numeric;
  v_net_amount numeric;
BEGIN
  FOR v_row IN
    SELECT
      m.id as milestone_id,
      m.contract_id,
      m.amount as milestone_amount,
      c.commission_rate,
      c.source_type
    FROM public.milestones m
    JOIN public.contracts c ON c.id = m.contract_id
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

    -- *** NEW: Create payout record with contract-level platform fee ***
    v_milestone_amount := COALESCE(v_row.milestone_amount, 0);
    v_commission_rate := COALESCE(v_row.commission_rate, public.default_commission_rate(v_row.source_type, NULL, false));
    v_platform_fee := ROUND(v_milestone_amount * v_commission_rate, 2);
    v_net_amount := ROUND(v_milestone_amount - v_platform_fee, 2);

    INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
    VALUES (v_row.milestone_id, v_row.contract_id, v_milestone_amount, v_platform_fee, v_net_amount, 'pending');

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
        AND status <> 'completed'
        AND status IN ('accepted', 'in_progress', 'delivered');
    END IF;

    v_done := v_done + 1;
  END LOOP;

  RETURN jsonb_build_object('status','OK','processed', v_done);
END;
$$;


-- ==================================================================
-- 3. Also fix legacy review_deliverable_and_progress with proper fee
-- ==================================================================
-- Note: This function in release.sql had v_fee := 0
-- We don't rewrite the whole function, just note it's superseded by review_delivery_v2
-- The payout records it creates will have fee=0, but new ones from v2 will be correct.
