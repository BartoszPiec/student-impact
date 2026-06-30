-- 20260416144000_invoice_counters_and_issue_rpc_v1.sql
-- Replaces sequence-only numbering with transactional yearly counter + insert.

CREATE TABLE IF NOT EXISTS public.invoice_counters (
  year integer PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill counters from existing invoices (formats: FV/YYYY/NNNNN or RCH/YYYY/NNNNN)
INSERT INTO public.invoice_counters (year, last_number)
SELECT
  split_part(invoice_number, '/', 2)::integer AS year,
  MAX(split_part(invoice_number, '/', 3)::integer) AS last_number
FROM public.invoices
WHERE invoice_number ~ '^[A-Z]+/[0-9]{4}/[0-9]+$'
GROUP BY 1
ON CONFLICT (year) DO UPDATE
SET
  last_number = GREATEST(public.invoice_counters.last_number, EXCLUDED.last_number),
  updated_at = now();

CREATE OR REPLACE FUNCTION public.issue_invoice_with_counter(
  p_contract_id uuid,
  p_milestone_id uuid,
  p_invoice_type text,
  p_amount_net numeric,
  p_amount_gross numeric,
  p_platform_fee numeric,
  p_issuer_name text,
  p_issuer_nip text,
  p_recipient_name text,
  p_recipient_nip text,
  p_storage_path text,
  p_file_name text,
  p_number_prefix text DEFAULT 'FV',
  p_initial_status text DEFAULT 'draft'
)
RETURNS TABLE(id uuid, invoice_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_year integer := EXTRACT(YEAR FROM now())::integer;
  v_next integer;
  v_invoice_number text;
BEGIN
  IF p_invoice_type NOT IN ('company', 'student') THEN
    RAISE EXCEPTION 'Nieprawidlowy invoice_type: %', p_invoice_type;
  END IF;

  IF p_initial_status NOT IN ('draft', 'issued') THEN
    RAISE EXCEPTION 'Nieprawidlowy status poczatkowy: %', p_initial_status;
  END IF;

  INSERT INTO public.invoice_counters (year, last_number)
  VALUES (v_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE public.invoice_counters
  SET
    last_number = last_number + 1,
    updated_at = now()
  WHERE year = v_year
  RETURNING last_number INTO v_next;

  IF v_next IS NULL THEN
    RAISE EXCEPTION 'Nie mozna pobrac kolejnego numeru faktury dla roku %', v_year;
  END IF;

  v_invoice_number := p_number_prefix || '/' || v_year || '/' || LPAD(v_next::text, 5, '0');

  INSERT INTO public.invoices (
    contract_id,
    milestone_id,
    invoice_number,
    invoice_type,
    amount_net,
    amount_gross,
    platform_fee,
    issuer_name,
    issuer_nip,
    recipient_name,
    recipient_nip,
    storage_path,
    file_name,
    status,
    issued_at
  ) VALUES (
    p_contract_id,
    p_milestone_id,
    v_invoice_number,
    p_invoice_type,
    p_amount_net,
    p_amount_gross,
    p_platform_fee,
    p_issuer_name,
    p_issuer_nip,
    p_recipient_name,
    p_recipient_nip,
    p_storage_path,
    p_file_name,
    p_initial_status,
    CASE WHEN p_initial_status = 'issued' THEN now() ELSE NULL END
  )
  RETURNING invoices.id, invoices.invoice_number
  INTO id, invoice_number;

  RETURN NEXT;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.issue_invoice_with_counter(
  uuid, uuid, text, numeric, numeric, numeric, text, text, text, text, text, text, text, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.issue_invoice_with_counter(
  uuid, uuid, text, numeric, numeric, numeric, text, text, text, text, text, text, text, text
) TO service_role;
