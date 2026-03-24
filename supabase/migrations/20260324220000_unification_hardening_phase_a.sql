-- Migration: Unit Unification Hardening (Phase A)
-- Created: 2026-03-24
-- Description: Backfills missing _minor columns and adds cross-validation to financial RPCs.

-- 1. Backfill applications.agreed_stawka_minor
UPDATE public.applications 
SET agreed_stawka_minor = (agreed_stawka * 100)::bigint 
WHERE agreed_stawka_minor IS NULL AND agreed_stawka IS NOT NULL;

-- 2. Update process_stripe_payment_v4 with cross-validation
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
AS $function$
DECLARE
  v_already_processed BOOLEAN;
  v_amount_minor bigint;
  v_fee_minor bigint;
BEGIN
  -- Cross-validation logic
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

  -- 1. Operational Layer: UPSERT the payment record
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

  -- 2. Update Milestones & Contract
  UPDATE public.milestones
  SET status = 'funded', funded_at = now()
  WHERE (
    (array_length(p_milestone_ids, 1) > 0 AND id = ANY(p_milestone_ids))
    OR 
    (array_length(p_milestone_ids, 1) IS NULL AND contract_id = p_contract_id)
  ) 
  AND status = 'awaiting_funding';

  UPDATE public.contracts
  SET status = 'active', funded_at = now(), total_amount_minor = v_amount_minor
  WHERE id = p_contract_id AND status IN ('awaiting_funding', 'draft');

  -- Update Application or Service Order status
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

  -- 3. Legacy Ledger Layer (for backward compatibility)
  INSERT INTO public.financial_ledger (
    type, amount, amount_minor, currency, direction, contract_id, application_id, service_order_id,
    stripe_payment_intent_id, stripe_session_id, description
  ) VALUES (
    'stripe_payment', p_amount_pln, v_amount_minor, 'PLN', 'credit', p_contract_id, p_application_id, p_service_order_id,
    p_payment_intent_id, p_session_id, 'Wpłata Stripe — kontrakt ' || p_contract_id
  ) ON CONFLICT (stripe_session_id) WHERE type = 'stripe_payment' DO NOTHING;

  -- 4. NEW: Canonical Accounting Layer (Double-Entry)
  -- Entry 1: Funding Escrow (Cash -> Liability)
  PERFORM public.record_accounting_entry(
    'Stripe Operations',
    'payment',
    p_contract_id,
    'Funding escrow for contract ' || p_contract_id,
    'fund_' || p_session_id,
    '1010', -- Debit: Cash Stripe Clearing
    '2010', -- Credit: Escrow Liability
    v_amount_minor
  );

  -- Entry 2: Platform Commission recognition (Liability -> Revenue)
  IF v_fee_minor > 0 THEN
    PERFORM public.record_accounting_entry(
      'Stripe Operations',
      'payment',
      p_contract_id,
      'Platform commission for contract ' || p_contract_id,
      'comm_' || p_session_id,
      '2010', -- Debit: Escrow Liability
      '4010', -- Credit: Platform Commission Revenue
      v_fee_minor
    );
  END IF;

END;
$function$;

