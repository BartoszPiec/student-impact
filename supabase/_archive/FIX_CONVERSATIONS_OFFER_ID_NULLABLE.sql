-- FIX_CONVERSATIONS_OFFER_ID_NULLABLE.sql
BEGIN;

-- Relax update: allow offer_id to be NULL.
-- This is required for 'inquiry' and 'direct' conversations that are not linked to a specific Job Offer.
ALTER TABLE public.conversations 
ALTER COLUMN offer_id DROP NOT NULL;

COMMIT;
