-- FIX RLS AND DATA
-- 1. Grant Companies permission to UPDATE applications (Accept/Reject/Counter)
--    The policy allows updating if the application is for an offer owned by the company.

BEGIN;

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

-- 2. DATA REPAIR
-- Find applications that are "sent" but their offer is "in_progress", and force them to "accepted".
-- This assumes that if an offer is in_progress, the active applications for it are meant to be accepted.
-- WARNING: This affects ALL such inconsistencies.

UPDATE public.applications
SET status = 'accepted', decided_at = now()
WHERE status = 'sent'
AND offer_id IN (
    SELECT id FROM public.offers WHERE status = 'in_progress'
);

-- Auto-reject others? Maybe safer not to automate this blindly, but let's at least fix the accepted one.

COMMIT;
