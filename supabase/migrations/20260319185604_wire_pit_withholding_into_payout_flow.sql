
-- ============================================================
-- Podłączenie calculate_pit_withholding do każdego miejsca
-- gdzie powstaje rekord payouts (= wypłata dla studenta)
--
-- Logika:
--   amount_gross dla studenta = milestone.amount - platform_fee
--   (czyli v_net z istniejącego kodu)
--   PIT obliczamy od tej kwoty
-- ============================================================

-- ── 1. review_delivery_v2 (główna ścieżka: firma akceptuje) ──────────────────
CREATE OR REPLACE FUNCTION public.review_delivery_v2(
  p_milestone_id UUID,
  p_decision     TEXT,
  p_feedback     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_milestone       record;
    v_contract        record;
    v_latest_deliv_id UUID;
    v_next            uuid;
    v_commission      numeric;
    v_fee             numeric;
    v_net             numeric;      -- wynagrodzenie brutto studenta (po prowizji)
    v_pit_result      record;
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
    ORDER BY created_at DESC LIMIT 1;

    IF p_decision = 'accepted' THEN

        UPDATE public.milestones
        SET status = 'released', accepted_at = now(), released_at = now(), updated_at = now()
        WHERE id = p_milestone_id;

        IF v_latest_deliv_id IS NOT NULL THEN
            UPDATE public.deliverables
            SET status = 'accepted', company_feedback = p_feedback, updated_at = now()
            WHERE id = v_latest_deliv_id;
        END IF;

        UPDATE public.deliverables
        SET status = 'rejected',
            company_feedback = 'Odrzucono automatycznie (zastąpione nowszą wersją)',
            updated_at = now()
        WHERE milestone_id = p_milestone_id
          AND status = 'pending'
          AND id != COALESCE(v_latest_deliv_id, '00000000-0000-0000-0000-000000000000'::uuid);

        -- Oblicz prowizję i wynagrodzenie brutto studenta
        v_commission := COALESCE(v_contract.commission_rate, 0.10);
        v_fee        := ROUND(v_milestone.amount * v_commission, 2);
        v_net        := GREATEST(v_milestone.amount - v_fee, 0);

        -- ── NOWE: oblicz i zarejestruj zaliczkę PIT ──────────────────────────
        SELECT * INTO v_pit_result
        FROM public.calculate_pit_withholding(
            p_milestone_id,
            v_contract.id,
            v_contract.student_id,
            v_net           -- wynagrodzenie brutto studenta = kwota po prowizji
        );
        -- v_pit_result.amount_net = kwota netto dla studenta (po podatku)
        -- ─────────────────────────────────────────────────────────────────────

        INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
        VALUES (p_milestone_id, v_contract.id, v_milestone.amount, v_fee, v_pit_result.amount_net, 'pending');

        v_next := public._activate_next_milestone(v_contract.id);

        IF NOT EXISTS (
            SELECT 1 FROM public.milestones
            WHERE contract_id = v_contract.id
              AND status NOT IN ('released','refunded','accepted')
        ) THEN
            UPDATE public.contracts SET status = 'completed', updated_at = now() WHERE id = v_contract.id;
            IF v_contract.application_id IS NOT NULL THEN
                UPDATE public.applications
                SET status = 'completed', realization_status = 'completed', updated_at = now()
                WHERE id = v_contract.application_id AND status IN ('accepted', 'in_progress');
            END IF;
        END IF;

        BEGIN
            PERFORM public.create_notification(
                v_contract.student_id, 'milestone_accepted',
                jsonb_build_object(
                    'milestone_id', p_milestone_id,
                    'contract_id', v_contract.id,
                    'next_milestone_id', v_next,
                    'amount_gross', v_net,
                    'amount_net', v_pit_result.amount_net,
                    'pit_amount', v_pit_result.pit_amount
                )
            );
        EXCEPTION WHEN OTHERS THEN END;

        RETURN jsonb_build_object(
            'status', 'OK', 'decision', 'accepted',
            'next_milestone_id', v_next,
            'payout_gross', v_net,
            'pit_amount', v_pit_result.pit_amount,
            'payout_net', v_pit_result.amount_net
        );

    ELSIF p_decision = 'rejected' THEN

        UPDATE public.milestones SET status = 'in_progress', updated_at = now() WHERE id = p_milestone_id;
        IF v_latest_deliv_id IS NOT NULL THEN
            UPDATE public.deliverables
            SET status = 'rejected', company_feedback = p_feedback, updated_at = now()
            WHERE id = v_latest_deliv_id;
        END IF;
        UPDATE public.contracts SET status = 'active', updated_at = now()
        WHERE id = v_contract.id AND status != 'completed';

        BEGIN
            PERFORM public.create_notification(
                v_contract.student_id, 'milestone_rejected',
                jsonb_build_object('milestone_id', p_milestone_id, 'contract_id', v_contract.id)
            );
        EXCEPTION WHEN OTHERS THEN END;

        RETURN jsonb_build_object('status', 'OK', 'decision', 'rejected');
    ELSE
        RAISE EXCEPTION 'Invalid decision: %', p_decision;
    END IF;
END;
$$;

-- ── 2. auto_accept_due_milestones_v2 (auto-akceptacja po 8 dniach) ───────────
CREATE OR REPLACE FUNCTION public.auto_accept_due_milestones_v2(
  p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row        record;
  v_contract   record;
  v_done       int := 0;
  v_next       uuid;
  v_latest_deliv_id uuid;
  v_commission numeric;
  v_fee        numeric;
  v_net        numeric;
  v_pit_result record;
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
    SELECT * INTO v_contract FROM public.contracts WHERE id = v_row.contract_id;

    UPDATE public.milestones
    SET status = 'released', accepted_at = now(), released_at = now(), updated_at = now()
    WHERE id = v_row.milestone_id;

    SELECT id INTO v_latest_deliv_id
    FROM public.deliverables
    WHERE milestone_id = v_row.milestone_id AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1;

    IF v_latest_deliv_id IS NOT NULL THEN
      UPDATE public.deliverables
      SET status = 'accepted',
          company_feedback = COALESCE(company_feedback, 'Auto-accepted (timeout)'),
          updated_at = now()
      WHERE id = v_latest_deliv_id;
    END IF;

    UPDATE public.deliverables
    SET status = 'rejected',
        company_feedback = 'Odrzucono automatycznie (timeout - zastąpione)',
        updated_at = now()
    WHERE milestone_id = v_row.milestone_id
      AND status = 'pending'
      AND id != COALESCE(v_latest_deliv_id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Prowizja i wynagrodzenie brutto studenta
    v_commission := COALESCE(v_contract.commission_rate, 0.10);
    v_fee        := ROUND(COALESCE(v_row.milestone_amount, 0) * v_commission, 2);
    v_net        := GREATEST(COALESCE(v_row.milestone_amount, 0) - v_fee, 0);

    -- ── NOWE: oblicz i zarejestruj zaliczkę PIT ──────────────────────────────
    SELECT * INTO v_pit_result
    FROM public.calculate_pit_withholding(
        v_row.milestone_id,
        v_row.contract_id,
        v_contract.student_id,
        v_net
    );
    -- ─────────────────────────────────────────────────────────────────────────

    INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
    VALUES (v_row.milestone_id, v_row.contract_id, COALESCE(v_row.milestone_amount, 0), v_fee, v_pit_result.amount_net, 'pending');

    v_next := public._activate_next_milestone(v_row.contract_id);

    IF NOT EXISTS (
      SELECT 1 FROM public.milestones
      WHERE contract_id = v_row.contract_id
        AND status NOT IN ('released','refunded','accepted')
    ) THEN
      UPDATE public.contracts SET status = 'completed', updated_at = now() WHERE id = v_row.contract_id;
      UPDATE public.applications
      SET status = 'completed', realization_status = 'completed', updated_at = now()
      WHERE id = (SELECT application_id FROM public.contracts WHERE id = v_row.contract_id)
        AND status IN ('accepted', 'in_progress');
    END IF;

    v_done := v_done + 1;
  END LOOP;

  RETURN jsonb_build_object('status', 'OK', 'processed', v_done);
END;
$$;

-- ── 3. review_deliverable_and_progress (legacy path) ─────────────────────────
CREATE OR REPLACE FUNCTION public.review_deliverable_and_progress(
  p_deliverable_id UUID,
  p_decision       TEXT,
  p_feedback       TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_d          record;
  v_c          record;
  v_commission numeric;
  v_fee        numeric;
  v_net        numeric;
  v_pit_result record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT d.* INTO v_d FROM public.deliverables d WHERE d.id = p_deliverable_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deliverable_not_found'; END IF;
  IF auth.uid() <> v_d.company_id THEN RAISE EXCEPTION 'only_company_can_review'; END IF;

  IF v_d.milestone_id IS NULL OR v_d.contract_id IS NULL THEN
    -- Legacy path bez milestone
    UPDATE public.deliverables
    SET status = CASE WHEN p_decision='accepted' THEN 'accepted' ELSE 'rejected' END,
        company_feedback = p_feedback, updated_at = now()
    WHERE id = p_deliverable_id;
    IF p_decision = 'accepted' THEN
      UPDATE public.applications SET realization_status='completed' WHERE id = v_d.application_id;
    ELSE
      UPDATE public.applications SET realization_status='in_progress' WHERE id = v_d.application_id;
    END IF;
    RETURN;
  END IF;

  SELECT c.* INTO v_c FROM public.contracts c WHERE c.id = v_d.contract_id FOR UPDATE;

  UPDATE public.deliverables
  SET status = CASE WHEN p_decision='accepted' THEN 'accepted' ELSE 'rejected' END,
      company_feedback = p_feedback, updated_at = now()
  WHERE id = p_deliverable_id;

  IF p_decision = 'accepted' THEN
    UPDATE public.milestones
    SET status = 'released', accepted_at = now(), updated_at = now()
    WHERE id = v_d.milestone_id AND status = 'delivered';

    -- Prowizja i wynagrodzenie brutto studenta
    v_commission := COALESCE(v_c.commission_rate, 0.10);
    v_fee        := ROUND(v_c.total_amount * v_commission, 2);
    v_net        := GREATEST(v_c.total_amount - v_fee, 0);

    -- ── NOWE: oblicz i zarejestruj zaliczkę PIT ──────────────────────────────
    SELECT * INTO v_pit_result
    FROM public.calculate_pit_withholding(
        v_d.milestone_id,
        v_d.contract_id,
        v_d.student_id,
        v_net
    );
    -- ─────────────────────────────────────────────────────────────────────────

    INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
    VALUES (v_d.milestone_id, v_c.id, v_c.total_amount, v_fee, v_pit_result.amount_net, 'pending');

    UPDATE public.applications SET realization_status='completed' WHERE id = v_d.application_id;
    UPDATE public.contracts SET status='completed', updated_at=now() WHERE id = v_c.id;

    PERFORM public.create_notification(
      v_d.student_id, 'deliverable_accepted',
      jsonb_build_object(
          'application_id', v_d.application_id,
          'deliverable_id', v_d.id,
          'pit_amount', v_pit_result.pit_amount,
          'payout_net', v_pit_result.amount_net
      )
    );
    PERFORM public._audit('milestone', v_d.milestone_id, 'released',
      jsonb_build_object('deliverable_id', v_d.id), auth.uid());
  ELSE
    UPDATE public.milestones SET status='revision_requested', updated_at=now()
    WHERE id = v_d.milestone_id AND status = 'delivered';
    UPDATE public.applications SET realization_status='in_progress' WHERE id = v_d.application_id;
    UPDATE public.contracts SET status='active', updated_at=now() WHERE id = v_c.id;
    PERFORM public.create_notification(
      v_d.student_id, 'deliverable_rejected',
      jsonb_build_object('application_id', v_d.application_id, 'deliverable_id', v_d.id)
    );
    PERFORM public._audit('milestone', v_d.milestone_id, 'revision_requested',
      jsonb_build_object('deliverable_id', v_d.id), auth.uid());
  END IF;
END;
$$;
;
