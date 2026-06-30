-- FIX_SERVICE_TYPES.sql

-- Move all services to 'platform_service' except the user's specific test one
UPDATE public.service_packages
SET type = 'platform_service'
WHERE title NOT ILIKE '%Piec%';

-- Ensure the specific one is student_gig
UPDATE public.service_packages
SET type = 'student_gig'
WHERE title ILIKE '%Piec%';
