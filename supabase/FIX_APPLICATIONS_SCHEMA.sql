-- Add cv_url column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'applications'
        AND column_name = 'cv_url'
    ) THEN
        ALTER TABLE public.applications ADD COLUMN cv_url text;
    END IF;
END $$;

-- Ensure proposed_stawka exists too, just in case
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'applications'
        AND column_name = 'proposed_stawka'
    ) THEN
        ALTER TABLE public.applications ADD COLUMN proposed_stawka numeric;
    END IF;
END $$;

-- Reload schema cache (notify PostgREST)
NOTIFY pgrst, 'reload schema';
