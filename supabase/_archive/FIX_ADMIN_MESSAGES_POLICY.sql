-- Enable Admin Delete on Messages
-- Needed for "Deep Delete" of offers (cleaning up chat history)

DROP POLICY IF EXISTS "Admins can delete messages" ON messages;

CREATE POLICY "Admins can delete messages"
ON messages
FOR DELETE
USING (
  exists (
    select 1 from profiles
    where profiles.user_id = auth.uid()
    and profiles.role = 'admin'
  )
);

SELECT 'Admin delete policy for messages enabled' as status;
