-- FORCE FIX FOREIGN KEY (Aggressive)
-- The existing constraint 'milestone_snapshots_version_id_fkey' is corrupt (points to 'draft_versions').
-- We will DROP it and create a NEW one with a different name to be 100% sure.

BEGIN;

-- 1. Explicitly drop the old constraint by name
ALTER TABLE public.milestone_snapshots 
DROP CONSTRAINT IF EXISTS milestone_snapshots_version_id_fkey;

-- 2. Validate that milestone_versions exists (for sanity)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'milestone_versions') THEN
        RAISE EXCEPTION 'Table public.milestone_versions does not exist!';
    END IF;
END $$;

-- 3. Add the NEW Correct Constraint
-- We rename it to '_fixed' to avoid any conflict with phantom catalog entries
ALTER TABLE public.milestone_snapshots
ADD CONSTRAINT milestone_snapshots_version_id_fkey_fixed
FOREIGN KEY (version_id)
REFERENCES public.milestone_versions(id)
ON DELETE CASCADE;

COMMIT;
