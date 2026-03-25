-- Migration: Advanced Stripe & Ledger Hardening (v2)
-- Created: 2026-03-24
-- Description: Advanced idempotency for commissions, fallback for missing payments, and partial refund support.

-- 1. Additional Unique Indexes for granular idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_commission_session_id 
ON public.financial_ledger (stripe_session_id) 
WHERE (type = 'platform_commission'::text);

-- Change refund index to use charge_id + amount/metadata to allow multiple partials
DROP INDEX IF EXISTS idx_ledger_stripe_refund;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_stripe_refund_v2
ON public.financial_ledger (stripe_charge_id, amount) 
WHERE (type = 'stripe_refund'::text);

-- 2. Advanced Payment Processing (v2)
CREATE OR REPLACE FUNCTION public.process_stripe_payment_v2(
  p_session_id text, 
  p_payment_intent_id text, 
  p_contract_id uuid, 
  p_application_id uuid, 
  p_amount_pln numeric, 
  p_fee_pln numeric, 
  p_milestone_ids uuid[], 
  p_user_id uuid
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_already_processed BOOLEAN;
BEGIN
  -- 1. Fallback & Idempotency: UPSERT the payment record
  -- Handling case where create-checkout failed to save the pending record
  INSERT INTO public.payments (
    contract_id, stripe_session_id, stripe_payment_intent_id, amount_total, platform_fee, status, completed_at
  ) VALUES (
    p_contract_id, p_session_id, p_payment_intent_id, (p_amount_pln * 100)::int, (p_fee_pln * 100)::int, 'completed', now()
  )
  ON CONFLICT (stripe_session_id) DO UPDATE SET
    status = 'completed',
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    completed_at = now()
  WHERE public.payments.status != 'completed'
  RETURNING (status = 'completed') INTO v_already_processed;

  -- If it was already completed (WHERE clause failed), we might still want to proceed with ledger if missing,
  -- but usually we just return.
  -- To be safe with Ledger, we check ledger existence too.

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
  SET status = 'active', funded_at = now()
  WHERE id = p_contract_id AND status IN ('awaiting_funding', 'draft');

  UPDATE public.applications
  SET status = 'in_progress'
  WHERE id = p_application_id AND status = 'accepted';

  -- 3. Insert Ledger Entries with conflict handling
  -- Stripe Payment
  INSERT INTO public.financial_ledger (
    type, amount, currency, direction, contract_id, application_id, 
    stripe_payment_intent_id, stripe_session_id, description, metadata
  ) VALUES (
    'stripe_payment', p_amount_pln, 'PLN', 'credit', p_contract_id, p_application_id,
    p_payment_intent_id, p_session_id, 'Wpłata Stripe — kontrakt ' || p_contract_id,
    jsonb_build_object('session_id', p_session_id, 'amount_total_pln', p_amount_pln)
  ) ON CONFLICT (stripe_session_id) WHERE type = 'stripe_payment' DO NOTHING;

  -- Platform Commission (Fixed: Unique session_id + type)
  IF p_fee_pln > 0 THEN
    INSERT INTO public.financial_ledger (
      type, amount, currency, direction, contract_id, application_id, 
      stripe_session_id, description, metadata
    ) VALUES (
      'platform_commission', p_fee_pln, 'PLN', 'credit', p_contract_id, p_application_id,
      p_session_id, 'Prowizja platformy — kontrakt ' || p_contract_id,
      jsonb_build_object('gross_amount', p_amount_pln, 'fee_rate', 0.05)
    ) ON CONFLICT (stripe_session_id) WHERE type = 'platform_commission' DO NOTHING;
  END IF;

END;
$function$;

-- 3. Advanced Refund Processing (v2)
CREATE OR REPLACE FUNCTION public.process_stripe_refund_v2(
  p_payment_intent_id text, 
  p_charge_id text, 
  p_refund_id text, -- Added for granular trace
  p_refund_amount_pln numeric, 
  p_currency text, 
  p_reason text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_payment_record RECORD;
BEGIN
  -- 1. Get Payment Info
  SELECT id, contract_id, stripe_session_id, amount_total INTO v_payment_record
  FROM public.payments
  WHERE stripe_payment_intent_id = p_payment_intent_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found for intent %', p_payment_intent_id;
  END IF;

  -- 2. Check if Full or Partial Refund
  -- v_payment_record.amount_total is in grosze, p_refund_amount_pln is in PLN
  IF p_refund_amount_pln >= (v_payment_record.amount_total::numeric / 100.0) THEN
    -- FULL REFUND: Cancel everything
    UPDATE public.payments SET status = 'refunded', refunded_at = now() WHERE id = v_payment_record.id;
    
    IF v_payment_record.contract_id IS NOT NULL THEN
      UPDATE public.contracts SET status = 'cancelled' WHERE id = v_payment_record.contract_id;
      UPDATE public.milestones SET status = 'cancelled' 
      WHERE contract_id = v_payment_record.contract_id AND status IN ('funded', 'in_progress', 'awaiting_funding');
    END IF;
  ELSE
    -- PARTIAL REFUND: Keep contract active
    UPDATE public.payments SET status = 'partially_refunded', refunded_at = now() WHERE id = v_payment_record.id;
  END IF;

  -- 3. Insert Ledger Entry
  INSERT INTO public.financial_ledger (
    type, amount, currency, direction, contract_id, 
    stripe_payment_intent_id, stripe_charge_id, stripe_session_id,
    description, metadata
  ) VALUES (
    'stripe_refund', p_refund_amount_pln, p_currency, 'debit', v_payment_record.contract_id,
    p_payment_intent_id, p_charge_id, v_payment_record.stripe_session_id,
    'Zwrot Stripe (' || p_refund_id || ') — kontrakt ' || COALESCE(v_payment_record.contract_id::text, 'nieznany'),
    jsonb_build_object('charge_id', p_charge_id, 'refund_id', p_refund_id, 'reason', p_reason)
  ) ON CONFLICT (stripe_charge_id, amount) WHERE type = 'stripe_refund' DO NOTHING;

END;
$function$;
