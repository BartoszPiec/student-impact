-- Allow users to update messages if they are part of the conversation
-- This is crucial for marking messages as "read" (updating read_at).

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
    and (c.student_id = auth.uid() or c.company_id = auth.uid())
  )
)
WITH CHECK (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
    and (c.student_id = auth.uid() or c.company_id = auth.uid())
  )
);
