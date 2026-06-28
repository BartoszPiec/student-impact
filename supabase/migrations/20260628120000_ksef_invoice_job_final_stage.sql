-- KSeF sandbox invoice jobs are created only after the company accepts the final
-- delivered stage and the contract is completed. The actual KSeF submission can
-- run asynchronously from this job record.

CREATE TABLE IF NOT EXISTS public.ksef_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  company_id uuid NOT NULL,
  invoice_type text NOT NULL DEFAULT 'ORIGINAL'
    CHECK (invoice_type IN ('ORIGINAL')),
  trigger_event text NOT NULL DEFAULT 'FINAL_STAGE_ACCEPTED_BY_COMPANY'
    CHECK (trigger_event IN ('FINAL_STAGE_ACCEPTED_BY_COMPANY')),
  ksef_environment text NOT NULL DEFAULT 'TEST'
    CHECK (ksef_environment IN ('TEST', 'DEMO', 'PRODUCTION')),
  invoice_status text NOT NULL DEFAULT 'INVOICE_JOB_CREATED'
    CHECK (invoice_status IN (
      'INVOICE_JOB_CREATED',
      'DRAFT',
      'READY_TO_SEND',
      'XML_GENERATED',
      'SENDING_TO_KSEF',
      'SENT_TO_KSEF',
      'PROCESSING_IN_KSEF',
      'ACCEPTED_BY_KSEF_TEST',
      'REJECTED_BY_KSEF_TEST',
      'FAILED_TECHNICAL',
      'MANUAL_REVIEW'
    )),
  business_status text NOT NULL DEFAULT 'PREPARING'
    CHECK (business_status IN ('PREPARING', 'SENT', 'PROCESSING', 'ACCEPTED', 'REJECTED', 'NEEDS_REVIEW')),
  invoice_number_internal text,
  ksef_reference_number text,
  ksef_invoice_number text,
  upo_reference text,
  final_amount_gross_minor bigint NOT NULL CHECK (final_amount_gross_minor > 0),
  platform_fee_minor bigint NOT NULL DEFAULT 0 CHECK (platform_fee_minor >= 0),
  student_payout_minor bigint NOT NULL DEFAULT 0 CHECK (student_payout_minor >= 0),
  currency text NOT NULL DEFAULT 'PLN',
  company_name text NOT NULL,
  company_nip text NOT NULL,
  final_amount_locked_at timestamptz NOT NULL DEFAULT now(),
  job_created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  last_error_code text,
  last_error_message text,
  xml_file_path text,
  pdf_file_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ksef_invoices_contract_invoice_type_unique UNIQUE (contract_id, invoice_type)
);

CREATE INDEX IF NOT EXISTS idx_ksef_invoices_contract ON public.ksef_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_ksef_invoices_status ON public.ksef_invoices(invoice_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ksef_invoices_company ON public.ksef_invoices(company_id, created_at DESC);

ALTER TABLE public.ksef_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ksef_invoices_select_participants"
ON public.ksef_invoices
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contracts c
    WHERE c.id = ksef_invoices.contract_id
      AND ((SELECT auth.uid()) = c.company_id OR (SELECT auth.uid()) = c.student_id)
  )
);

CREATE POLICY "ksef_invoices_admin_all"
ON public.ksef_invoices
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.role = 'admin'
  )
);

CREATE TABLE IF NOT EXISTS public.ksef_invoice_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.ksef_invoices(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  request_id text,
  response_status integer,
  response_code text,
  response_body_sanitized jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ksef_invoice_logs_invoice ON public.ksef_invoice_logs(invoice_id, created_at DESC);

ALTER TABLE public.ksef_invoice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ksef_invoice_logs_admin_select"
ON public.ksef_invoice_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.role = 'admin'
  )
);

GRANT SELECT ON public.ksef_invoices TO authenticated;
GRANT SELECT ON public.ksef_invoice_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ksef_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ksef_invoice_logs TO service_role;

