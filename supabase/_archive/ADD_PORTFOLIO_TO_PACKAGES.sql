-- Add portfolio_items column to service_packages
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS portfolio_items text[] DEFAULT '{}';
