-- CHECK NEGOTIATION STATE
-- Inspects the current drafts, versions, and snapshots to see what is successfully saved.

SELECT 'DRAFTS' as table_name, count(*) as count FROM milestone_drafts;
SELECT * FROM milestone_drafts ORDER BY created_at DESC LIMIT 1;

SELECT 'VERSIONS' as table_name, count(*) as count FROM milestone_versions;
SELECT * FROM milestone_versions ORDER BY created_at DESC LIMIT 5;

SELECT 'SNAPSHOTS' as table_name, count(*) as count FROM milestone_snapshots;
SELECT * FROM milestone_snapshots ORDER BY created_at DESC LIMIT 5;

SELECT 'DB_TIME' as info, now();
