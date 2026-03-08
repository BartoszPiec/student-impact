-- =============================================
-- Migration: Service Packages - Variants, NDA, Commission
-- Adds support for S/M/L variants, NDA requirement,
-- and dynamic commission rates
-- =============================================

-- 1. service_packages: new columns
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS locked_content text;
-- Internal instructions for students, visible only after accepting order

ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS variants jsonb;
-- Format: [{"name":"S","label":"Pakiet S","price":699,"delivery_time_days":5,"scope":"..."}]

ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS requires_nda boolean DEFAULT false;

ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0.10;
-- 0.25 for platform services, 0.10 for user services

-- 2. service_orders: new columns
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS nda_accepted_at timestamptz;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS selected_variant text;

-- 3. contracts: commission_rate (frozen at contract creation time)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0.10;

-- 4. Set commission_rate for existing system packages
UPDATE public.service_packages
SET commission_rate = 0.25
WHERE is_system = true OR type = 'platform_service';

-- 5. Update review_delivery_v2 to create payouts with dynamic commission
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
    v_commission numeric;
    v_fee numeric;
    v_net numeric;
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

        -- Create payout with dynamic commission
        v_commission := COALESCE(v_contract.commission_rate, 0.10);
        v_fee := ROUND(v_milestone.amount * v_commission, 2);
        v_net := GREATEST(v_milestone.amount - v_fee, 0);

        INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
        VALUES (p_milestone_id, v_contract.id, v_milestone.amount, v_fee, v_net, 'pending');

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

        RETURN jsonb_build_object('status','OK','decision','accepted','next_milestone_id', v_next, 'payout_net', v_net);

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

-- 6. Update auto_accept_due_milestones_v2 to create payouts with dynamic commission
CREATE OR REPLACE FUNCTION public.auto_accept_due_milestones_v2(p_limit int DEFAULT 100)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_contract record;
  v_done int := 0;
  v_next uuid;
  v_latest_deliv_id uuid;
  v_commission numeric;
  v_fee numeric;
  v_net numeric;
BEGIN
  FOR v_row IN
    SELECT m.id as milestone_id, m.contract_id, m.amount as milestone_amount
    FROM public.milestones m
    WHERE m.status = 'delivered'
      AND m.auto_accept_at IS NOT NULL
      AND m.auto_accept_at <= now()
    ORDER BY m.auto_accept_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Get contract for commission rate
    SELECT * INTO v_contract FROM public.contracts WHERE id = v_row.contract_id;

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

    -- Create payout with dynamic commission
    v_commission := COALESCE(v_contract.commission_rate, 0.10);
    v_fee := ROUND(COALESCE(v_row.milestone_amount, 0) * v_commission, 2);
    v_net := GREATEST(COALESCE(v_row.milestone_amount, 0) - v_fee, 0);

    INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
    VALUES (v_row.milestone_id, v_row.contract_id, COALESCE(v_row.milestone_amount, 0), v_fee, v_net, 'pending');

    v_next := public._activate_next_milestone(v_row.contract_id);

    -- Check if all milestones are final -> complete contract
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
