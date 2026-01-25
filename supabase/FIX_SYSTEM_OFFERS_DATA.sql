-- FIX_SYSTEM_OFFERS_DATA.sql

BEGIN;

-- 1. Ensure Columns Exist
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS is_platform_service boolean DEFAULT false;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS obligations text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS salary_range_min integer;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS salary_range_max integer;

-- 2. Update existing data to have at least one System Offer
-- Update the most recent Offer to be a System Service
WITH recent_offer AS (
    SELECT id FROM public.offers ORDER BY created_at DESC LIMIT 1
)
UPDATE public.offers
SET 
    is_platform_service = true,
    typ = 'Mikrozlecenie',
    tytul = 'Systemowe: Wdrożenie Analityki (Test)',
    obligations = '1. Konfiguracja GA4.\n2. Podpięcie zdarzeń konwersji.\n3. Raport końcowy.',
    stawka = 500
WHERE id IN (SELECT id FROM recent_offer);

-- 3. Update another one to be Regular Micro-task
WITH second_offer AS (
    SELECT id FROM public.offers ORDER BY created_at DESC LIMIT 1 OFFSET 1
)
UPDATE public.offers
SET 
    is_platform_service = false,
    typ = 'Mikrozlecenie'
WHERE id IN (SELECT id FROM second_offer);

COMMIT;
