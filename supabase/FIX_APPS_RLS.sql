-- Ensure Students can update their applications (for negotiation)
-- Drop conflicting policies if any (be careful not to drop 'view' policies if separate)
-- Assuming common policy pattern "Users can update own applications"

DROP POLICY IF EXISTS "Users can update own applications" ON applications;

CREATE POLICY "Users can update own applications"
ON applications FOR UPDATE
TO authenticated
USING (
  (auth.uid() = student_id) OR (auth.uid() = (SELECT company_id FROM offers WHERE id = applications.offer_id))
)
WITH CHECK (
  (auth.uid() = student_id) OR (auth.uid() = (SELECT company_id FROM offers WHERE id = applications.offer_id))
);

-- Note: The Company check subquery might be expensive or require join pre-check. 
-- Alternatively, if we trust the application row has 'offer_id' and we can join?
-- Simpler:
-- CREATE POLICY "Students can update own" ... USING (student_id = auth.uid());
-- CREATE POLICY "Companies can update received" ... USING (EXISTS (SELECT 1 FROM offers WHERE id = applications.offer_id AND company_id = auth.uid()));

-- Let's stick to separate policies for clarity and robustness

DROP POLICY IF EXISTS "Students can update own applications" ON applications;
CREATE POLICY "Students can update own applications"
ON applications FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Companies can update received applications" ON applications;
CREATE POLICY "Companies can update received applications"
ON applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM offers 
    WHERE offers.id = applications.offer_id 
    AND offers.company_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM offers 
    WHERE offers.id = applications.offer_id 
    AND offers.company_id = auth.uid()
  )
);
