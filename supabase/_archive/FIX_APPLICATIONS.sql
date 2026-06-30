-- FORCE FIX APPLICATIONS TABLE
-- Fixes "column proposed_stawka does not exist"

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS proposed_stawka numeric;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS counter_stawka numeric;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS agreed_stawka numeric;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS message_to_company text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS decided_at timestamptz;

-- Ensure status check includes new states if needed (optional)
-- ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
-- ALTER TABLE public.applications ADD CONSTRAINT applications_status_check CHECK (status IN ('sent', 'countered', 'accepted', 'rejected', 'withdrawn'));
