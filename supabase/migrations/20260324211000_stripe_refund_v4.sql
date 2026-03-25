-- Migration: Stripe Refund Hardening v4 (Accounting & Service Orders)
-- Created: 2026-03-24
-- Description: v4 RPC with double-entry accounting and Service Order support.

CREATE OR REPLACE FUNCTION public.process_stripe_refund_v4(
  p_payment_intent_id text, 
  p_charge_id text, 
  p_refund_id text,
  p_refund_amount_delta_pln numeric, 
  p_currency text, 
  p_reason text
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
  v_refund_minor := (p_refund_amount_delta_pln * 100)::bigint;

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

  -- 2. Calculate Total Refunded so far (Operational)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded_pln
  FROM public.financial_ledger
  WHERE stripe_payment_intent_id = p_payment_intent_id 
    AND type = 'stripe_refund'
    AND stripe_refund_id != p_refund_id;

  v_total_refunded_pln := v_total_refunded_pln + p_refund_amount_delta_pln;

  -- 3. Update Statuses (Operational)
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

  -- 4. Legacy Ledger Entry
  INSERT INTO public.financial_ledger (
    type, amount, currency, direction, contract_id, 
    stripe_payment_intent_id, stripe_charge_id, stripe_session_id, stripe_refund_id,
    description, metadata
  ) VALUES (
    'stripe_refund', p_refund_amount_delta_pln, p_currency, 'debit', v_payment_record.contract_id,
    p_payment_intent_id, p_charge_id, v_payment_record.stripe_session_id, p_refund_id,
    'Zwrot Stripe (' || p_refund_id || ') — kwota ' || p_refund_amount_delta_pln || ' ' || p_currency,
    jsonb_build_object('charge_id', p_charge_id, 'refund_id', p_refund_id, 'reason', p_reason)
  ) ON CONFLICT (stripe_refund_id) DO NOTHING;

  -- 5. NEW: Canonical Accounting Entry (Double-Entry Reversal)
  -- Entry: Escrow Reversal (Liability -> Cash)
  PERFORM public.record_accounting_entry(
    'Stripe Operations',
    'refund',
    v_payment_record.contract_id,
    'Stripe Refund reversal for contract ' || v_payment_record.contract_id,
    'ref_post_' || p_refund_id,
    '2010', -- Debit: Escrow Liability (Decreasing liability)
    '1010', -- Credit: Cash Stripe Clearing (Decreasing asset)
    v_refund_minor
  );

END;
$function$;
