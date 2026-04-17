-- FIX STUDENT VISIBILITY OF IN-PROGRESS OFFERS
-- Problem: Students cannot see offers that are 'in_progress' because the generic public policy only allows 'published'.
-- Solution: Add a policy allowing users to see offers they have applied to.

BEGIN;

DROP POLICY IF EXISTS "Offers view for applicants" ON public.offers;

CREATE POLICY "Offers view for applicants"
ON public.offers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.applications 
        WHERE applications.offer_id = offers.id 
        AND applications.student_id = auth.uid()
    )
);

COMMIT;
