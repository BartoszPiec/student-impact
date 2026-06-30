BEGIN;

REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, jsonb) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.process_stripe_payment_v4(
  text, text, uuid, uuid, uuid, numeric, numeric, uuid[], uuid, bigint, bigint
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.process_stripe_refund_v4(
  text, text, text, numeric, text, text, bigint
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.process_payout_paid_v1(
  uuid, uuid, bigint
) FROM PUBLIC;

DROP POLICY IF EXISTS "contract_documents_insert"
  ON public.contract_documents;

DROP POLICY IF EXISTS "contract_documents_insert_authenticated"
  ON public.contract_documents;

DROP POLICY IF EXISTS "admin_insert_invoices"
  ON public.invoices;

DROP POLICY IF EXISTS "invoices_insert_authenticated"
  ON public.invoices;

COMMIT;
