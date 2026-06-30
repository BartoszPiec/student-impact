-- Check if table exists
SELECT to_regclass('project_resources');

-- Check Policies
select * from pg_policies where tablename = 'project_resources';

-- FORCE OPEN POLICY for Debugging (if table exists)
-- This allows authenticated users to insert/select.
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for users" ON project_resources;

CREATE POLICY "Enable all for users"
ON project_resources
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Check Storage Buckets
select * from storage.buckets;
