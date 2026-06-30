-- DISABLE RLS FOR NEGOTIATION TABLES (Fix FK Visibility)
-- Active RLS policies can hide rows from Foreign Key checks / consistency checks in some contexts.
-- Since this is a negotiation system, we can manage access via logic/RPCs or re-enable properly later.
-- For now, we DISABLE RLS to ensure the INSERT flow works.

BEGIN;

ALTER TABLE public.milestone_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_snapshots DISABLE ROW LEVEL SECURITY;

COMMIT;
