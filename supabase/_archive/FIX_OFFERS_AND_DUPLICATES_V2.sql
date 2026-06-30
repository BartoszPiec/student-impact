-- FIX_OFFERS_AND_DUPLICATES_V2.sql

BEGIN;

-- 1. Fix 'offers' table schema (likely missing columns for "Order Now" to work)
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS is_platform_service boolean DEFAULT false;

ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS service_package_id uuid REFERENCES public.service_packages(id);


-- 2. Cleanup Duplicates
-- First, identify the IDs we want to delete to effectively remove them from child tables
-- We want to delete packages with those titles that are NOT 'platform_service'

CREATE TEMP TABLE packages_to_delete AS
SELECT id FROM public.service_packages
WHERE title IN (
    'Montaż Rolek (TikTok, Reels, Shorts)',
    'Montaż Wideo na YouTube',
    'Przygotowanie Logo',
    'Kampania Marketingowa',
    'Automatyzacja Skrzynki Pocztowej'
)
AND (type IS NULL OR type != 'platform_service');

-- Delete references in 'service_orders' (The error you saw came from here)
DELETE FROM public.service_orders
WHERE package_id IN (SELECT id FROM packages_to_delete);

-- Delete references in 'offers' if any (just in case they were linked)
-- Although typically offers reference the *correct* package, but let's be safe if any legacy offers point to bad ones
DELETE FROM public.offers
WHERE service_package_id IN (SELECT id FROM packages_to_delete);

-- Finally, delete the service packages themselves
DELETE FROM public.service_packages
WHERE id IN (SELECT id FROM packages_to_delete);

DROP TABLE packages_to_delete;


-- 3. Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;
