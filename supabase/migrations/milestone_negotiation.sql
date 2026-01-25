-- CONTRACTS: negotiation layer
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS terms_version int NOT NULL DEFAULT 1;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS terms_status text NOT NULL DEFAULT 'draft'
  CHECK (terms_status IN ('draft','proposed','agreed'));

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS proposed_by uuid NULL REFERENCES auth.users(id);

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS proposed_at timestamptz NULL;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS company_approved_version int NULL;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS student_approved_version int NULL;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS review_window_days int NOT NULL DEFAULT 8;

-- MILESTONES: tie to terms version
ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS terms_version int NOT NULL DEFAULT 1;

ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS created_by uuid NULL REFERENCES auth.users(id);

ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS updated_by uuid NULL REFERENCES auth.users(id);

-- Terms snapshot table
CREATE TABLE IF NOT EXISTS public.contract_term_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  version int NOT NULL,
  terms_json jsonb NOT NULL,
  sha256 text NOT NULL,
  status text NOT NULL CHECK (status IN ('proposed','agreed','superseded')) DEFAULT 'proposed',
  proposed_by uuid NULL REFERENCES auth.users(id),
  company_accepted_at timestamptz NULL,
  student_accepted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contract_id, version)
);

ALTER TABLE public.contract_term_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ctv_select_participants" ON public.contract_term_versions;
CREATE POLICY "ctv_select_participants"
ON public.contract_term_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_term_versions.contract_id
      AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);
