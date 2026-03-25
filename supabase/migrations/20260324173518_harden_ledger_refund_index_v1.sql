-- Security Hardening: Refund Index for Idempotency
-- Reconstructed from database state to resolve repository drift

DROP INDEX IF EXISTS idx_ledger_stripe_refund_id;
CREATE INDEX idx_ledger_stripe_refund_id ON public.financial_ledger USING btree (stripe_refund_id);

DROP INDEX IF EXISTS idx_ledger_stripe_refund_v3;
CREATE UNIQUE INDEX idx_ledger_stripe_refund_v3 ON public.financial_ledger USING btree (stripe_refund_id) WHERE (type = 'stripe_refund'::text);
