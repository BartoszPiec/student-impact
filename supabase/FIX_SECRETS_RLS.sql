-- Drop old policies on project_secrets
DROP POLICY IF EXISTS "Secrets view participant" ON project_secrets;
DROP POLICY IF EXISTS "Secrets insert list" ON project_secrets;
DROP POLICY IF EXISTS "Secrets delete own" ON project_secrets;

-- New Policies using application_id

-- VIEW: Allow participants (Student or Company) to view secrets
CREATE POLICY "Secrets view participant"
ON project_secrets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    LEFT JOIN offers o ON a.offer_id = o.id
    WHERE a.id = project_secrets.application_id
    AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
  )
);

-- INSERT: Allow participants to insert secrets
CREATE POLICY "Secrets insert participant"
ON project_secrets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    LEFT JOIN offers o ON a.offer_id = o.id
    WHERE a.id = project_secrets.application_id
    AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
  )
);

-- DELETE: Allow author to delete their own secrets
CREATE POLICY "Secrets delete own"
ON project_secrets FOR DELETE
TO authenticated
USING ( author_id = auth.uid() );


-- Apply similar fix to project_resources just in case

DROP POLICY IF EXISTS "Resources view participant" ON project_resources;
DROP POLICY IF EXISTS "Resources insert participant" ON project_resources;
DROP POLICY IF EXISTS "Resources delete own" ON project_resources;

-- VIEW Resources
CREATE POLICY "Resources view participant"
ON project_resources FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    LEFT JOIN offers o ON a.offer_id = o.id
    WHERE a.id = project_resources.application_id
    AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
  )
);

-- INSERT Resources
CREATE POLICY "Resources insert participant"
ON project_resources FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    LEFT JOIN offers o ON a.offer_id = o.id
    WHERE a.id = project_resources.application_id
    AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
  )
);

-- DELETE Resources
CREATE POLICY "Resources delete own"
ON project_resources FOR DELETE
TO authenticated
USING ( uploader_id = auth.uid() );
