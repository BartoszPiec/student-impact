-- Close the MVP payment loop:
-- 1) auto-accepted milestones create the same payout records as manual acceptance
-- 2) service-role payout closing can be done by the Stripe transfer worker

CREATE INDEX IF NOT EXISTS idx_payouts_milestone_status_created
  ON public.payouts (milestone_id, status, created_at DESC);

DROP FUNCTION IF EXISTS public.process_payout_paid_v1(uuid, uuid);

CREATE OR REPLACE FUNCTION public.process_payout_paid_v1(
  p_payout_id uuid,
  p_admin_id uuid DEFAULT NULL,
  p_amount_net_minor bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_payout record;
  v_entry_id uuid;
  v_admin_role text;
  v_actor text := 'system';
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_service_role') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_admin_id IS NOT NULL THEN
    SELECT role INTO v_admin_role
    FROM public.profiles
    WHERE user_id = p_admin_id
    LIMIT 1;

    IF v_admin_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: invalid admin_id';
    END IF;

    v_actor := 'admin';
  END IF;

  SELECT * INTO v_payout FROM public.payouts WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;

  IF p_amount_net_minor IS NOT NULL THEN
    IF p_amount_net_minor != v_payout.amount_net_minor THEN
      RAISE EXCEPTION 'Financial inconsistency: p_amount_net_minor (%) and v_payout.amount_net_minor (%) mismatch',
        p_amount_net_minor,
        v_payout.amount_net_minor;
    END IF;
  END IF;

  IF v_payout.status = 'paid' THEN
    RETURN;
  END IF;

  UPDATE public.payouts
  SET status = 'paid', paid_at = now(), updated_at = now()
  WHERE id = p_payout_id;

  INSERT INTO public.accounting_entries (journal_id, reference_type, reference_id, description, idempotency_key)
  VALUES (
    (SELECT id FROM public.accounting_journals WHERE name = 'Payout Operations'),
    'student_payout',
    p_payout_id,
    CASE
      WHEN v_actor = 'admin' THEN 'Admin closed student payout ' || p_payout_id
      ELSE 'Automatic Stripe transfer to student ' || p_payout_id
    END,
    'acc_payout_paid_' || p_payout_id
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_entry_id;

  IF v_entry_id IS NOT NULL THEN
    INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
    VALUES (
      v_entry_id,
      (SELECT id FROM public.accounting_accounts WHERE code = '2020'),
      v_payout.amount_net_minor,
      'debit'
    );

    INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
    VALUES (
      v_entry_id,
      (SELECT id FROM public.accounting_accounts WHERE code = '1020'),
      v_payout.amount_net_minor,
      'credit'
    );
  END IF;

  INSERT INTO public.financial_ledger (type, amount, amount_minor, currency, direction, contract_id, description, metadata)
  VALUES (
    'student_payout',
    v_payout.amount_net,
    v_payout.amount_net_minor,
    'PLN',
    'debit',
    v_payout.contract_id,
    'Student payout (Payout ID: ' || p_payout_id || ')',
    jsonb_build_object('payout_id', p_payout_id, 'admin_id', p_admin_id, 'actor', v_actor)
  )
  ON CONFLICT (id) DO NOTHING;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.process_payout_paid_v1(uuid, uuid, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_payout_paid_v1(uuid, uuid, bigint) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_payout_paid_v1(uuid, uuid, bigint) TO service_role;

CREATE OR REPLACE FUNCTION public.auto_accept_due_milestones_v2(p_limit int DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  v_milestone record;
  v_contract record;
  v_done int := 0;
  v_next uuid;
  v_latest_deliv_id uuid;
  v_payout_id uuid;
  v_payout_ids uuid[] := ARRAY[]::uuid[];
  v_entry_id uuid;
  v_commission numeric;
  v_fee numeric;
  v_net numeric;
  v_pit_result record;
  v_amount_minor bigint;
  v_fee_minor bigint;
  v_net_minor bigint;
  v_pit_minor bigint;
BEGIN
  FOR v_milestone IN
    SELECT *
    FROM public.milestones
    WHERE status = 'delivered'
      AND auto_accept_at IS NOT NULL
      AND auto_accept_at <= now()
    ORDER BY auto_accept_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT * INTO v_contract
    FROM public.contracts
    WHERE id = v_milestone.contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    UPDATE public.milestones
    SET status = 'released',
        accepted_at = now(),
        released_at = now(),
        updated_at = now()
    WHERE id = v_milestone.id
      AND status = 'delivered';

    SELECT id INTO v_latest_deliv_id
    FROM public.deliverables
    WHERE milestone_id = v_milestone.id
      AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_latest_deliv_id IS NOT NULL THEN
      UPDATE public.deliverables
      SET status = 'accepted',
          company_feedback = COALESCE(company_feedback, 'Zaakceptowano automatycznie po uplywie terminu.'),
          updated_at = now()
      WHERE id = v_latest_deliv_id;
    END IF;

    UPDATE public.deliverables
    SET status = 'rejected',
        company_feedback = 'Odrzucono automatycznie, poniewaz istnieje nowsza wersja pracy.',
        updated_at = now()
    WHERE milestone_id = v_milestone.id
      AND status = 'pending'
      AND id != COALESCE(v_latest_deliv_id, '00000000-0000-0000-0000-000000000000'::uuid);

    SELECT id INTO v_payout_id
    FROM public.payouts
    WHERE milestone_id = v_milestone.id
      AND status IN ('pending', 'processing', 'paid')
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_payout_id IS NULL THEN
      v_commission := COALESCE(v_contract.commission_rate, 0.10);
      v_fee := ROUND(v_milestone.amount * v_commission, 2);
      v_net := GREATEST(v_milestone.amount - v_fee, 0);
      v_amount_minor := COALESCE(v_milestone.amount_minor, ROUND(v_milestone.amount * 100)::bigint);
      v_fee_minor := ROUND(v_fee * 100)::bigint;

      SELECT * INTO v_pit_result
      FROM public.calculate_pit_withholding(
        v_milestone.id,
        v_contract.id,
        v_contract.student_id,
        v_net
      );

      v_net_minor := ROUND(v_pit_result.amount_net * 100)::bigint;
      v_pit_minor := ROUND(v_pit_result.pit_amount * 100)::bigint;

      INSERT INTO public.payouts(
        milestone_id,
        contract_id,
        amount_gross,
        platform_fee,
        amount_net,
        amount_gross_minor,
        platform_fee_minor,
        amount_net_minor,
        status
      )
      VALUES (
        v_milestone.id,
        v_contract.id,
        v_milestone.amount,
        v_fee,
        v_pit_result.amount_net,
        v_amount_minor,
        v_fee_minor,
        v_net_minor,
        'pending'
      )
      RETURNING id INTO v_payout_id;

      INSERT INTO public.accounting_entries (
        journal_id,
        reference_type,
        reference_id,
        description,
        idempotency_key
      )
      VALUES (
        (SELECT id FROM public.accounting_journals WHERE name = 'Payout Operations'),
        'milestone_release',
        v_milestone.id,
        'Auto-release milestone ' || v_milestone.title || ' to student payable',
        'acc_auto_accept_' || v_milestone.id
      )
      ON CONFLICT (idempotency_key) DO NOTHING
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
    END IF;

    IF v_payout_id IS NOT NULL THEN
      v_payout_ids := array_append(v_payout_ids, v_payout_id);
    END IF;

    v_next := public._activate_next_milestone(v_contract.id);

    IF NOT EXISTS (
      SELECT 1
      FROM public.milestones
      WHERE contract_id = v_contract.id
        AND status NOT IN ('released', 'refunded', 'accepted')
    ) THEN
      UPDATE public.contracts
      SET status = 'completed',
          updated_at = now()
      WHERE id = v_contract.id;

      IF v_contract.application_id IS NOT NULL THEN
        UPDATE public.applications
        SET status = 'completed', realization_status = 'completed'
        WHERE id = v_contract.application_id
          AND status IN ('accepted', 'in_progress', 'delivered');
      END IF;

      IF v_contract.service_order_id IS NOT NULL THEN
        UPDATE public.service_orders
        SET status = 'completed', updated_at = now()
        WHERE id = v_contract.service_order_id
          AND status IN ('accepted', 'active', 'in_progress', 'revision', 'delivered');
      END IF;
    END IF;

    BEGIN
      PERFORM public.create_notification(
        v_contract.student_id,
        'milestone_accepted',
        jsonb_build_object(
          'milestone_id', v_milestone.id,
          'contract_id', v_contract.id,
          'next_milestone_id', v_next,
          'auto_accepted', true,
          'payout_id', v_payout_id
        )
      );
    EXCEPTION WHEN OTHERS THEN END;

    v_done := v_done + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'OK',
    'processed', v_done,
    'payout_ids', to_jsonb(v_payout_ids)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.auto_accept_due_milestones_v2(int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_accept_due_milestones_v2(int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.auto_accept_due_milestones_v2(int) TO service_role;
