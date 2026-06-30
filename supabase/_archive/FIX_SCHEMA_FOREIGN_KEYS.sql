-- FIX FOREIGN KEY MISMATCH
-- The error "not present in table draft_versions" implies 'milestone_snapshots' is linked to 'draft_versions'.
-- However, our system uses 'milestone_versions'.
-- We must repoint the Foreign Key.

BEGIN;

-- 1. Drop the old/wrong constraint
ALTER TABLE milestone_snapshots 
DROP CONSTRAINT IF EXISTS milestone_snapshots_version_id_fkey;

-- 2. Add the correct constraint pointing to milestone_versions
ALTER TABLE milestone_snapshots
ADD CONSTRAINT milestone_snapshots_version_id_fkey
FOREIGN KEY (version_id)
REFERENCES milestone_versions(id)
ON DELETE CASCADE;

COMMIT;
