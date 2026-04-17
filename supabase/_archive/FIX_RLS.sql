-- FIX RLS FOR CONVERSATIONS & MESSAGES

-- 1. Conversations
-- Allow users to view conversations they are part of
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = student_id OR auth.uid() = company_id
);

-- Allow users to insert conversations (e.g. starting a chat)
-- Typically initialized by student (application) or company (direct contact)
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations" ON public.conversations
FOR INSERT WITH CHECK (
  auth.uid() = student_id OR auth.uid() = company_id
);


-- 2. Messages
-- Allow users to view messages for conversations they belong to
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
CREATE POLICY "Users can view messages in own conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
  )
);

-- Allow users to insert messages if they are the sender and part of the conversation
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
  )
);
