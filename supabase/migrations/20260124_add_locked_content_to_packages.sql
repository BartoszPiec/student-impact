
-- Add locked_content column to service_packages for storing hidden instructions/links
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS locked_content TEXT;

-- Ensure RLS allows admins to view locked_content, but public only sees it if they 'own' a related order (logic to be handled in application layer or via order relation)
-- For now, we just add the column.
