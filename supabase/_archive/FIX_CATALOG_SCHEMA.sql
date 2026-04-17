-- FIX_CATALOG_SCHEMA.sql

BEGIN;

-- 1. Ensure columns exist
ALTER TABLE public.service_packages 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'student_gig';

ALTER TABLE public.service_packages 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Inne';

-- 2. Force Schema Cache Reload (Important for "Could not find column" errors)
NOTIFY pgrst, 'reload schema';

COMMIT;
