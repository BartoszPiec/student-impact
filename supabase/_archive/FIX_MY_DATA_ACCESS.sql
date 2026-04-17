-- FIX_MY_DATA_ACCESS.sql
-- Run this in the Supabase SQL Editor to manually assign the problematic application to YOURSELF.
-- Replace 'COPY_THE_ID_FROM_URL_HERE' with the ID from the browser URL (e.g. 51d5fc0d...)

BEGIN;

-- 1. Optional: UPDATE the specific application to belong to YOU (as Student)
-- Uncomment and fill the ID if you know it:
-- UPDATE public.applications 
-- SET student_id = auth.uid() 
-- WHERE id = 'COPY_THE_ID_FROM_URL_HERE';

-- 2. ALTERNATIVE: Make ALL applications visible (for debugging only!)
-- DROP POLICY IF EXISTS "Applications view own" ON public.applications;
-- CREATE POLICY "Debug see all" ON public.applications FOR SELECT TO authenticated USING (true);

-- 3. CHECK if the application actually exists
-- Run this query to see what's in the DB:
SELECT id, student_id, offer_id, status FROM public.applications;

COMMIT;
