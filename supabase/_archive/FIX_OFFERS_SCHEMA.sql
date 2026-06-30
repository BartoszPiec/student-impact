-- Ensure salary range columns exist
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS salary_range_min numeric;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS salary_range_max numeric;

-- Optional: If you want to force stawka to allow text in the future, you could run:
-- ALTER TABLE public.offers ALTER COLUMN stawka TYPE text;
-- But for now we will respect the numeric type and just add new columns.
