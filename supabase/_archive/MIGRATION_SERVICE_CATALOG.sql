-- MIGRATION_SERVICE_CATALOG.sql

BEGIN;

-- 1. Update service_packages
-- Add 'type' to distinguish between student gigs and platform templates
ALTER TABLE public.service_packages
ADD COLUMN IF NOT EXISTS type text DEFAULT 'student_gig' CHECK (type IN ('student_gig', 'platform_service'));

ALTER TABLE public.service_packages
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Inne';

-- 2. Update offers
-- Add flag to identify offers created from platform services
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS is_platform_service boolean DEFAULT false;

-- Add reference to the source package (optional, but good for tracking)
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS service_package_id uuid REFERENCES public.service_packages(id);

COMMIT;
