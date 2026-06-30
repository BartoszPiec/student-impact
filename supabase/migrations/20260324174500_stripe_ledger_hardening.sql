-- Migration: Stripe & Financial Ledger Hardening
-- Created: 2026-03-24
-- Description: Adds atomic RPCs for payment/refund processing and unique constraints for ledger idempotency.

-- 1. Unique Indexes for Financial Ledger Idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_stripe_session_id 
ON public.financial_ledger (stripe_session_id) 
WHERE (type = 'stripe_payment'::text);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_student_payout_id 
ON public.financial_ledger (((metadata ->> 'payout_id'::text))) 
WHERE (type = 'student_payout'::text);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_stripe_refund 
ON public.financial_ledger (stripe_charge_id) 
WHERE (type = 'stripe_refund'::text);

-- 2. Atomic Payment Processing RPC
CREATE OR REPLACE FUNCTION public.process_stripe_payment_v1(
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
  -- 1. Idempotency Check (double-check inside transaction)
  SELECT EXISTS (
    SELECT 1 FROM public.payments WHERE stripe_session_id = p_session_id AND status = 'completed'
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN;
  END IF;

  -- 2. Update Payment Record
  UPDATE public.payments
  SET 
    status = 'completed',
    stripe_payment_intent_id = p_payment_intent_id,
    completed_at = now()
  WHERE stripe_session_id = p_session_id;

  -- 3. Update Milestones
  IF array_length(p_milestone_ids, 1) > 0 THEN
    UPDATE public.milestones
    SET status = 'funded'
    WHERE id = ANY(p_milestone_ids) AND status = 'awaiting_funding';
  ELSE
    -- Fallback: all awaiting_funding milestones for this contract
    UPDATE public.milestones
    SET status = 'funded'
    WHERE contract_id = p_contract_id AND status = 'awaiting_funding';
  END IF;

  -- 4. Update Contract
  UPDATE public.contracts
  SET 
    status = 'active',
    funded_at = now()
  WHERE id = p_contract_id AND status IN ('awaiting_funding', 'draft');

  -- 5. Update Application
  UPDATE public.applications
  SET status = 'in_progress'
  WHERE id = p_application_id AND status = 'accepted';

  -- 6. Insert Ledger Entry: Payment
  INSERT INTO public.financial_ledger (
    type, amount, currency, direction, contract_id, application_id, 
    stripe_payment_intent_id, stripe_session_id, description, metadata
  ) VALUES (
    'stripe_payment', p_amount_pln, 'PLN', 'credit', p_contract_id, p_application_id,
    p_payment_intent_id, p_session_id, 'Wpłata Stripe — kontrakt ' || p_contract_id,
    jsonb_build_object('session_id', p_session_id, 'amount_total_pln', p_amount_pln)
  ) ON CONFLICT DO NOTHING; 

  -- 7. Insert Ledger Entry: Commission
  IF p_fee_pln > 0 THEN
    INSERT INTO public.financial_ledger (
      type, amount, currency, direction, contract_id, application_id, 
      stripe_session_id, description, metadata
    ) VALUES (
      'platform_commission', p_fee_pln, 'PLN', 'credit', p_contract_id, p_application_id,
      p_session_id, 'Prowizja platformy — kontrakt ' || p_contract_id,
      jsonb_build_object(
        'gross_amount', p_amount_pln,
        'fee_rate', CASE WHEN p_amount_pln > 0 THEN ROUND((p_fee_pln / p_amount_pln)::numeric, 4) ELSE NULL END
      )
    );
  END IF;

END;
$function$;

-- 3. Atomic Refund Processing RPC
CREATE OR REPLACE FUNCTION public.process_stripe_refund_v1(
  p_payment_intent_id text, 
  p_charge_id text, 
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
  -- 1. Find the parent payment
  SELECT id, contract_id, stripe_session_id INTO v_payment_record
  FROM public.payments
  WHERE stripe_payment_intent_id = p_payment_intent_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found for intent %', p_payment_intent_id;
  END IF;

  -- 2. Update Payment status to 'refunded'
  UPDATE public.payments
  SET status = 'refunded'
  WHERE id = v_payment_record.id;

  -- 3. Update Contract status to 'cancelled'
  IF v_payment_record.contract_id IS NOT NULL THEN
    UPDATE public.contracts
    SET status = 'cancelled'
    WHERE id = v_payment_record.contract_id;
    
    -- Also cancel active milestones
    UPDATE public.milestones
    SET status = 'cancelled'
    WHERE contract_id = v_payment_record.contract_id AND status IN ('funded', 'in_progress', 'awaiting_funding');
  END IF;

  -- 4. Insert Ledger Entry: Refund
  INSERT INTO public.financial_ledger (
    type, amount, currency, direction, contract_id, 
    stripe_payment_intent_id, stripe_charge_id, stripe_session_id,
    description, metadata
  ) VALUES (
    'stripe_refund', p_refund_amount_pln, p_currency, 'debit', v_payment_record.contract_id,
    p_payment_intent_id, p_charge_id, v_payment_record.stripe_session_id,
    'Zwrot Stripe — kontrakt ' || COALESCE(v_payment_record.contract_id::text, 'nieznany'),
    jsonb_build_object('charge_id', p_charge_id, 'reason', p_reason)
  ) ON CONFLICT DO NOTHING;
END;
$function$;
