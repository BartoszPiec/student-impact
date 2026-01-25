-- FIX_Select_Policy_Conversations.sql
BEGIN;

-- Ensure users can VIEW conversations they are part of
DROP POLICY IF EXISTS "Users can view conversations" ON public.conversations;
CREATE POLICY "Users can view conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = student_id OR auth.uid() = company_id
);

COMMIT;
