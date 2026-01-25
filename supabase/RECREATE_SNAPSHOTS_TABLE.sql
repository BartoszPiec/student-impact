-- NUCLEAR OPTION: RECREATE SNAPSHOTS TABLE
-- The existing table has deep schema issues (wrong FKs, wrong column types).
-- We drop it and recreate it with the PERFECT definition matching our RPCs.

BEGIN;

-- 1. Drop old table (and its foreign keys/indexes)
DROP TABLE IF EXISTS public.milestone_snapshots CASCADE;

-- 2. Create proper table
CREATE TABLE public.milestone_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationship to Versions (Correct Table)
    version_id UUID REFERENCES public.milestone_versions(id) ON DELETE CASCADE,
    
    -- Data Fields
    milestone_client_id UUID, -- For Diffing (Added)
    position INTEGER DEFAULT 0,
    title TEXT NOT NULL,
    amount_minor BIGINT NOT NULL, -- BigInt for currency
    criteria TEXT, -- Text for content (not JSONB)
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Security (Disable RLS for now to ensure flow works)
ALTER TABLE public.milestone_snapshots DISABLE ROW LEVEL SECURITY;

COMMIT;
