
-- ============================================================
-- 1. ERROR: milestone_versions — brak RLS (tabela publiczna)
-- ============================================================
ALTER TABLE public.milestone_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_view_milestone_versions"
  ON public.milestone_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_drafts md
      JOIN public.contracts c ON c.id = md.contract_id
      WHERE md.id = milestone_versions.draft_id
        AND (c.company_id = auth.uid() OR c.student_id = auth.uid())
    )
  );

CREATE POLICY "admin_all_milestone_versions"
  ON public.milestone_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 2. INFO: audit_log — RLS włączony ale brak polityk
-- ============================================================
CREATE POLICY "admin_all_audit_log"
  ON public.audit_log
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 3. INFO: experience_entries — RLS włączony ale brak polityk
-- ============================================================
CREATE POLICY "student_manage_own_experience"
  ON public.experience_entries
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "company_view_experience"
  ON public.experience_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'company'
    )
  );

CREATE POLICY "admin_all_experience"
  ON public.experience_entries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 4. WARN: contract_documents — INSERT policy zbyt szeroka
--    Wstawianie może robić tylko SECURITY DEFINER (Edge Function)
--    lub admin — nie dowolny authenticated user
-- ============================================================
DROP POLICY IF EXISTS "contract_documents_insert_authenticated"
  ON public.contract_documents;

CREATE POLICY "admin_insert_contract_documents"
  ON public.contract_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 5. WARN: invoices INSERT policy zbyt szeroka
-- ============================================================
DROP POLICY IF EXISTS "invoices_insert_authenticated"
  ON public.invoices;

CREATE POLICY "admin_insert_invoices"
  ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
;
