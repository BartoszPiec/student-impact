-- ADD_PACKAGE_ID_TO_APPLICATIONS.sql
BEGIN;

-- 1. Add package_id to applications table (nullable)
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.service_packages(id);

-- 2. Make offer_id nullable (since now an application can be for a package instead)
ALTER TABLE public.applications 
ALTER COLUMN offer_id DROP NOT NULL;

COMMIT;
