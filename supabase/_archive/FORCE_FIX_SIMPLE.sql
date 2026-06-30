-- FORCE_FIX_SIMPLE.sql
-- Run this query in the Supabase SQL Editor.
-- Ensure you see "Success" or "No rows returned" (but verify rows affected).

-- 1. UNLOCK OFFERS VISIBILITY (If this fails, Student sees "NULL")
DROP POLICY IF EXISTS "Offers public view" ON public.offers;
DROP POLICY IF EXISTS "Offers view for applicants" ON public.offers;
DROP POLICY IF EXISTS "Offers view authenticated" ON public.offers;

CREATE POLICY "Offers view authenticated" ON public.offers FOR SELECT TO authenticated USING (true);

-- 2. FIX APPLICATION STATUS (Changes "sent" -> "accepted")
UPDATE public.applications
SET status = 'accepted', decided_at = now()
WHERE status = 'sent' AND offer_id IN (SELECT id FROM public.offers WHERE status = 'in_progress');

-- 3. CHECK RESULTS
SELECT id, status, offer_id FROM public.applications;
