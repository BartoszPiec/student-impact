
ALTER TABLE public.invoices
  ALTER COLUMN issuer_name SET DEFAULT 'Student2Work sp. z o.o.';

COMMENT ON COLUMN public.invoices.issuer_name IS 'Zaktualizowac po rejestracji spolki - domyslna nazwa wystawcy';
COMMENT ON COLUMN public.invoices.issuer_nip IS 'Uzupelnic po rejestracji i otrzymaniu NIP';
;
