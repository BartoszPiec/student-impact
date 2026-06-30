-- 20260417110000_invoice_sequence_safe.sql
-- Legacy hardening: replace sequence-based nextval_invoice_number() with rollback-safe counter logic.

CREATE TABLE IF NOT EXISTS public.invoice_counters (
  year integer PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.nextval_invoice_number()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM now())::integer;
  v_next integer;
BEGIN
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

  RETURN v_next;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nextval_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nextval_invoice_number() TO service_role;
