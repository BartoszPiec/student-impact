
-- Add price_max column to service_packages table
ALTER TABLE service_packages 
ADD COLUMN IF NOT EXISTS price_max numeric DEFAULT null;
