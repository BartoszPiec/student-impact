-- Migration: Stripe Payment Hardening v4 (Accounting & Service Orders)
-- Created: 2026-03-24
-- Description: v4 RPC with double-entry accounting and Service Order support.

CREATE OR REPLACE FUNCTION public.process_stripe_payment_v4(
  p_session_id text, 
  p_payment_intent_id text, 
  p_contract_id uuid, 
  p_application_id uuid, 
  p_service_order_id uuid, -- Added Service Order support
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
  v_amount_minor bigint;
  v_fee_minor bigint;
BEGIN
  v_amount_minor := (p_amount_pln * 100)::bigint;
  v_fee_minor := (p_fee_pln * 100)::bigint;

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
  SET status = 'active', funded_at = now()
  WHERE id = p_contract_id AND status IN ('awaiting_funding', 'draft');

  -- Update Application or Service Order status
  IF p_application_id IS NOT NULL THEN
    UPDATE public.applications SET status = 'in_progress' WHERE id = p_application_id AND status = 'accepted';
  END IF;

  IF p_service_order_id IS NOT NULL THEN
    UPDATE public.service_orders SET status = 'accepted' WHERE id = p_service_order_id AND status IN ('pending', 'proposal_sent');
  END IF;

  -- 3. Legacy Ledger Layer (for backward compatibility)
  INSERT INTO public.financial_ledger (
    type, amount, currency, direction, contract_id, application_id, service_order_id,
    stripe_payment_intent_id, stripe_session_id, description
  ) VALUES (
    'stripe_payment', p_amount_pln, 'PLN', 'credit', p_contract_id, p_application_id, p_service_order_id,
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
