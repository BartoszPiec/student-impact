-- Migration: Payout Process Hardening v1 (Accounting)
-- Created: 2026-03-24
-- Description: v1 RPC with double-entry accounting for bank transfers.

CREATE OR REPLACE FUNCTION public.process_payout_paid_v1(
    p_payout_id UUID,
    p_admin_id  UUID
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_payout      record;
    v_net_minor   bigint;
    v_entry_id    uuid;
BEGIN
    -- 1. Lock and Verify
    SELECT * INTO v_payout FROM public.payouts WHERE id = p_payout_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found'; END IF;

    IF v_payout.status = 'paid' THEN
        RETURN; -- Already processed
    END IF;

    -- 2. Update Status (Operational)
    UPDATE public.payouts
    SET status = 'paid', paid_at = now(), updated_at = now()
    WHERE id = p_payout_id;

    -- 3. NEW: Canonical Accounting Entry (Payable -> Cash)
    v_net_minor := (v_payout.amount_net * 100)::bigint;

    INSERT INTO public.accounting_entries (
      journal_id, reference_type, reference_id, description, idempotency_key
    ) VALUES (
      (SELECT id FROM public.accounting_journals WHERE name = 'Payout Operations'),
      'student_payout',
      p_payout_id,
      'Bank transfer to student for payout ' || p_payout_id,
      'acc_payout_paid_' || p_payout_id
    ) ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_entry_id;

    IF v_entry_id IS NOT NULL THEN
      -- Debit: Student Payable (Decreasing liability)
      INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
      VALUES (
        v_entry_id, 
        (SELECT id FROM public.accounting_accounts WHERE code = '2020'), 
        v_net_minor, 
        'debit'
      );

      -- Credit: Cash Bank Main (Decreasing asset)
      INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
      VALUES (
        v_entry_id, 
        (SELECT id FROM public.accounting_accounts WHERE code = '1020'), 
        v_net_minor, 
        'credit'
      );
    END IF;

    -- 4. Legacy Ledger Entry (Audit parity)
    INSERT INTO public.financial_ledger (
      type, amount, currency, direction, contract_id, 
      description, metadata
    ) VALUES (
      'student_payout', v_payout.amount_net, 'PLN', 'debit', v_payout.contract_id,
      'Wypłata środków dla studenta (Payout ID: ' || p_payout_id || ')',
      jsonb_build_object('payout_id', p_payout_id, 'admin_id', p_admin_id)
    ) ON CONFLICT DO NOTHING; -- Unique constraint on stripe_payout_id if we have one, but for manual transfers we rely on metadata check in JS or better yet, idempotency key here.

END;
$function$;
