-- Add columns to offers table to support Job Board features
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS contract_type text; -- e.g. 'b2b', 'uop', 'uz', 'staz'
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS technologies text[] DEFAULT '{}';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS experience_level text; -- e.g. 'junior', 'mid', 'senior'
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS is_remote boolean DEFAULT false;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '30 days');

-- Add index for faster searching
CREATE INDEX IF NOT EXISTS offers_location_idx ON public.offers(location);
CREATE INDEX IF NOT EXISTS offers_technologies_idx ON public.offers USING GIN (technologies);
