-- MIGRATION_ADD_OFFER_FIELDS.sql
-- Adds 'obligations' and 'benefits' columns to the 'offers' table

BEGIN;

-- Add 'obligations' column (Obowiązki)
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS obligations text;

-- Add 'benefits' column (Co oferujemy)
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS benefits text;

COMMIT;
