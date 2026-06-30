CREATE OR REPLACE FUNCTION public.production_readiness_report_v1()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_critical_tables text[] := ARRAY[
    'profiles',
    'student_profiles',
    'company_profiles',
    'service_packages',
    'service_orders',
    'contracts',
    'contract_documents',
    'milestones',
    'deliverables',
    'payments',
    'payouts',
    'stripe_events',
    'disputes',
    'notifications',
    'conversations',
    'messages'
  ];
  v_required_functions text[] := ARRAY[
    'process_stripe_payment_v4',
    'process_stripe_refund_v4',
    'review_delivery_v3',
    'auto_accept_due_milestones_v2',
    'process_payout_paid_v1',
    'production_readiness_report_v1'
  ];
  v_rls_issues jsonb;
  v_missing_functions jsonb;
  v_missing_tables jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table', table_name,
    'rls_enabled', rowsecurity,
    'policy_count', policy_count
  ) ORDER BY table_name), '[]'::jsonb)
  INTO v_rls_issues
  FROM (
    SELECT
      t.tablename AS table_name,
      t.rowsecurity,
      COALESCE(p.policy_count, 0) AS policy_count
    FROM pg_tables t
    LEFT JOIN (
      SELECT tablename, COUNT(*)::int AS policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename
    ) p ON p.tablename = t.tablename
    WHERE t.schemaname = 'public'
      AND t.tablename = ANY(v_critical_tables)
      AND (t.rowsecurity IS DISTINCT FROM true OR COALESCE(p.policy_count, 0) = 0)
  ) issues;

  SELECT COALESCE(jsonb_agg(required_table ORDER BY required_table), '[]'::jsonb)
  INTO v_missing_tables
  FROM unnest(v_critical_tables) AS required_table
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND t.tablename = required_table
  );

  SELECT COALESCE(jsonb_agg(required_function ORDER BY required_function), '[]'::jsonb)
  INTO v_missing_functions
  FROM unnest(v_required_functions) AS required_function
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = required_function
  );

  RETURN jsonb_build_object(
    'checked_at', now(),
    'critical_tables', to_jsonb(v_critical_tables),
    'missing_tables', v_missing_tables,
    'rls_issues', v_rls_issues,
    'missing_functions', v_missing_functions,
    'indexes', jsonb_build_object(
      'payouts_milestone_status_created', to_regclass('public.idx_payouts_milestone_status_created') IS NOT NULL
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.production_readiness_report_v1() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.production_readiness_report_v1() FROM anon;
REVOKE EXECUTE ON FUNCTION public.production_readiness_report_v1() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.production_readiness_report_v1() TO service_role;
