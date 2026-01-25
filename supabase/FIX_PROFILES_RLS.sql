-- Fix Profiles RLS to allow reading basic info by authenticated users
-- This is necessary so Companies can see the names of Students who apply/work.

-- Drop ALL potential existing policies to ensure clean state
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;
-- Drop the one that causes the error if it exists
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy allowing READ access to everyone (or just authenticated)
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING ( true );
