-- Migration: Advanced Stripe Refund Delta Hardening (v3)
-- Created: 2026-03-24
-- Description: Absolute idempotency on refund_id and delta-based ledgering.

-- 1. Final Unique Index for Refunds
DROP INDEX IF EXISTS idx_ledger_stripe_refund_v2;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_stripe_refund_v3
ON public.financial_ledger (stripe_refund_id) 
WHERE (type = 'stripe_refund'::text);

-- 2. Advanced Refund Processing (v3)
CREATE OR REPLACE FUNCTION public.process_stripe_refund_v3(
  p_payment_intent_id text, 
  p_charge_id text, 
  p_refund_id text,
  p_refund_amount_delta_pln numeric, -- Actual amount of THIS refund event
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
BEGIN
  -- 1. Get Payment Info
  SELECT id, contract_id, stripe_session_id, amount_total INTO v_payment_record
  FROM public.payments
  WHERE stripe_payment_intent_id = p_payment_intent_id
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fallback to charge_id if payment_intent match fails (extreme edge case)
    SELECT id, contract_id, stripe_session_id, amount_total INTO v_payment_record
    FROM public.payments
    WHERE stripe_session_id = (SELECT stripe_session_id FROM public.financial_ledger WHERE stripe_charge_id = p_charge_id LIMIT 1)
    LIMIT 1;
    
    IF NOT FOUND THEN
       RAISE EXCEPTION 'Payment record not found for intent % or charge %', p_payment_intent_id, p_charge_id;
    END IF;
  END IF;

  -- 2. Calculate Total Refunded so far (including this delta)
  -- Sum from ledger + current delta
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded_pln
  FROM public.financial_ledger
  WHERE stripe_payment_intent_id = p_payment_intent_id 
    AND type = 'stripe_refund';

  -- Add current delta to the total
  v_total_refunded_pln := v_total_refunded_pln + p_refund_amount_delta_pln;

  -- 3. Check if we should fully cancel
  -- Comparison in PLN
  IF v_total_refunded_pln >= (v_payment_record.amount_total::numeric / 100.0) - 0.01 THEN -- 0.01 margin for rounding
    UPDATE public.payments SET status = 'refunded', refunded_at = now() WHERE id = v_payment_record.id;
    
    IF v_payment_record.contract_id IS NOT NULL THEN
      UPDATE public.contracts SET status = 'cancelled' WHERE id = v_payment_record.contract_id;
      UPDATE public.milestones SET status = 'cancelled' 
      WHERE contract_id = v_payment_record.contract_id AND status IN ('funded', 'in_progress', 'awaiting_funding');
    END IF;
  ELSE
    UPDATE public.payments SET status = 'partially_refunded', refunded_at = now() WHERE id = v_payment_record.id;
  END IF;

  -- 4. Insert Ledger Entry (Absolute Idempotency on refund_id)
  INSERT INTO public.financial_ledger (
    type, amount, currency, direction, contract_id, 
    stripe_payment_intent_id, stripe_charge_id, stripe_session_id, stripe_refund_id,
    description, metadata
  ) VALUES (
    'stripe_refund', p_refund_amount_delta_pln, p_currency, 'debit', v_payment_record.contract_id,
    p_payment_intent_id, p_charge_id, v_payment_record.stripe_session_id, p_refund_id,
    'Zwrot Stripe (' || p_refund_id || ') — kwota ' || p_refund_amount_delta_pln || ' ' || p_currency,
    jsonb_build_object('charge_id', p_charge_id, 'refund_id', p_refund_id, 'reason', p_reason, 'total_refunded_after', v_total_refunded_pln)
  ) ON CONFLICT (stripe_refund_id) WHERE type = 'stripe_refund' DO NOTHING;

END;
$function$;
