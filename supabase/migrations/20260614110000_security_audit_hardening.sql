BEGIN;

-- S2W-SEC-001: remove every legacy profile SELECT policy and replace the
-- effective permissive policy set with ownership, admin, and explicit
-- business-relationship access. Removing by command instead of by a short
-- name allowlist also closes policy-name drift from historical manual changes.
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('student_profiles', 'company_profiles')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );
  END LOOP;
END $$;

CREATE POLICY student_profiles_select_own
ON public.student_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY student_profiles_select_admin
ON public.student_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
  )
);

CREATE POLICY student_profiles_select_related_company
ON public.student_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.offers o ON o.id = a.offer_id
    WHERE a.student_id = student_profiles.user_id
      AND o.company_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.contracts c
    WHERE c.student_id = student_profiles.user_id
      AND c.company_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.student_id = student_profiles.user_id
      AND c.company_id = auth.uid()
  )
);

CREATE POLICY company_profiles_select_own
ON public.company_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY company_profiles_select_admin
ON public.company_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
  )
);

CREATE POLICY company_profiles_select_related_student
ON public.company_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.offers o ON o.id = a.offer_id
    WHERE a.student_id = auth.uid()
      AND o.company_id = company_profiles.user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.contracts c
    WHERE c.company_id = company_profiles.user_id
      AND c.student_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.company_id = company_profiles.user_id
      AND c.student_id = auth.uid()
  )
);

-- Safe public profile views expose only non-sensitive columns. The column list is
-- built from columns that exist in the target environment so this migration can
-- run across older pilot databases with schema drift.
DO $$
DECLARE
  v_cols text;
BEGIN
  SELECT string_agg(format('%I', col), ', ')
    INTO v_cols
  FROM unnest(ARRAY[
    'user_id',
    'public_name',
    'kierunek',
    'rok',
    'sciezka',
    'kompetencje',
    'bio',
    'doswiadczenie',
    'linkedin_url',
    'portfolio_url',
    'updated_at'
  ]) AS col
  WHERE EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_profiles'
      AND column_name = col
  );

  EXECUTE format(
    'CREATE OR REPLACE VIEW public.student_public_profiles WITH (security_barrier=true) AS SELECT %s FROM public.student_profiles',
    v_cols
  );
END $$;

DO $$
DECLARE
  v_cols text;
BEGIN
  SELECT string_agg(format('%I', col), ', ')
    INTO v_cols
  FROM unnest(ARRAY[
    'user_id',
    'nazwa',
    'branza',
    'opis',
    'website',
    'linkedin_url',
    'logo_url',
    'strona_www',
    'miasto',
    'updated_at'
  ]) AS col
  WHERE EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_profiles'
      AND column_name = col
  );

  EXECUTE format(
    'CREATE OR REPLACE VIEW public.company_public_profiles WITH (security_barrier=true) AS SELECT %s FROM public.company_profiles',
    v_cols
  );
END $$;

GRANT SELECT ON public.student_public_profiles TO authenticated;
GRANT SELECT ON public.company_public_profiles TO authenticated;

-- S2W-SEC-002/003/010: private buckets for user documents and attachments.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('cvs', 'cvs', false),
  ('offer_attachments', 'offer_attachments', false),
  ('chat-attachments', 'chat-attachments', false),
  ('deliverables', 'deliverables', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Everyone can read offer attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload offer attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own offer attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own offer attachments" ON storage.objects;
DROP POLICY IF EXISTS offer_attachments_public_read ON storage.objects;
DROP POLICY IF EXISTS offer_attachments_upload ON storage.objects;

DROP POLICY IF EXISTS storage_private_upload_owner ON storage.objects;
DROP POLICY IF EXISTS storage_private_read_owner_or_admin ON storage.objects;
DROP POLICY IF EXISTS storage_private_update_owner_or_admin ON storage.objects;
DROP POLICY IF EXISTS storage_private_delete_owner_or_admin ON storage.objects;

CREATE POLICY storage_private_upload_owner
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  -- Deliverables retain their stricter participant/path policy. A generic
  -- owner-only insert policy would otherwise bypass that validation because
  -- PostgreSQL combines permissive policies with OR.
  bucket_id IN ('cvs', 'offer_attachments', 'chat-attachments')
  AND owner = auth.uid()
);

CREATE POLICY storage_private_read_owner_or_admin
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id IN ('cvs', 'offer_attachments', 'chat-attachments', 'deliverables')
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
);

CREATE POLICY storage_private_update_owner_or_admin
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN ('cvs', 'offer_attachments', 'chat-attachments', 'deliverables')
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
);

CREATE POLICY storage_private_delete_owner_or_admin
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN ('cvs', 'offer_attachments', 'chat-attachments', 'deliverables')
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
);

-- S2W-SEC-005: PIT calculation is an internal finance operation.
REVOKE EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric) TO service_role;

COMMIT;
