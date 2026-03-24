-- Migration: Bank-Grade Double-Entry Accounting Layer
-- Created: 2026-03-24
-- Description: Establishes a canonical accounting system for auditable financial tracking.

-- 1. Chart of Accounts
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- e.g. '1000', '2000'
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- 2. Accounting Journals
CREATE TABLE IF NOT EXISTS public.accounting_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL, -- e.g. 'Stripe Payments', 'Student Payouts', 'General Journal'
  description text,
  created_at timestamptz DEFAULT now()
);

-- 3. Accounting Entries (Transactional Headers)
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid REFERENCES public.accounting_journals(id),
  reference_type text NOT NULL, -- 'payment', 'payout', 'refund', 'manual'
  reference_id uuid, -- Link to operational table record (contract_id, payout_id, etc)
  description text,
  idempotency_key text UNIQUE, -- Prevent duplicate postings
  created_at timestamptz DEFAULT now(),
  posted_at timestamptz DEFAULT now()
);

-- 4. Accounting Ledger Items (Debits & Credits)
CREATE TABLE IF NOT EXISTS public.accounting_ledger_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES public.accounting_entries(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounting_accounts(id),
  amount_minor bigint NOT NULL, -- Amount in grosze
  direction text NOT NULL CHECK (direction IN ('debit', 'credit')),
  created_at timestamptz DEFAULT now()
);

-- 5. Seed Initial Accounts
INSERT INTO public.accounting_accounts (code, name, type, description) VALUES
  ('1010', 'Cash Stripe Clearing', 'asset', 'Pieniądze w drodze ze Stripe do banku'),
  ('1020', 'Cash Bank Main', 'asset', 'Główne konto bankowe platformy'),
  ('2010', 'Escrow Liability', 'liability', 'Środki wpłacone przez firmy, czekające na wypłatę dla studentów'),
  ('2020', 'Student Payable', 'liability', 'Zobowiązania wobec studentów za zaakceptowane etapy'),
  ('2030', 'Tax Withholding Payable', 'liability', 'Zobowiązania podatkowe (PIT) do odprowadzenia'),
  ('4010', 'Platform Commission Revenue', 'revenue', 'Przychody z prowizji platformy'),
  ('5010', 'Refunds & Chargebacks', 'expense', 'Koszty zwrotów i sporów')
ON CONFLICT (code) DO NOTHING;

-- 6. Seed Initial Journals
INSERT INTO public.accounting_journals (name, description) VALUES
  ('Stripe Operations', 'Wszystkie operacje związane z płatnościami i zwrotami Stripe'),
  ('Payout Operations', 'Wypłaty dla studentów i rozliczenia podatkowe'),
  ('General Adjustments', 'Korekty ręczne i inne operacje')
ON CONFLICT (name) DO NOTHING;

-- 7. Helper RPC: record_accounting_entry
-- Allows recording a balanced double-entry inside a transaction.
CREATE OR REPLACE FUNCTION public.record_accounting_entry(
  p_journal_name text,
  p_reference_type text,
  p_reference_id uuid,
  p_description text,
  p_idempotency_key text,
  p_debit_account_code text,
  p_credit_account_code text,
  p_amount_minor bigint
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_journal_id uuid;
  v_debit_account_id uuid;
  v_credit_account_id uuid;
  v_entry_id uuid;
BEGIN
  -- 1. Get IDs
  SELECT id INTO v_journal_id FROM public.accounting_journals WHERE name = p_journal_name;
  SELECT id INTO v_debit_account_id FROM public.accounting_accounts WHERE code = p_debit_account_code;
  SELECT id INTO v_credit_account_id FROM public.accounting_accounts WHERE code = p_credit_account_code;

  IF v_journal_id IS NULL OR v_debit_account_id IS NULL OR v_credit_account_id IS NULL THEN
    RAISE EXCEPTION 'Invalid journal or account codes';
  END IF;

  -- 2. Create Entry Header (Idempotent)
  INSERT INTO public.accounting_entries (
    journal_id, reference_type, reference_id, description, idempotency_key
  ) VALUES (
    v_journal_id, p_reference_type, p_reference_id, p_description, p_idempotency_key
  ) 
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_entry_id;

  -- If entry_id is null, it means it already exists. We return the existing one.
  IF v_entry_id IS NULL THEN
    SELECT id INTO v_entry_id FROM public.accounting_entries WHERE idempotency_key = p_idempotency_key;
    RETURN v_entry_id;
  END IF;

  -- 3. Create Balanced Ledger Items
  -- Debit
  INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
  VALUES (v_entry_id, v_debit_account_id, p_amount_minor, 'debit');

  -- Credit
  INSERT INTO public.accounting_ledger_items (entry_id, account_id, amount_minor, direction)
  VALUES (v_entry_id, v_credit_account_id, p_amount_minor, 'credit');

  RETURN v_entry_id;
END;
$function$;
