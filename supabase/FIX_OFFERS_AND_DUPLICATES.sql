-- FIX_OFFERS_AND_DUPLICATES.sql

BEGIN;

-- 1. Fix 'offers' table schema (likely missing columns for "Order Now" to work)
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS is_platform_service boolean DEFAULT false;

ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS service_package_id uuid REFERENCES public.service_packages(id);


-- 2. Cleanup Duplicates in 'service_packages'
-- We keep ONLY the ones that are 'platform_service'.
-- We DELETE any package with these specific titles that is NOT a platform_service (so student_gig or null).
DELETE FROM public.service_packages
WHERE title IN (
    'Montaż Rolek (TikTok, Reels, Shorts)',
    'Montaż Wideo na YouTube',
    'Przygotowanie Logo',
    'Kampania Marketingowa',
    'Automatyzacja Skrzynki Pocztowej'
)
AND (type IS NULL OR type != 'platform_service');


-- 3. Reload Schema Cache (Critical for the new columns to be seen by the app)
NOTIFY pgrst, 'reload schema';

COMMIT;
