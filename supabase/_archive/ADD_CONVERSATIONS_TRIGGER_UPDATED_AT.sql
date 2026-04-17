-- Add updated_at to conversations if not exists (it likely exists but we ensure it).
-- We will use this column to sort conversations by most recent activity.

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
    ALTER TABLE public.conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages INSERT
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

CREATE TRIGGER on_message_created
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message();

-- Backfill updated_at for existing conversations based on last message
UPDATE public.conversations c
SET updated_at = (
  SELECT created_at 
  FROM public.messages m 
  WHERE m.conversation_id = c.id 
  ORDER BY m.created_at DESC 
  LIMIT 1
)
WHERE updated_at IS NULL OR updated_at = c.created_at;
