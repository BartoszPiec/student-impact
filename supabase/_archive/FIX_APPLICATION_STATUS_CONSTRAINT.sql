-- FIX_APPLICATION_STATUS_CONSTRAINT.sql
-- Updates the allowed values for application status to include 'in_progress'

BEGIN;

ALTER TABLE public.applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('sent', 'countered', 'accepted', 'rejected', 'withdrawn', 'in_progress', 'completed', 'cancelled'));

COMMIT;
