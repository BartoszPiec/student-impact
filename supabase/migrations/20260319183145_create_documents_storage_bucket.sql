
-- Bucket na umowy i dokumenty podatkowe (prywatny — dostep tylko przez signed URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  5242880,  -- 5MB max
  ARRAY['text/html', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Polityki RLS dla bucketu documents
CREATE POLICY "admin_all_documents"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Firma widzi swoje umowy A
CREATE POLICY "company_view_own_contract_a"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND name LIKE 'contracts/%/umowa-a.html'
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.company_id = auth.uid()
        AND name LIKE 'contracts/' || c.id::text || '/%'
    )
  );

-- Student widzi swoją umowę B
CREATE POLICY "student_view_own_contract_b"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND name LIKE 'contracts/%/umowa-b.html'
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.student_id = auth.uid()
        AND name LIKE 'contracts/' || c.id::text || '/%'
    )
  );
;
