
-- Add categories column to service_packages
ALTER TABLE service_packages 
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Update RLS to allow update of this column (usually covered by 'update own' policy, but good to check)
-- Existing policies for service_packages usually allow owner to update all columns.
