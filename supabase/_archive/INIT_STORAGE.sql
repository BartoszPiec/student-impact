-- Create the 'deliverables' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to UPLOAD files to 'deliverables'
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'deliverables' );

-- Policy: Allow authenticated users to VIEW files in 'deliverables'
CREATE POLICY "Allow authenticated view"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'deliverables' );

-- Policy: Allow users to DELETE their own files (optional but good practice)
CREATE POLICY "Allow own delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'deliverables' AND owner = auth.uid() );
