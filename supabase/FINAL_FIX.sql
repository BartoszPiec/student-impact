-- FINAL_FIX.sql
-- FORCE VISIBILITY AND UPDATE STATUS
-- RUN THIS IN SUPABASE SQL EDITOR

BEGIN;

-- 1. UNCONDITIONAL VIEW ACCESS TO OFFERS FOR EVERYONE (Authenticated)
-- This fixes "OfferStatus: NULL"
DROP POLICY IF EXISTS "Offers public view" ON public.offers;
DROP POLICY IF EXISTS "Offers view for applicants" ON public.offers;
DROP POLICY IF EXISTS "Offers view authenticated" ON public.offers;

CREATE POLICY "Offers view authenticated"
ON public.offers
FOR SELECT
TO authenticated
USING (true);

-- 2. FORCE UPDATE APPLICATIONS
-- If an offer is NOT 'published' (i.e. 'in_progress'), the application MUST be 'accepted'.
UPDATE public.applications
SET status = 'accepted', decided_at = now()
WHERE status = 'sent'
AND offer_id IN (
    SELECT id FROM public.offers WHERE status != 'published'
);

-- 3. FORCE UPDATE OFFERS
-- If an application is 'accepted', the offer MUST be 'in_progress'.
UPDATE public.offers
SET status = 'in_progress'
WHERE status = 'published'
AND id IN (
    SELECT offer_id FROM public.applications WHERE status = 'accepted'
);

COMMIT;
