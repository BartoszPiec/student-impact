-- Migration: Milestone Review Hardening v3 (Accounting)
-- Created: 2026-03-24
-- Description: v3 RPC with double-entry accounting entries for liability shifts.

CREATE OR REPLACE FUNCTION public.review_delivery_v3(
    p_milestone_id    UUID,
    p_decision        TEXT, -- 'accepted' | 'rejected'
    p_feedback        TEXT
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_milestone       record;
    v_contract        record;
    v_latest_deliv_id UUID;
    v_next            uuid;
    v_commission      numeric;
    v_fee             numeric;
    v_net             numeric;
    v_pit_result      record;
    v_amount_minor    bigint;
    v_net_minor       bigint;
    v_pit_minor       bigint;
BEGIN
    -- 1. Lock and Verify
    SELECT * INTO v_milestone FROM public.milestones WHERE id = p_milestone_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;

    SELECT * INTO v_contract FROM public.contracts WHERE id = v_milestone.contract_id FOR UPDATE;

    IF v_contract.company_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT id INTO v_latest_deliv_id
    FROM public.deliverables
    WHERE milestone_id = p_milestone_id AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1;

    IF p_decision = 'accepted' THEN

        -- 2. Operational Updates
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

        -- 3. Financial Calculations
        v_commission := COALESCE(v_contract.commission_rate, 0.10);
        v_fee        := ROUND(v_milestone.amount * v_commission, 2);
        v_net        := GREATEST(v_milestone.amount - v_fee, 0);

        -- PIT Calculation (Existing logic)
        SELECT * INTO v_pit_result
        FROM public.calculate_pit_withholding(
            p_milestone_id,
            v_contract.id,
            v_contract.student_id,
            v_net
        );

        -- 4. Payout Record (Operational)
        INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
        VALUES (p_milestone_id, v_contract.id, v_milestone.amount, v_fee, v_pit_result.amount_net, 'pending');

        -- 5. NEW: Canonical Accounting Entry (Double-Entry Shift)
        v_amount_minor := (v_milestone.amount * 100)::bigint;
        v_net_minor := (v_pit_result.amount_net * 100)::bigint;
        v_pit_minor := (v_pit_result.pit_amount * 100)::bigint;

        -- We shift liability from general Escrow to specific Student Payable + Tax Payable
        -- Entry Header
        INSERT INTO public.accounting_entries (
          journal_id, reference_type, reference_id, description, idempotency_key
        ) VALUES (
          (SELECT id FROM public.accounting_journals WHERE name = 'Payout Operations'),
          'milestone_release',
          p_milestone_id,
          'Release milestone ' || v_milestone.title || ' to student payable',
          'acc_accept_' || p_milestone_id
        ) ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO v_next; -- Temporary reuse of v_next for entry_id

        IF v_next IS NOT NULL THEN
          -- Debit: Escrow Liability (Total Milestone Amount)
          INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
          VALUES (
            v_next, 
            (SELECT id FROM public.accounting_accounts WHERE code = '2010'), 
            v_amount_minor, 
            'debit'
          );

          -- Credit: Student Payable (Net Amount)
          INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
          VALUES (
            v_next, 
            (SELECT id FROM public.accounting_accounts WHERE code = '2020'), 
            v_net_minor, 
            'credit'
          );

          -- Credit: Tax Withholding Payable (PIT Amount)
          IF v_pit_minor > 0 THEN
            INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
            VALUES (
              v_next, 
              (SELECT id FROM public.accounting_accounts WHERE code = '2030'), 
              v_pit_minor, 
              'credit'
            );
          END IF;
        END IF;

        -- 6. Completion logic
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

        -- Notifications
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
        -- ... [Existing reject logic stays same]
        UPDATE public.milestones SET status = 'in_progress', updated_at = now() WHERE id = p_milestone_id;
        IF v_latest_deliv_id IS NOT NULL THEN
            UPDATE public.deliverables SET status = 'rejected', company_feedback = p_feedback, updated_at = now() WHERE id = v_latest_deliv_id;
        END IF;
        UPDATE public.contracts SET status = 'active', updated_at = now() WHERE id = v_contract.id AND status != 'completed';
        BEGIN
            PERFORM public.create_notification(v_contract.student_id, 'milestone_rejected', jsonb_build_object('milestone_id', p_milestone_id, 'contract_id', v_contract.id));
        EXCEPTION WHEN OTHERS THEN END;
        RETURN jsonb_build_object('status', 'OK', 'decision', 'rejected');
    ELSE
        RAISE EXCEPTION 'Invalid decision: %', p_decision;
    END IF;
END;
$function$;
