BEGIN;

DROP POLICY IF EXISTS "contract_documents_insert_authenticated"
  ON public.contract_documents;

DROP POLICY IF EXISTS "invoices_insert_authenticated"
  ON public.invoices;

COMMIT;
