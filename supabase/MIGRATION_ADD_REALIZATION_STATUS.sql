-- MIGRATION_ADD_REALIZATION_STATUS.sql
-- Fixes error: column applications.realization_status does not exist

BEGIN;

-- 1. Add column if it doesn't exist
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS realization_status text DEFAULT 'in_progress';

-- 2. Backfill existing data
-- If an application is 'accepted', it should probably be 'in_progress' (or 'completed' if old).
-- Let's default active ones to 'in_progress'.
UPDATE public.applications 
SET realization_status = 'in_progress' 
WHERE realization_status IS NULL AND status = 'accepted';

COMMIT;
