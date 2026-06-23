-- Fix for OBS-08: Missing unique constraint for stripe_refund_id in legacy ledger
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_ledger_stripe_refund_unique
ON public.financial_ledger (stripe_refund_id)
WHERE stripe_refund_id IS NOT NULL;
;
