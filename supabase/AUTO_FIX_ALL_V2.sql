-- AUTO_FIX_ALL_V2.sql
-- FORCE DATA REPAIR
-- RUN THIS IN SUPABASE SQL EDITOR

BEGIN;

-- 1. FORCE OFFERS TO 'in_progress' if they have an accepted app
UPDATE public.offers
SET status = 'in_progress'
WHERE status = 'published'
AND id IN (
    SELECT offer_id FROM public.applications WHERE status = 'accepted'
);

-- 2. FORCE APPLICATIONS TO 'accepted' if offer is 'in_progress'
-- Covering 'sent', 'countered', and even others just in case.
UPDATE public.applications
SET status = 'accepted', decided_at = now()
WHERE status IN ('sent', 'countered', 'rejected') -- Aggressive fix
AND offer_id IN (
    SELECT id FROM public.offers WHERE status = 'in_progress'
);

COMMIT;

-- 3. VERIFICATION (Runs after commit)
SELECT 
    o.id as offer_id, 
    o.tytul, 
    o.status as offer_status, 
    a.id as app_id, 
    a.status as app_status 
FROM public.offers o
LEFT JOIN public.applications a ON a.offer_id = o.id
WHERE o.status = 'in_progress';
