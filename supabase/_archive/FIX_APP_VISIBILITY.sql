-- Add policy to allow viewing applications if they are linked to a conversation the user participates in
CREATE POLICY "View application via conversation" ON "public"."applications"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.application_id = applications.id
    AND (c.company_id = auth.uid() OR c.student_id = auth.uid())
  )
);
