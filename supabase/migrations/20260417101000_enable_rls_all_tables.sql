-- 20260417101000_enable_rls_all_tables.sql
-- Enables RLS for any public table that still has rowsecurity=false.
-- Current audit identified invoice_counters as the only non-RLS table.

DO $$
DECLARE
  table_row record;
BEGIN
  FOR table_row IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_row.tablename);
  END LOOP;
END
$$;

-- Admin-only internal counter table (used by SECURITY DEFINER RPC).
DROP POLICY IF EXISTS invoice_counters_deny_all ON public.invoice_counters;

CREATE POLICY invoice_counters_deny_all
  ON public.invoice_counters
  FOR ALL
  USING (false)
  WITH CHECK (false);
