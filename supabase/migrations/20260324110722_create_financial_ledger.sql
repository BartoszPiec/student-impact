
-- ============================================================
-- FINANCIAL LEDGER — Immutable audit log każdej operacji finansowej
-- ============================================================

CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Typ zdarzenia
  type                      TEXT          NOT NULL,
  -- Dozwolone wartości:
  --   'stripe_payment'     — wpłata studenta przez Stripe
  --   'stripe_refund'      — zwrot przez Stripe (charge.refunded)
  --   'student_payout'     — wypłata dla studenta
  --   'platform_commission'— prowizja platformy
  --   'escrow_hold'        — zablokowanie środków w depozycie
  --   'escrow_release'     — zwolnienie środków z depozytu

  -- Kwota i waluta
  amount                    NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency                  TEXT          NOT NULL DEFAULT 'PLN',

  -- Kierunek z perspektywy platformy
  direction                 TEXT          NOT NULL CHECK (direction IN ('credit','debit')),

  -- Powiązania
  contract_id               UUID          REFERENCES public.contracts(id) ON DELETE SET NULL,
  application_id            UUID,
  service_order_id          UUID,
  user_id                   UUID          REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Stripe identyfikatory
  stripe_payment_intent_id  TEXT,
  stripe_charge_id          TEXT,
  stripe_session_id         TEXT,

  -- Opis i metadane
  description               TEXT,
  metadata                  JSONB         NOT NULL DEFAULT '{}'
);

-- Indeksy
CREATE INDEX financial_ledger_contract_id_idx   ON public.financial_ledger (contract_id);
CREATE INDEX financial_ledger_user_id_idx        ON public.financial_ledger (user_id);
CREATE INDEX financial_ledger_type_idx           ON public.financial_ledger (type);
CREATE INDEX financial_ledger_created_at_idx     ON public.financial_ledger (created_at DESC);
CREATE INDEX financial_ledger_stripe_pi_idx      ON public.financial_ledger (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================
-- RLS — Immutability: brak UPDATE/DELETE dla kogokolwiek
-- ============================================================

ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;

-- Admin widzi wszystko
CREATE POLICY "ledger_select_admin" ON public.financial_ledger
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Użytkownik widzi swoje wpisy
CREATE POLICY "ledger_select_own" ON public.financial_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT tylko przez service_role (webhooks, API routes używają supabaseAdmin)
-- Brak polityki INSERT dla authenticated = blokada
-- UPDATE — brak polityki = zablokowane dla wszystkich
-- DELETE — brak polityki = zablokowane dla wszystkich

-- Komentarz dokumentacyjny
COMMENT ON TABLE public.financial_ledger IS
  'Immutable append-only log wszystkich operacji finansowych platformy. '
  'Brak polityk UPDATE/DELETE — żaden użytkownik ani admin nie może modyfikować wpisów. '
  'INSERT wyłącznie przez service_role (Stripe webhook, payout actions).';

COMMENT ON COLUMN public.financial_ledger.direction IS
  'credit = pieniądze wpłynęły na konto platformy, debit = pieniądze wypłynęły z platformy';
;