-- 3. Update process_stripe_refund_v4 with cross-validation
CREATE OR REPLACE FUNCTION public.process_stripe_refund_v4(
  p_payment_intent_id text, 
  p_charge_id text, 
  p_refund_id text, 
  p_refund_amount_delta_pln numeric, 
  p_currency text, 
  p_reason text,
  p_refund_amount_delta_minor bigint DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_payment_record RECORD;
  v_total_refunded_pln numeric;
  v_refund_minor bigint;
BEGIN
  -- Cross-validation logic
  IF p_refund_amount_delta_minor IS NOT NULL THEN
    IF abs(p_refund_amount_delta_minor - (p_refund_amount_delta_pln * 100)::bigint) > 0 THEN
      RAISE EXCEPTION 'Financial inconsistency: p_refund_amount_delta_pln (%) and p_refund_amount_delta_minor (%) mismatch', p_refund_amount_delta_pln, p_refund_amount_delta_minor;
    END IF;
    v_refund_minor := p_refund_amount_delta_minor;
  ELSE
    v_refund_minor := (p_refund_amount_delta_pln * 100)::bigint;
  END IF;

  -- 1. Get Payment Info
  SELECT id, contract_id, stripe_session_id, amount_total INTO v_payment_record
  FROM public.payments
  WHERE stripe_payment_intent_id = p_payment_intent_id
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT id, contract_id, stripe_session_id, amount_total INTO v_payment_record
    FROM public.payments
    WHERE stripe_session_id = (SELECT stripe_session_id FROM public.financial_ledger WHERE stripe_charge_id = p_charge_id LIMIT 1)
    LIMIT 1;
    
    IF NOT FOUND THEN
       RAISE EXCEPTION 'Payment record not found';
    END IF;
  END IF;

  -- 2. Calculate Total Refunded so far
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded_pln
  FROM public.financial_ledger
  WHERE stripe_payment_intent_id = p_payment_intent_id 
    AND type = 'stripe_refund'
    AND stripe_refund_id != p_refund_id;

  v_total_refunded_pln := v_total_refunded_pln + p_refund_amount_delta_pln;

  -- 3. Update Statuses
  IF v_total_refunded_pln >= (v_payment_record.amount_total::numeric / 100.0) - 0.01 THEN
    UPDATE public.payments SET status = 'refunded', refunded_at = now() WHERE id = v_payment_record.id;
    IF v_payment_record.contract_id IS NOT NULL THEN
      UPDATE public.contracts SET status = 'cancelled' WHERE id = v_payment_record.contract_id;
      UPDATE public.milestones SET status = 'cancelled' 
      WHERE contract_id = v_payment_record.contract_id AND status IN ('funded', 'in_progress', 'awaiting_funding');
    END IF;
  ELSE
    UPDATE public.payments SET status = 'partially_refunded', refunded_at = now() WHERE id = v_payment_record.id;
  END IF;

  -- 4. Legacy Ledger Entry (Updated to include amount_minor)
  INSERT INTO public.financial_ledger (
    type, amount, amount_minor, currency, direction, contract_id, 
    stripe_payment_intent_id, stripe_charge_id, stripe_session_id, stripe_refund_id,
    description, metadata
  ) VALUES (
    'stripe_refund', p_refund_amount_delta_pln, v_refund_minor, p_currency, 'debit', v_payment_record.contract_id,
    p_payment_intent_id, p_charge_id, v_payment_record.stripe_session_id, p_refund_id,
    'Zwrot Stripe (' || p_refund_id || ') — kwota ' || p_refund_amount_delta_pln || ' ' || p_currency,
    jsonb_build_object('charge_id', p_charge_id, 'refund_id', p_refund_id, 'reason', p_reason)
  ) ON CONFLICT (stripe_refund_id) DO NOTHING;

  -- 5. NEW: Canonical Accounting Entry
  PERFORM public.record_accounting_entry(
    'Stripe Operations',
    'refund',
    v_payment_record.contract_id,
    'Stripe Refund reversal for contract ' || v_payment_record.contract_id,
    'ref_post_' || p_refund_id,
    '2010', -- Debit: Escrow Liability
    '1010', -- Credit: Cash Stripe Clearing
    v_refund_minor
  );

END;
$function$;

-- 4. Update process_payout_paid_v1 with cross-validation
CREATE OR REPLACE FUNCTION public.process_payout_paid_v1(
  p_payout_id uuid, 
  p_admin_id uuid,
  p_amount_net_minor bigint DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_payout      record;
    v_entry_id    uuid;
BEGIN
    SELECT * INTO v_payout FROM public.payouts WHERE id = p_payout_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found'; END IF;

    -- Cross-validation logic
    IF p_amount_net_minor IS NOT NULL THEN
      IF p_amount_net_minor != v_payout.amount_net_minor THEN
        RAISE EXCEPTION 'Financial inconsistency: p_amount_net_minor (%) and v_payout.amount_net_minor (%) mismatch', p_amount_net_minor, v_payout.amount_net_minor;
      END IF;
    END IF;

    IF v_payout.status = 'paid' THEN
        RETURN;
    END IF;

    UPDATE public.payouts
    SET status = 'paid', paid_at = now(), updated_at = now()
    WHERE id = p_payout_id;

    -- Using existing amount_net_minor column
    INSERT INTO public.accounting_entries (journal_id, reference_type, reference_id, description, idempotency_key)
    VALUES ((SELECT id FROM public.accounting_journals WHERE name = 'Payout Operations'), 'student_payout', p_payout_id, 'Bank transfer to student ' || p_payout_id, 'acc_payout_paid_' || p_payout_id)
    ON CONFLICT (idempotency_key) DO NOTHING RETURNING id INTO v_entry_id;

    IF v_entry_id IS NOT NULL THEN
      INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction) VALUES (v_entry_id, (SELECT id FROM public.accounting_accounts WHERE code = '2020'), v_payout.amount_net_minor, 'debit');
      INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction) VALUES (v_entry_id, (SELECT id FROM public.accounting_accounts WHERE code = '1020'), v_payout.amount_net_minor, 'credit');
    END IF;

    -- Updated to include amount_minor
    INSERT INTO public.financial_ledger (type, amount, amount_minor, currency, direction, contract_id, description, metadata)
    VALUES ('student_payout', v_payout.amount_net, v_payout.amount_net_minor, 'PLN', 'debit', v_payout.contract_id, 'Wypłata środków dla studenta (Payout ID: ' || p_payout_id || ')', jsonb_build_object('payout_id', p_payout_id, 'admin_id', p_admin_id))
    ON CONFLICT (id) DO NOTHING;

END;
$function$;
