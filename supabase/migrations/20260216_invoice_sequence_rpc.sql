-- =============================================
-- RPC: nextval_invoice_number
-- Returns next value from invoice_number_seq
-- Used by generate-invoice.ts for atomic numbering
-- =============================================

CREATE OR REPLACE FUNCTION public.nextval_invoice_number()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('invoice_number_seq');
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.nextval_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nextval_invoice_number() TO service_role;
