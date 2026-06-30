-- MIGRATION SCRIPT
-- This script explicitly renames columns from English (previous setup) to Polish (codebase requirement).
-- Run this in Supabase SQL Editor.

-- 1. OFFERS table
DO $$
BEGIN
    -- Check if 'title' exists and 'tytul' does not
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='offers' AND column_name='title') THEN
        ALTER TABLE public.offers RENAME COLUMN title TO tytul;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='offers' AND column_name='description') THEN
        ALTER TABLE public.offers RENAME COLUMN description TO opis;
    END IF;
    
    -- ‘type’ is a reserved keyword or common issue, but if it exists as type, leave it. 
    -- Code expects 'typ'.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='offers' AND column_name='type') THEN
        ALTER TABLE public.offers RENAME COLUMN type TO typ;
    END IF;

    -- 'rate' -> 'stawka'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='offers' AND column_name='rate') THEN
        ALTER TABLE public.offers RENAME COLUMN rate TO stawka;
    END IF;

    -- 'requirements' -> 'wymagania'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='offers' AND column_name='requirements') THEN
        ALTER TABLE public.offers RENAME COLUMN requirements TO wymagania;
    END IF;
    
    -- 'time' or 'duration' -> 'czas' ? 
    -- Previous schema might have had 'deadline' only.
    -- Let's ensure 'czas' exists.
    ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS czas text;
    ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS typ text DEFAULT 'micro';
END $$;


-- 2. REVIEWS table
DO $$
BEGIN
    ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES auth.users(id);
    ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES auth.users(id);
    ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.offers(id);
    ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS application_id uuid REFERENCES public.applications(id);
END $$;


-- 3. COMPANY_PROFILES
DO $$
BEGIN
    ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS nip text;
    ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS address text;
    ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS city text;
    
    -- Rename if they existed as English
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profiles' AND column_name='name') THEN
        ALTER TABLE public.company_profiles RENAME COLUMN name TO nazwa;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profiles' AND column_name='industry') THEN
        ALTER TABLE public.company_profiles RENAME COLUMN industry TO branza;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profiles' AND column_name='contact_person') THEN
         ALTER TABLE public.company_profiles RENAME COLUMN contact_person TO osoba_kontaktowa;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profiles' AND column_name='description') THEN
         ALTER TABLE public.company_profiles RENAME COLUMN description TO opis;
    END IF;
END $$;


-- 4. STUDENT_PROFILES (Just in case)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='field_of_study') THEN
         ALTER TABLE public.student_profiles RENAME COLUMN field_of_study TO kierunek;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='year') THEN
         ALTER TABLE public.student_profiles RENAME COLUMN year TO rok;
    END IF;
END $$;
