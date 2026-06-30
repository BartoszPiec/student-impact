-- Fix MVP smoke blocker:
-- review_delivery_v3 inserted payouts without platform_fee_minor, but the staging
-- schema requires this column to be NOT NULL.

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
    v_fee_minor       bigint;
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

        v_amount_minor := COALESCE(v_milestone.amount_minor, ROUND(v_milestone.amount * 100)::bigint);
        v_fee_minor := ROUND(v_fee * 100)::bigint;

        SELECT * INTO v_pit_result
        FROM public.calculate_pit_withholding(
            p_milestone_id,
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
            p_milestone_id,
            v_contract.id,
            v_milestone.amount,
            v_fee,
            v_pit_result.amount_net,
            v_amount_minor,
            v_fee_minor,
            v_net_minor,
            'pending'
        );

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
            IF v_contract.service_order_id IS NOT NULL THEN
                UPDATE public.service_orders
                SET status = 'completed', updated_at = now()
                WHERE id = v_contract.service_order_id
                  AND status IN ('accepted', 'active', 'in_progress', 'revision', 'delivered');
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
