-- Add platform_fee_minor to payouts and migrate data
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS platform_fee_minor bigint;
UPDATE public.payouts SET platform_fee_minor = (platform_fee * 100)::bigint WHERE platform_fee_minor IS NULL;
ALTER TABLE public.payouts ALTER COLUMN platform_fee_minor SET NOT NULL;
;
