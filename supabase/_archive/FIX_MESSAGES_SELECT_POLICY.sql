-- FIX_MESSAGES_SELECT_POLICY.sql
BEGIN;

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT messages from conversations they participate in
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;

CREATE POLICY "Users can view messages" ON public.messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = conversation_id 
        AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
    )
);

COMMIT;
