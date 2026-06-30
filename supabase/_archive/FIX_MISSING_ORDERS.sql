-- FIX SCRIPT for Missing Orders / RLS
-- Run this if accepted orders don't show up in Company/Student lists.

BEGIN;

-- 1. Ensure OFFERS policies allow Company to UPDATE
DROP POLICY IF EXISTS "Company update own offers" ON public.offers;
CREATE POLICY "Company update own offers"
ON public.offers
FOR UPDATE
TO authenticated
USING (company_id = auth.uid());

-- 2. Ensure APPLICATIONS policies allow Company/Student to VIEW/UPDATE
DROP POLICY IF EXISTS "Participants view applications" ON public.applications;
CREATE POLICY "Participants view applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.offers 
        WHERE offers.id = applications.offer_id 
        AND offers.company_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Company update applications" ON public.applications;
CREATE POLICY "Company update applications"
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

-- 3. DATA REPAIR: Sync Offer status if Application is Accepted
-- If an application is 'accepted', the offer MUST be 'in_progress' (unless closed/finished).
WITH accepted_apps AS (
    SELECT offer_id FROM public.applications WHERE status = 'accepted'
)
UPDATE public.offers
SET status = 'in_progress'
WHERE id IN (SELECT offer_id FROM accepted_apps)
AND status = 'published';

COMMIT;
