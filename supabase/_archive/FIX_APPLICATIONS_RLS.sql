-- Enable RLS on applications if not already enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Ensure constraints allow cascade or manual deletion (optional, but good practice if not set)
-- We won't alter FKs blindly, but we will add the missing Policy.

-- POLICY: Users can delete their own applications
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;

CREATE POLICY "Users can delete own applications"
ON applications
FOR DELETE
USING (auth.uid() = student_id);

-- POLICY: Users can update their own applications (if needed for status updates)
-- Checking if it exists or ensuring it covers necessary states
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
CREATE POLICY "Users can update own applications"
ON applications
FOR UPDATE
USING (auth.uid() = student_id);
