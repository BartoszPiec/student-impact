BEGIN;

-- Only one pending Checkout session should be active for a contract at a time.
-- Completed/expired/refunded rows remain untouched so sequential funding can create later payments.
WITH ranked_pending AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY contract_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS pending_rank
  FROM public.payments
  WHERE contract_id IS NOT NULL
    AND status = 'pending'
)
UPDATE public.payments p
SET status = 'expired'
FROM ranked_pending r
WHERE p.id = r.id
  AND r.pending_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_pending_per_contract
ON public.payments (contract_id)
WHERE contract_id IS NOT NULL
  AND status = 'pending';

COMMENT ON INDEX public.idx_payments_one_pending_per_contract IS
  'Prevents duplicate active pending Stripe Checkout sessions for the same contract.';

COMMIT;
