-- Phase 10: Unit Unification (bigint grosze convergence)
-- This migration adds _minor columns to support bigint (amount_minor) for all financial tables.

-- 1. Financial Ledger
ALTER TABLE public.financial_ledger ADD COLUMN IF NOT EXISTS amount_minor bigint;
UPDATE public.financial_ledger SET amount_minor = (amount * 100)::bigint WHERE amount_minor IS NULL;

-- 2. Payouts
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS amount_gross_minor bigint;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS amount_net_minor bigint;
UPDATE public.payouts SET
    amount_gross_minor = (amount_gross * 100)::bigint,
    amount_net_minor = (amount_net * 100)::bigint
WHERE amount_gross_minor IS NULL;

-- 3. Contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS total_amount_minor bigint;
-- Note: total_amount is numeric, we migrate it
UPDATE public.contracts SET total_amount_minor = (total_amount * 100)::bigint WHERE total_amount_minor IS NULL;

-- 4. Constraints (Optional but recommended)
-- We keep old columns for now as "deprecated" but ensure new ones are used.
ALTER TABLE public.financial_ledger ALTER COLUMN amount_minor SET NOT NULL;
;
