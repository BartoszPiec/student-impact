-- Enable RLS (just in case)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- POLICY: Users can insert their own applications
DROP POLICY IF EXISTS "Users can create own applications" ON applications;

CREATE POLICY "Users can create own applications"
ON applications
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Also ensure SELECT policy exists (otherwise they can't see what they created)
-- Usually there's a "Users can view own applications" policy.
-- If not, let's add it to be safe.
DROP POLICY IF EXISTS "Users can view own applications" ON applications;

CREATE POLICY "Users can view own applications"
ON applications
FOR SELECT
USING (auth.uid() = student_id);
