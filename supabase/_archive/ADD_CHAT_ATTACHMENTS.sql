-- 1. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Policies
DROP POLICY IF EXISTS "Chat Attachments Public Read" ON storage.objects;
CREATE POLICY "Chat Attachments Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-attachments' );

DROP POLICY IF EXISTS "Chat Attachments Auth Upload" ON storage.objects;
CREATE POLICY "Chat Attachments Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-attachments' );

-- 3. Update messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text; -- 'image', 'file'

-- 4. Enable RLS on valid bucket usage (optional but good practice)
-- (Skipped complex RLS for now, focusing on basic functionality)
