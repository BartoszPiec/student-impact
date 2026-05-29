BEGIN;

-- Critical hardening: payment processing must never mix application and service_order flows.
CREATE OR REPLACE FUNCTION public.process_stripe_payment_v4(
  p_session_id text,
  p_payment_intent_id text,
  p_contract_id uuid,
  p_application_id uuid,
  p_service_order_id uuid,
  p_amount_pln numeric,
  p_fee_pln numeric,
  p_milestone_ids uuid[],
  p_user_id uuid,
  p_amount_minor bigint DEFAULT NULL,
  p_fee_minor bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_contract record;
  v_source_type text;
  v_already_processed boolean;
  v_amount_minor bigint;
  v_fee_minor bigint;
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_service_role') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF (p_application_id IS NULL AND p_service_order_id IS NULL)
     OR (p_application_id IS NOT NULL AND p_service_order_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Payment must reference exactly one source';
  END IF;

  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF p_user_id IS NOT NULL AND v_contract.company_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Payment user does not match contract company';
  END IF;

  v_source_type := COALESCE(
    v_contract.source_type,
    CASE WHEN v_contract.service_order_id IS NOT NULL THEN 'service_order' ELSE 'application' END
  );

  IF p_application_id IS NOT NULL THEN
    IF v_source_type <> 'application'
       OR v_contract.application_id IS DISTINCT FROM p_application_id
       OR v_contract.service_order_id IS NOT NULL THEN
      RAISE EXCEPTION 'Application payment source does not match contract';
    END IF;
  ELSE
    IF v_source_type <> 'service_order'
       OR v_contract.service_order_id IS DISTINCT FROM p_service_order_id
       OR v_contract.application_id IS NOT NULL THEN
      RAISE EXCEPTION 'Service order payment source does not match contract';
    END IF;
  END IF;

  IF array_length(p_milestone_ids, 1) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM unnest(p_milestone_ids) AS requested_milestone(id)
    LEFT JOIN public.milestones m ON m.id = requested_milestone.id
    WHERE m.id IS NULL OR m.contract_id <> p_contract_id
  ) THEN
    RAISE EXCEPTION 'Milestone metadata does not match contract';
  END IF;

  IF p_amount_minor IS NOT NULL THEN
    IF abs(p_amount_minor - (p_amount_pln * 100)::bigint) > 0 THEN
      RAISE EXCEPTION 'Financial inconsistency: p_amount_pln (%) and p_amount_minor (%) mismatch', p_amount_pln, p_amount_minor;
    END IF;
    v_amount_minor := p_amount_minor;
  ELSE
    v_amount_minor := (p_amount_pln * 100)::bigint;
  END IF;

  IF p_fee_minor IS NOT NULL THEN
    IF abs(p_fee_minor - (p_fee_pln * 100)::bigint) > 0 THEN
      RAISE EXCEPTION 'Financial inconsistency: p_fee_pln (%) and p_fee_minor (%) mismatch', p_fee_pln, p_fee_minor;
    END IF;
    v_fee_minor := p_fee_minor;
  ELSE
    v_fee_minor := (p_fee_pln * 100)::bigint;
  END IF;

  INSERT INTO public.payments (
    contract_id, stripe_session_id, stripe_payment_intent_id, amount_total, platform_fee, status, completed_at
  ) VALUES (
    p_contract_id, p_session_id, p_payment_intent_id, v_amount_minor::int, v_fee_minor::int, 'completed', now()
  )
  ON CONFLICT (stripe_session_id) DO UPDATE SET
    status = 'completed',
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    completed_at = now()
  WHERE public.payments.status != 'completed'
  RETURNING (status = 'completed') INTO v_already_processed;

  UPDATE public.milestones
  SET status = 'funded', funded_at = now()
  WHERE contract_id = p_contract_id
    AND (
      (array_length(p_milestone_ids, 1) > 0 AND id = ANY(p_milestone_ids))
      OR array_length(p_milestone_ids, 1) IS NULL
    )
    AND status = 'awaiting_funding';

  UPDATE public.contracts
  SET status = 'active', funded_at = now(), total_amount_minor = v_amount_minor
  WHERE id = p_contract_id AND status IN ('awaiting_funding', 'draft');

  IF p_application_id IS NOT NULL THEN
    UPDATE public.applications
    SET status = 'in_progress'
    WHERE id = p_application_id AND status = 'accepted';
  END IF;

  IF p_service_order_id IS NOT NULL THEN
    UPDATE public.service_orders
    SET status = 'accepted'
    WHERE id = p_service_order_id AND status IN ('pending', 'proposal_sent');
  END IF;

  INSERT INTO public.financial_ledger (
    type, amount, amount_minor, currency, direction, contract_id, application_id, service_order_id,
    stripe_payment_intent_id, stripe_session_id, description
  ) VALUES (
    'stripe_payment', p_amount_pln, v_amount_minor, 'PLN', 'credit', p_contract_id, p_application_id, p_service_order_id,
    p_payment_intent_id, p_session_id, 'Wplata Stripe - kontrakt ' || p_contract_id
  ) ON CONFLICT (stripe_session_id) WHERE type = 'stripe_payment' DO NOTHING;

  PERFORM public.record_accounting_entry(
    'Stripe Operations',
    'payment',
    p_contract_id,
    'Funding escrow for contract ' || p_contract_id,
    'fund_' || p_session_id,
    '1010',
    '2010',
    v_amount_minor
  );

  IF v_fee_minor > 0 THEN
    PERFORM public.record_accounting_entry(
      'Stripe Operations',
      'payment',
      p_contract_id,
      'Platform commission for contract ' || p_contract_id,
      'comm_' || p_session_id,
      '2010',
      '4010',
      v_fee_minor
    );
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.process_stripe_payment_v4(text, text, uuid, uuid, uuid, numeric, numeric, uuid[], uuid, bigint, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_stripe_payment_v4(text, text, uuid, uuid, uuid, numeric, numeric, uuid[], uuid, bigint, bigint) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_payment_v4(text, text, uuid, uuid, uuid, numeric, numeric, uuid[], uuid, bigint, bigint) TO service_role;

-- Critical hardening: legacy manual funding action/RPC must require a completed Stripe payment.
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
    v_has_completed_payment boolean;
BEGIN
    SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;

    IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_service_role')
       AND v_contract.company_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Only company can fund contract';
    END IF;

    IF COALESCE(v_contract.status, '') NOT IN ('awaiting_funding', 'draft', 'active') THEN
        RAISE EXCEPTION 'Contract is not ready for funding';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.payments p
      WHERE p.contract_id = p_contract_id
        AND p.status = 'completed'
    ) INTO v_has_completed_payment;

    IF NOT v_has_completed_payment THEN
        RAISE EXCEPTION 'Stripe payment must be completed before funding contract';
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

GRANT EXECUTE ON FUNCTION public.company_fund_contract_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.company_fund_contract_v2(uuid) TO service_role;

-- Critical hardening: student deliveries are accepted only for funded/in-progress milestones.
CREATE OR REPLACE FUNCTION public.submit_delivery_v2(
    p_milestone_id UUID,
    p_description TEXT,
    p_files JSONB,
    p_contract_id UUID
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
    SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;

    SELECT * INTO v_contract FROM public.contracts WHERE id = v_milestone.contract_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;

    IF p_contract_id IS NOT NULL AND p_contract_id != v_contract.id THEN
        RAISE EXCEPTION 'Contract mismatch';
    END IF;

    IF v_contract.student_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Only assigned student can submit work';
    END IF;

    IF COALESCE(v_contract.status, '') NOT IN ('active', 'delivered') THEN
        RAISE EXCEPTION 'Contract must be funded before delivery';
    END IF;

    IF v_milestone.status NOT IN ('funded', 'in_progress') THEN
        RAISE EXCEPTION 'Milestone must be funded or in progress before delivery';
    END IF;

    v_review_days := COALESCE(v_contract.review_window_days, 8);
    v_app_id := v_contract.application_id;
    v_so_id := v_contract.service_order_id;

    IF v_so_id IS NOT NULL THEN
        v_app_id := NULL;
    END IF;

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

    UPDATE public.milestones
    SET status = 'delivered',
        delivered_at = now(),
        auto_accept_at = now() + make_interval(days => v_review_days),
        updated_at = now()
    WHERE id = p_milestone_id;

    UPDATE public.contracts
    SET status = 'delivered',
        updated_at = now()
    WHERE id = v_contract.id
      AND status = 'active';

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
    END;

    RETURN jsonb_build_object('status', 'OK', 'milestone_status', 'delivered');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_delivery_v2(uuid, text, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_delivery_v2(uuid, text, jsonb, uuid) TO service_role;

-- Critical hardening: company review requires a delivered milestone and a pending deliverable.
CREATE OR REPLACE FUNCTION public.review_delivery_v3(
    p_milestone_id    UUID,
    p_decision        TEXT,
    p_feedback        TEXT DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
    v_milestone       record;
    v_contract        record;
    v_latest_deliv_id UUID;
    v_next            uuid;
    v_entry_id        uuid;
    v_commission      numeric;
    v_fee             numeric;
    v_net             numeric;
    v_pit_result      record;
    v_amount_minor    bigint;
    v_net_minor       bigint;
    v_pit_minor       bigint;
BEGIN
    IF p_decision NOT IN ('accepted', 'rejected') THEN
        RAISE EXCEPTION 'Invalid decision: %', p_decision;
    END IF;

    SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;

    SELECT * INTO v_contract FROM public.contracts WHERE id = v_milestone.contract_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;

    IF v_contract.company_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF v_milestone.status <> 'delivered' THEN
        RAISE EXCEPTION 'Milestone must be delivered before review';
    END IF;

    SELECT id INTO v_latest_deliv_id
    FROM public.deliverables
    WHERE milestone_id = p_milestone_id AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1;

    IF v_latest_deliv_id IS NULL THEN
        RAISE EXCEPTION 'Pending deliverable not found';
    END IF;

    IF p_decision = 'accepted' THEN
        IF EXISTS (
          SELECT 1
          FROM public.payouts
          WHERE milestone_id = p_milestone_id
            AND status IN ('pending', 'processing', 'paid')
        ) THEN
          RAISE EXCEPTION 'Payout already exists for milestone';
        END IF;

        UPDATE public.milestones
        SET status = 'released', accepted_at = now(), released_at = now(), updated_at = now()
        WHERE id = p_milestone_id;

        UPDATE public.deliverables
        SET status = 'accepted', company_feedback = p_feedback, updated_at = now()
        WHERE id = v_latest_deliv_id;

        UPDATE public.deliverables
        SET status = 'rejected',
            company_feedback = 'Odrzucono automatycznie (zastapione nowsza wersja)',
            updated_at = now()
        WHERE milestone_id = p_milestone_id
          AND status = 'pending'
          AND id != v_latest_deliv_id;

        v_commission := COALESCE(v_contract.commission_rate, 0.10);
        v_fee        := ROUND(v_milestone.amount * v_commission, 2);
        v_net        := GREATEST(v_milestone.amount - v_fee, 0);

        SELECT * INTO v_pit_result
        FROM public.calculate_pit_withholding(
            p_milestone_id,
            v_contract.id,
            v_contract.student_id,
            v_net
        );

        INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
        VALUES (p_milestone_id, v_contract.id, v_milestone.amount, v_fee, v_pit_result.amount_net, 'pending');

        v_amount_minor := (v_milestone.amount * 100)::bigint;
        v_net_minor := (v_pit_result.amount_net * 100)::bigint;
        v_pit_minor := (v_pit_result.pit_amount * 100)::bigint;

        INSERT INTO public.accounting_entries (
          journal_id, reference_type, reference_id, description, idempotency_key
        ) VALUES (
          (SELECT id FROM public.accounting_journals WHERE name = 'Payout Operations'),
          'milestone_release',
          p_milestone_id,
          'Release milestone ' || v_milestone.title || ' to student payable',
          'acc_accept_' || p_milestone_id
        ) ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO v_entry_id;

        IF v_entry_id IS NOT NULL THEN
          INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
          VALUES (
            v_entry_id,
            (SELECT id FROM public.accounting_accounts WHERE code = '2010'),
            v_amount_minor,
            'debit'
          );

          INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
          VALUES (
            v_entry_id,
            (SELECT id FROM public.accounting_accounts WHERE code = '2020'),
            v_net_minor,
            'credit'
          );

          IF v_pit_minor > 0 THEN
            INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
            VALUES (
              v_entry_id,
              (SELECT id FROM public.accounting_accounts WHERE code = '2030'),
              v_pit_minor,
              'credit'
            );
          END IF;
        END IF;

        v_next := public._activate_next_milestone(v_contract.id);

        IF NOT EXISTS (
            SELECT 1 FROM public.milestones
            WHERE contract_id = v_contract.id
              AND status NOT IN ('released','refunded','accepted')
        ) THEN
            UPDATE public.contracts SET status = 'completed', updated_at = now() WHERE id = v_contract.id;
            IF v_contract.application_id IS NOT NULL THEN
                UPDATE public.applications
                SET status = 'completed', realization_status = 'completed'
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

    ELSE
        UPDATE public.milestones SET status = 'in_progress', updated_at = now() WHERE id = p_milestone_id;
        UPDATE public.deliverables SET status = 'rejected', company_feedback = p_feedback, updated_at = now() WHERE id = v_latest_deliv_id;
        UPDATE public.contracts SET status = 'active', updated_at = now() WHERE id = v_contract.id AND status != 'completed';
        BEGIN
            PERFORM public.create_notification(v_contract.student_id, 'milestone_rejected', jsonb_build_object('milestone_id', p_milestone_id, 'contract_id', v_contract.id));
        EXCEPTION WHEN OTHERS THEN END;
        RETURN jsonb_build_object('status', 'OK', 'decision', 'rejected');
    END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.review_delivery_v3(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_delivery_v3(uuid, text, text) TO service_role;

-- Critical hardening: caller cannot spoof company_id while assigning service order students.
CREATE OR REPLACE FUNCTION public.assign_service_order_student_locked(
  p_order_id uuid,
  p_company_id uuid,
  p_student_id uuid,
  p_max_active_orders integer DEFAULT 1,
  p_preferred_status text DEFAULT 'pending_student_confirmation',
  p_fallback_status text DEFAULT 'pending'
)
RETURNS TABLE (
  order_id uuid,
  applied_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.service_orders%ROWTYPE;
  v_active_orders integer := 0;
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_service_role')
     AND auth.uid() IS DISTINCT FROM p_company_id THEN
    RAISE EXCEPTION 'Nie masz uprawnien do tego zamowienia.';
  END IF;

  SELECT *
  INTO v_order
  FROM public.service_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono zamowienia.';
  END IF;

  IF v_order.company_id <> p_company_id THEN
    RAISE EXCEPTION 'Nie masz uprawnien do tego zamowienia.';
  END IF;

  IF v_order.student_id IS NOT NULL THEN
    RAISE EXCEPTION 'Do tego zamowienia student jest juz przypisany.';
  END IF;

  IF v_order.status NOT IN ('pending_selection', 'pending') THEN
    RAISE EXCEPTION 'To zamowienie nie jest juz na etapie wyboru studenta.';
  END IF;

  PERFORM 1
  FROM public.student_profiles
  WHERE user_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono profilu studenta.';
  END IF;

  SELECT COUNT(*)::int
  INTO v_active_orders
  FROM public.service_orders
  WHERE student_id = p_student_id
    AND status IN ('active', 'in_progress', 'pending_student_confirmation', 'pending_confirmation');

  IF v_active_orders >= GREATEST(COALESCE(p_max_active_orders, 1), 1) THEN
    RAISE EXCEPTION 'Ten student osiagnal limit aktywnych zlecen. Wybierz innego.';
  END IF;

  BEGIN
    UPDATE public.service_orders
    SET
      student_id = p_student_id,
      status = p_preferred_status,
      student_selection_mode = 'company_choice',
      student_selected_at = NOW()
    WHERE id = p_order_id
      AND company_id = p_company_id
      AND student_id IS NULL
    RETURNING id, status INTO order_id, applied_status;
  EXCEPTION WHEN check_violation THEN
    UPDATE public.service_orders
    SET
      student_id = p_student_id,
      status = p_fallback_status,
      student_selection_mode = 'company_choice',
      student_selected_at = NOW()
    WHERE id = p_order_id
      AND company_id = p_company_id
      AND student_id IS NULL
    RETURNING id, status INTO order_id, applied_status;
  END;

  IF order_id IS NULL THEN
    RAISE EXCEPTION 'Nie udalo sie przypisac studenta.';
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_service_order_student_locked(uuid, uuid, uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_service_order_student_locked(uuid, uuid, uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_service_order_student_locked(uuid, uuid, uuid, integer, text, text) TO service_role;

COMMIT;
