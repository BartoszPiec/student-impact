-- Add NIP and address fields to company_profiles
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS nip text;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS city text;
