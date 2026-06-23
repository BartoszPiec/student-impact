-- 20260216_contract_documents_and_invoices.sql
-- New tables for contract PDF documents and invoices

-- ============================================================
-- 1. contract_documents — tracks generated PDF contracts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'contract_a',       -- Firma ↔ Platforma (Umowa o Świadczenie Usługi)
    'contract_b',       -- Student ↔ Platforma (Umowa o Dzieło)
    'invoice_company',  -- Faktura dla firmy
    'invoice_student'   -- Rachunek dla studenta
  )),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  -- Digital acceptance
  company_accepted_at timestamptz,
  student_accepted_at timestamptz,
  -- Metadata
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_documents_contract ON public.contract_documents(contract_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_documents_type_version
  ON public.contract_documents(contract_id, document_type, version);

ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_documents_select_participants"
ON public.contract_documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_documents.contract_id
    AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);

CREATE POLICY "contract_documents_insert_authenticated"
ON public.contract_documents FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "contract_documents_update_participants"
ON public.contract_documents FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_documents.contract_id
    AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);

-- ============================================================
-- 2. Add acceptance columns to contracts table
-- ============================================================
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS documents_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS company_contract_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_contract_accepted_at timestamptz;

-- ============================================================
-- 3. invoices table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  invoice_type text NOT NULL CHECK (invoice_type IN ('company', 'student')),
  amount_net numeric NOT NULL,
  amount_gross numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  issuer_name text NOT NULL DEFAULT 'Student Impact sp. z o.o.',
  issuer_nip text,
  recipient_name text NOT NULL,
  recipient_nip text,
  status text NOT NULL CHECK (status IN ('draft','issued','paid','cancelled')) DEFAULT 'issued',
  issued_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  storage_path text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_contract ON public.invoices(contract_id);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_participants"
ON public.invoices FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = invoices.contract_id
    AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);

CREATE POLICY "invoices_insert_authenticated"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================
-- 4. Invoice number sequence
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
