-- AUTO_FIX_ALL.sql
-- COMPREHENSIVE FIX FOR VISIBILITY AND DATA CONSISTENCY
-- RUN THIS NOW.

BEGIN;

--------------------------------------------------------------------------------
-- 1. FORCE OFFERS VISIBILITY
--------------------------------------------------------------------------------
-- Allow authenticated users to view ALL offers to rule out "Published" filter issues.
DROP POLICY IF EXISTS "Offers public view" ON public.offers;
DROP POLICY IF EXISTS "Offers view for applicants" ON public.offers;
DROP POLICY IF EXISTS "Offers view authenticated" ON public.offers;

CREATE POLICY "Offers view authenticated"
ON public.offers
FOR SELECT
TO authenticated
USING (true);

--------------------------------------------------------------------------------
-- 2. ENABLE COMPANY UPDATES ON APPLICATIONS
--------------------------------------------------------------------------------
-- Allow companies to update applications (Accept/Reject)
DROP POLICY IF EXISTS "Companies update applications" ON public.applications;

CREATE POLICY "Companies update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.offers
        WHERE offers.id = applications.offer_id
        AND offers.company_id = auth.uid()
    )
);

--------------------------------------------------------------------------------
-- 3. DATA REPAIR: SYNC OFFER <-> APPLICATION STATUS
--------------------------------------------------------------------------------
-- PROBLEM: Offer is 'in_progress' but Application is still 'sent'.
-- FIX: Force Application to 'accepted' if Offer is 'in_progress'.

UPDATE public.applications
SET status = 'accepted', decided_at = now()
WHERE status = 'sent'
AND offer_id IN (
    SELECT id FROM public.offers WHERE status = 'in_progress'
);

-- PROBLEM: Application is 'accepted' but Offer is still 'published'.
-- FIX: Force Offer to 'in_progress'.

UPDATE public.offers
SET status = 'in_progress'
WHERE status = 'published'
AND id IN (
    SELECT offer_id FROM public.applications WHERE status = 'accepted'
);

COMMIT;
