-- Security Hardening: Storage Buckets and Financial Tables
-- Reconstructed from database state to resolve repository drift

-- 1. Storage Policies
DROP POLICY IF EXISTS "deliverables_upload_strict" ON storage.objects;
CREATE POLICY "deliverables_upload_strict" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    (bucket_id = 'deliverables'::text) AND (
        ((storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'::text AND is_project_participant(((storage.foldername(name))[1])::uuid, ((storage.foldername(name))[1])::uuid)) OR
        ((storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'::text AND is_project_participant(((storage.foldername(name))[2])::uuid, ((storage.foldername(name))[2])::uuid))
    )
);

DROP POLICY IF EXISTS "cvs_read_owner_admin" ON storage.objects;
CREATE POLICY "cvs_read_owner_admin" ON storage.objects
FOR SELECT TO authenticated
USING (
    (bucket_id = 'cvs'::text) AND (
        (owner = auth.uid()) OR 
        (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
    )
);

-- 2. Financial Ledger Strict RLS
DROP POLICY IF EXISTS "ledger_no_update" ON public.financial_ledger;
CREATE POLICY "ledger_no_update" ON public.financial_ledger FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "ledger_no_delete" ON public.financial_ledger;
CREATE POLICY "ledger_no_delete" ON public.financial_ledger FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "ledger_no_insert_authenticated" ON public.financial_ledger;
CREATE POLICY "ledger_no_insert_authenticated" ON public.financial_ledger FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "ledger_select_admin" ON public.financial_ledger;
CREATE POLICY "ledger_select_admin" ON public.financial_ledger FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "ledger_select_own" ON public.financial_ledger;
CREATE POLICY "ledger_select_own" ON public.financial_ledger FOR SELECT TO authenticated USING (user_id = auth.uid());
