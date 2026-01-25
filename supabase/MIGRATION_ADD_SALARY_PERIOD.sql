-- MIGRATION_ADD_SALARY_PERIOD.sql
-- Adds 'salary_period' column to 'offers' table

BEGIN;

-- Add 'salary_period' column with default 'monthly'
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS salary_period text DEFAULT 'monthly';

-- Validate values constraint (optional but good practice)
ALTER TABLE public.offers 
DROP CONSTRAINT IF EXISTS offers_salary_period_check;

ALTER TABLE public.offers 
ADD CONSTRAINT offers_salary_period_check 
CHECK (salary_period IN ('monthly', 'hourly'));

COMMIT;
