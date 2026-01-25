-- Create 'portfolio' bucket if not exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('portfolio', 'portfolio', true, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view files
CREATE POLICY "Public Access Portfolio" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Auth Upload Portfolio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio' AND
    auth.role() = 'authenticated'
  );

-- Policy: Allow users to update their own files
CREATE POLICY "Auth Update Portfolio" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'portfolio' AND
    auth.uid() = owner
  );

-- Policy: Allow users to delete their own files
CREATE POLICY "Auth Delete Portfolio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio' AND
    auth.uid() = owner
  );
