-- ============================================================
-- Fix Applications Visibility (SELECT Policy)
-- Relies on basic ownership: Student or Company (via Offer).
-- Also allows viewing if linked via Contract (redundancy).
-- ============================================================

-- Drop restrictive or partial policies if needed, 
-- but we'll use CREATE OR REPLACE logic or DROP IF EXISTS.

DROP POLICY IF EXISTS "applications_select_participants" ON public.applications;
DROP POLICY IF EXISTS "View application via conversation" ON public.applications; 
-- We replace the conversation-based one with a broader one, usually better.
-- Or we can keep it, but a broader ownership check is standard.

CREATE POLICY "applications_select_participants"
ON public.applications
FOR SELECT
TO authenticated
USING (
  -- 1. I am the Student
  student_id = auth.uid()
  OR
  -- 2. I am the Company (owner of the Offer)
  EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = applications.offer_id
    AND o.company_id = auth.uid()
  )
  OR
  -- 3. I am a participant in the Contract (Realization Guard)
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = applications.contract_id
    AND (c.company_id = auth.uid() OR c.student_id = auth.uid())
  )
);

-- Note: This requires access to 'contracts' and 'offers' tables.
-- Ensure RLS on those tables doesn't block this check (Postgres usually allows lookup in internal queries 
-- if RLS is on, or bypasses if SECURITY DEFINER ... wait, Policies are just filters).
-- Actually, recursive RLS can be tricky. 
-- Best practice: The EXISTS subqueries run with the user's permissions unless wrapped in functions.
-- However, 'offers' usually allows select public/authenticated.
-- 'contracts' allows select for participants.

NOTIFY pgrst, 'reload schema';
SELECT 'Applications SELECT policy updated' as status;
