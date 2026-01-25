-- CLEANUP_DUPLICATE_SERVICES.sql

BEGIN;

-- Remove duplicates: Delete services that have "System" titles but are marked as 'student_gig' (or have NULL type)
DELETE FROM public.service_packages
WHERE (
    title IN (
        'Montaż Rolek (TikTok, Reels, Shorts)',
        'Montaż Wideo na YouTube',
        'Przygotowanie Logo',
        'Kampania Marketingowa',
        'Automatyzacja Skrzynki Pocztowej'
    )
)
AND (type = 'student_gig' OR type IS NULL);

-- Ensure correct types for the remaining ones (safety net)
UPDATE public.service_packages
SET type = 'platform_service'
WHERE title IN (
    'Montaż Rolek (TikTok, Reels, Shorts)',
    'Montaż Wideo na YouTube',
    'Przygotowanie Logo',
    'Kampania Marketingowa',
    'Automatyzacja Skrzynki Pocztowej'
);

COMMIT;
