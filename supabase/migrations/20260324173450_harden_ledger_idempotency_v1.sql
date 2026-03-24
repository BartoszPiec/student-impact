-- Security Hardening: Financial Ledger Idempotency Constraints
-- Reconstructed from database state to resolve repository drift

DROP INDEX IF EXISTS idx_ledger_stripe_session_id;
CREATE UNIQUE INDEX idx_ledger_stripe_session_id ON public.financial_ledger USING btree (stripe_session_id) WHERE (type = 'stripe_payment'::text);

DROP INDEX IF EXISTS idx_ledger_commission_session_id;
CREATE UNIQUE INDEX idx_ledger_commission_session_id ON public.financial_ledger USING btree (stripe_session_id) WHERE (type = 'platform_commission'::text);

DROP INDEX IF EXISTS idx_ledger_student_payout_id;
CREATE UNIQUE INDEX idx_ledger_student_payout_id ON public.financial_ledger USING btree (((metadata ->> 'payout_id'::text))) WHERE (type = 'student_payout'::text);
