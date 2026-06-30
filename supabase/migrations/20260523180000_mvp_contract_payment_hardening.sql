BEGIN;

-- Contract acceptance audit fields. They are nullable to keep historical data valid.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS company_contract_accepted_ip text,
  ADD COLUMN IF NOT EXISTS student_contract_accepted_ip text;

ALTER TABLE public.contract_documents
  ADD COLUMN IF NOT EXISTS company_accepted_ip text,
  ADD COLUMN IF NOT EXISTS student_accepted_ip text;

-- Stripe Connect readiness for student payouts.
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed_at timestamptz;

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS stripe_transfer_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_transfer_error text;

CREATE UNIQUE INDEX IF NOT EXISTS payouts_stripe_transfer_id_uq
  ON public.payouts (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;

COMMIT;
