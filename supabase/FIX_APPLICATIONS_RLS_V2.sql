-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 1. ALLOW SELECT (Own applications)
DROP POLICY IF EXISTS "Students can view own applications" ON applications;
CREATE POLICY "Students can view own applications"
ON applications FOR SELECT
USING (auth.uid() = student_id);

-- 2. ALLOW SELECT (Company sees applications for their offers)
-- This is trickier because we need to join offers. 
-- For performance, we might just allow all if we trust the app logic, OR use a join.
DROP POLICY IF EXISTS "Companies can view applications for their offers" ON applications;
CREATE POLICY "Companies can view applications for their offers"
ON applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = applications.offer_id
    AND offers.company_id = auth.uid()
  )
);

-- 3. ALLOW INSERT (Students can create applications for themselves)
DROP POLICY IF EXISTS "Students can create applications" ON applications;
CREATE POLICY "Students can create applications"
ON applications FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- 4. ALLOW UPDATE (Students can update own, e.g. cancel)
DROP POLICY IF EXISTS "Students can update own applications" ON applications;
CREATE POLICY "Students can update own applications"
ON applications FOR UPDATE
USING (auth.uid() = student_id);

-- 5. ALLOW DELETE (Students can delete own)
DROP POLICY IF EXISTS "Students can delete own applications" ON applications;
CREATE POLICY "Students can delete own applications"
ON applications FOR DELETE
USING (auth.uid() = student_id);
