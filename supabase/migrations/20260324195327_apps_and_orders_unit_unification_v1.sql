-- Supplemental Phase 10: Apps and Orders minor columns
-- 1. Applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS agreed_stawka_minor bigint;
UPDATE public.applications SET agreed_stawka_minor = (agreed_stawka * 100)::bigint WHERE agreed_stawka_minor IS NULL AND agreed_stawka IS NOT NULL;

-- 2. Service Orders
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS agreed_amount_minor bigint;
UPDATE public.service_orders SET agreed_amount_minor = (agreed_amount * 100)::bigint WHERE agreed_amount_minor IS NULL AND agreed_amount IS NOT NULL;
;
