-- Add package_id to conversations to link inquiries to service_packages
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.service_packages(id);

-- Verify policy (existing generic select should cover it, but good to know)
