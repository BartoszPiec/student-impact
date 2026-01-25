-- 1. Add kategoria column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'kategoria') THEN
        ALTER TABLE public.offers ADD COLUMN kategoria text DEFAULT 'Inne';
    END IF;
END $$;

-- 2. Update existing rows to ensure no nulls
UPDATE public.offers SET kategoria = 'Inne' WHERE kategoria IS NULL;

-- 3. CRITICAL: Reload PostgREST Schema Cache so API sees the new column
NOTIFY pgrst, 'reload config';
