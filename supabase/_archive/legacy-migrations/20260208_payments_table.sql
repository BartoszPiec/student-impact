-- ========================================
-- MIGRACJA: Tabela payments dla Stripe
-- Data: 2026-02-08
-- Cel: Śledzenie płatności Stripe dla escrow
-- ========================================

BEGIN;

-- Utwórz tabelę payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  amount_total integer NOT NULL, -- in grosze (PLN * 100)
  platform_fee integer NOT NULL DEFAULT 0, -- in grosze
  currency text NOT NULL DEFAULT 'pln',
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed, expired, refunded
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON public.payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Polityki RLS
-- Firmy mogą widzieć swoje płatności (przez contract)
CREATE POLICY "Companies can view their payments" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = payments.contract_id
      AND c.company_id = auth.uid()
    )
  );

-- Studenci mogą widzieć płatności za swoje kontrakty
CREATE POLICY "Students can view payments for their contracts" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = payments.contract_id
      AND c.student_id = auth.uid()
    )
  );

-- Service role może wszystko (dla webhooków)
CREATE POLICY "Service role full access" ON public.payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Dodaj kolumnę funded_at do contracts jeśli nie istnieje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'contracts'
    AND column_name = 'funded_at'
  ) THEN
    ALTER TABLE public.contracts ADD COLUMN funded_at timestamptz;
  END IF;
END $$;

-- Komentarze
COMMENT ON TABLE public.payments IS 'Stripe payment records for escrow funding';
COMMENT ON COLUMN public.payments.amount_total IS 'Total amount in grosze (PLN * 100)';
COMMENT ON COLUMN public.payments.platform_fee IS 'Platform fee in grosze';
COMMENT ON COLUMN public.payments.status IS 'Payment status: pending, completed, failed, expired, refunded';

COMMIT;
