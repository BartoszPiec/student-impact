-- Fix for OBS-08: Plain UNIQUE constraint instead of partial index
ALTER TABLE public.financial_ledger
ADD CONSTRAINT financial_ledger_stripe_refund_id_unique UNIQUE (stripe_refund_id);
;