CREATE OR REPLACE FUNCTION public.create_ksef_invoice_job_for_completed_contract(
  p_contract_id uuid,
  p_actor_user_id uuid,
  p_trigger_event text DEFAULT 'FINAL_STAGE_ACCEPTED_BY_COMPANY'
)
RETURNS TABLE(invoice_id uuid, invoice_status text, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_contract public.contracts%ROWTYPE;
  v_company record;
  v_existing_id uuid;
  v_existing_status text;
  v_amount_minor bigint;
  v_platform_fee_minor bigint;
  v_student_payout_minor bigint;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak uzytkownika uruchamiajacego finalizacje.';
  END IF;

  IF p_trigger_event <> 'FINAL_STAGE_ACCEPTED_BY_COMPANY' THEN
    RAISE EXCEPTION 'Nieprawidlowy moment uruchomienia fakturowania.';
  END IF;

  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono zlecenia.';
  END IF;

  IF v_contract.company_id IS DISTINCT FROM p_actor_user_id
     AND NOT EXISTS (
       SELECT 1
       FROM public.profiles p
       WHERE p.user_id = p_actor_user_id
         AND p.role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Brak uprawnien do finalizacji tego zlecenia.';
  END IF;

  IF v_contract.status IN ('disputed', 'cancelled') THEN
    RAISE EXCEPTION 'Zlecenie ma aktywny spor albo zostalo anulowane.';
  END IF;

  IF v_contract.status <> 'completed' THEN
    RAISE EXCEPTION 'Zlecenie nie jest jeszcze zakonczone.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.milestones m
    WHERE m.contract_id = p_contract_id
      AND COALESCE(m.status, '') IN ('draft', 'awaiting_funding', 'funded', 'in_progress', 'delivered', 'rejected')
  ) THEN
    RAISE EXCEPTION 'Nie wszystkie etapy zlecenia sa gotowe do finalizacji.';
  END IF;

  SELECT id, ksef_invoices.invoice_status INTO v_existing_id, v_existing_status
  FROM public.ksef_invoices
  WHERE contract_id = p_contract_id
    AND invoice_type = 'ORIGINAL'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    invoice_id := v_existing_id;
    invoice_status := v_existing_status;
    created := false;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT nazwa, nip, address, city, miasto INTO v_company
  FROM public.company_profiles
  WHERE user_id = v_contract.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dane rozliczeniowe firmy sa niekompletne.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(v_company.nazwa, '')), '') IS NULL
     OR NULLIF(BTRIM(COALESCE(v_company.nip, '')), '') IS NULL
     OR NULLIF(BTRIM(COALESCE(v_company.address, '')), '') IS NULL
     OR NULLIF(BTRIM(COALESCE(v_company.city, v_company.miasto, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Dane rozliczeniowe firmy sa niekompletne.';
  END IF;

  SELECT COALESCE(
    NULLIF(v_contract.total_amount_minor, 0),
    SUM(COALESCE(m.amount_minor, ROUND(m.amount * 100)::bigint))
  )
  INTO v_amount_minor
  FROM public.milestones m
  WHERE m.contract_id = p_contract_id
    AND COALESCE(m.status, '') <> 'refunded';

  IF v_amount_minor IS NULL OR v_amount_minor <= 0 THEN
    RAISE EXCEPTION 'Kwota koncowa zlecenia nie jest ustalona.';
  END IF;

  SELECT
    COALESCE(SUM(COALESCE(p.platform_fee_minor, ROUND(p.platform_fee * 100)::bigint)), 0),
    COALESCE(SUM(COALESCE(p.amount_net_minor, ROUND(p.amount_net * 100)::bigint)), 0)
  INTO v_platform_fee_minor, v_student_payout_minor
  FROM public.payouts p
  WHERE p.contract_id = p_contract_id
    AND p.status IN ('pending', 'processing', 'paid');

  IF v_student_payout_minor <= 0 THEN
    RAISE EXCEPTION 'Nie przygotowano wyplaty studenta dla zlecenia.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.payments pay
    WHERE pay.contract_id = p_contract_id
      AND pay.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Brak potwierdzonej platnosci Stripe dla zlecenia.';
  END IF;

  INSERT INTO public.ksef_invoices (
    contract_id,
    application_id,
    service_order_id,
    company_id,
    invoice_type,
    trigger_event,
    ksef_environment,
    invoice_status,
    business_status,
    final_amount_gross_minor,
    platform_fee_minor,
    student_payout_minor,
    currency,
    company_name,
    company_nip,
    created_by
  )
  VALUES (
    p_contract_id,
    v_contract.application_id,
    v_contract.service_order_id,
    v_contract.company_id,
    'ORIGINAL',
    'FINAL_STAGE_ACCEPTED_BY_COMPANY',
    'TEST',
    'INVOICE_JOB_CREATED',
    'PREPARING',
    v_amount_minor,
    v_platform_fee_minor,
    v_student_payout_minor,
    COALESCE(v_contract.currency, 'PLN'),
    BTRIM(v_company.nazwa),
    BTRIM(v_company.nip),
    p_actor_user_id
  )
  ON CONFLICT (contract_id, invoice_type) DO NOTHING
  RETURNING id, ksef_invoices.invoice_status
  INTO invoice_id, invoice_status;

  IF invoice_id IS NULL THEN
    SELECT id, ksef_invoices.invoice_status INTO invoice_id, invoice_status
    FROM public.ksef_invoices
    WHERE contract_id = p_contract_id
      AND invoice_type = 'ORIGINAL'
    LIMIT 1;

    created := false;
  ELSE
    created := true;
  END IF;

  IF invoice_id IS NULL THEN
    RAISE EXCEPTION 'Nie udalo sie utworzyc zadania faktury KSeF.';
  END IF;

  INSERT INTO public.ksef_invoice_logs (
    invoice_id,
    event_type,
    response_body_sanitized
  )
  VALUES (
    invoice_id,
    'INVOICE_JOB_CREATED',
    jsonb_build_object(
      'trigger_event', 'FINAL_STAGE_ACCEPTED_BY_COMPANY',
      'contract_id', p_contract_id,
      'ksef_environment', 'TEST'
    )
  );

  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_ksef_invoice_job_for_completed_contract(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_ksef_invoice_job_for_completed_contract(uuid, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_ksef_invoice_job_for_completed_contract(uuid, uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';
