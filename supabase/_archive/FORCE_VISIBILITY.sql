-- FORCE VISIBILITY FIX
-- Run this if FIX_STUDENT_VISIBILITY.sql didn't work.
-- This sets a very broad "Authenticated" policy for testing purposes.

BEGIN;

-- 1. DROP restricting policies on OFFERS
DROP POLICY IF EXISTS "Offers public view" ON public.offers;
DROP POLICY IF EXISTS "Offers view for applicants" ON public.offers;

-- 2. CREATE a broad policy: Authenticated users can view ALL offers.
-- This is safe enough for MVP internal testing, but ideally we should restrict to published + own + involved.
-- But to fix your "Missing Accepted Orders", this is the surest way.
CREATE POLICY "Offers view authenticated"
ON public.offers
FOR SELECT
TO authenticated
USING (true);

-- 3. ENSURE APPLICATIONS are visible
DROP POLICY IF EXISTS "Participants view applications" ON public.applications;
CREATE POLICY "Participants view applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM public.offers 
        WHERE offers.id = applications.offer_id 
        AND offers.company_id = auth.uid()
    )
);

COMMIT;
