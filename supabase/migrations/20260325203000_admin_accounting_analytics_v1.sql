-- Migration: Admin Accounting Analytics v1
-- Created: 2026-03-25
-- Description: Adds canonical accounting analytics view, indexes, and upgrades get_admin_stats() to use accounting_* data.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_accounting_entries_posted_at
  ON public.accounting_entries (posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_accounting_entries_reference_type_posted_at
  ON public.accounting_entries (reference_type, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_items_entry_id
  ON public.accounting_ledger_items (entry_id);

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_items_account_id
  ON public.accounting_ledger_items (account_id);

CREATE OR REPLACE VIEW public.accounting_book_lines_v1 AS
SELECT
  ae.id AS entry_id,
  ae.posted_at,
  date_trunc('month', ae.posted_at)::date AS month_bucket,
  aj.name AS journal_name,
  ae.reference_type,
  ae.reference_id,
  aa.code AS account_code,
  aa.name AS account_name,
  aa.type AS account_type,
  ali.direction,
  ali.amount_minor,
  CASE
    WHEN aa.type IN ('asset', 'expense') AND ali.direction = 'debit' THEN ali.amount_minor
    WHEN aa.type IN ('asset', 'expense') AND ali.direction = 'credit' THEN -ali.amount_minor
    WHEN aa.type IN ('liability', 'equity', 'revenue') AND ali.direction = 'credit' THEN ali.amount_minor
    ELSE -ali.amount_minor
  END AS balance_effect_minor
FROM public.accounting_ledger_items ali
JOIN public.accounting_entries ae ON ae.id = ali.entry_id
JOIN public.accounting_accounts aa ON aa.id = ali.account_id
LEFT JOIN public.accounting_journals aj ON aj.id = ae.journal_id;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_total_students INT := 0;
    v_total_companies INT := 0;
    v_offers_total INT := 0;
    v_contracts_active INT := 0;
    v_contracts_completed INT := 0;
    v_contracts_cancelled INT := 0;
    v_contracts_total INT := 0;
    v_applications_total INT := 0;
    v_applications_accepted INT := 0;

    v_total_volume_minor BIGINT := 0;
    v_escrow_balance_minor BIGINT := 0;
    v_student_payable_minor BIGINT := 0;
    v_tax_payable_minor BIGINT := 0;
    v_total_revenue_minor BIGINT := 0;
    v_paid_out_minor BIGINT := 0;
    v_refunded_minor BIGINT := 0;

    v_avg_completion_days NUMERIC := 0;
    v_top_students JSONB := '[]'::jsonb;
    v_top_companies JSONB := '[]'::jsonb;
    v_recent_activity JSONB := '[]'::jsonb;
    v_top_categories JSONB := '[]'::jsonb;
    v_volume_history JSONB := '[]'::jsonb;
    v_revenue_history JSONB := '[]'::jsonb;
    v_funnel JSONB := '{}'::jsonb;
BEGIN
    SELECT COUNT(*) INTO v_total_students FROM public.profiles WHERE role = 'student';
    SELECT COUNT(*) INTO v_total_companies FROM public.profiles WHERE role = 'company';
    SELECT COUNT(*) INTO v_offers_total FROM public.offers WHERE COALESCE(is_private, false) = false;

    SELECT COUNT(*) INTO v_contracts_total FROM public.contracts;
    SELECT COUNT(*) INTO v_contracts_active FROM public.contracts WHERE status IN ('active', 'awaiting_funding', 'draft', 'delivered');
    SELECT COUNT(*) INTO v_contracts_completed FROM public.contracts WHERE status IN ('completed', 'delivered');
    SELECT COUNT(*) INTO v_contracts_cancelled FROM public.contracts WHERE status IN ('cancelled', 'disputed');
    SELECT COUNT(*) INTO v_applications_total FROM public.applications;
    SELECT COUNT(*) INTO v_applications_accepted FROM public.applications WHERE status IN ('accepted', 'in_progress', 'completed');

    SELECT COALESCE(SUM(amount_minor), 0)
    INTO v_total_volume_minor
    FROM public.accounting_book_lines_v1
    WHERE reference_type = 'payment'
      AND account_code = '2010'
      AND direction = 'credit';

    SELECT COALESCE(SUM(balance_effect_minor), 0)
    INTO v_escrow_balance_minor
    FROM public.accounting_book_lines_v1
    WHERE account_code = '2010';

    SELECT COALESCE(SUM(balance_effect_minor), 0)
    INTO v_student_payable_minor
    FROM public.accounting_book_lines_v1
    WHERE account_code = '2020';

    SELECT COALESCE(SUM(balance_effect_minor), 0)
    INTO v_tax_payable_minor
    FROM public.accounting_book_lines_v1
    WHERE account_code = '2030';

    SELECT COALESCE(SUM(balance_effect_minor), 0)
    INTO v_total_revenue_minor
    FROM public.accounting_book_lines_v1
    WHERE account_code = '4010';

    SELECT COALESCE(SUM(amount_minor), 0)
    INTO v_paid_out_minor
    FROM public.accounting_book_lines_v1
    WHERE reference_type = 'student_payout'
      AND account_code = '2020'
      AND direction = 'debit';

    SELECT COALESCE(SUM(amount_minor), 0)
    INTO v_refunded_minor
    FROM public.accounting_book_lines_v1
    WHERE reference_type = 'refund'
      AND account_code = '2010'
      AND direction = 'debit';

    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 0)
    INTO v_avg_completion_days
    FROM public.contracts
    WHERE status = 'completed';

    WITH months AS (
        SELECT generate_series(
            date_trunc('month', now()) - interval '5 month',
            date_trunc('month', now()),
            interval '1 month'
        )::date AS month_bucket
    ),
    volume_lines AS (
        SELECT month_bucket, SUM(amount_minor) AS amount_minor
        FROM public.accounting_book_lines_v1
        WHERE reference_type = 'payment'
          AND account_code = '2010'
          AND direction = 'credit'
        GROUP BY month_bucket
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'month', to_char(months.month_bucket, 'YYYY-MM'),
                'amount', ROUND(COALESCE(volume_lines.amount_minor, 0)::numeric / 100.0, 2)
            )
            ORDER BY months.month_bucket
        ),
        '[]'::jsonb
    )
    INTO v_volume_history
    FROM months
    LEFT JOIN volume_lines USING (month_bucket);

    WITH months AS (
        SELECT generate_series(
            date_trunc('month', now()) - interval '5 month',
            date_trunc('month', now()),
            interval '1 month'
        )::date AS month_bucket
    ),
    revenue_lines AS (
        SELECT month_bucket, SUM(amount_minor) AS amount_minor
        FROM public.accounting_book_lines_v1
        WHERE account_code = '4010'
          AND direction = 'credit'
        GROUP BY month_bucket
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'month', to_char(months.month_bucket, 'YYYY-MM'),
                'amount', ROUND(COALESCE(revenue_lines.amount_minor, 0)::numeric / 100.0, 2)
            )
            ORDER BY months.month_bucket
        ),
        '[]'::jsonb
    )
    INTO v_revenue_history
    FROM months
    LEFT JOIN revenue_lines USING (month_bucket);

    SELECT jsonb_build_object(
        'offers', v_offers_total,
        'applications', v_applications_total,
        'accepted', v_applications_accepted,
        'contracts', v_contracts_completed
    )
    INTO v_funnel;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_top_students
    FROM (
        SELECT
            au.email,
            ROUND(SUM(abli.amount_minor)::numeric / 100.0, 2) AS total_volume,
            COUNT(DISTINCT ae.reference_id) AS contracts_count
        FROM public.accounting_book_lines_v1 abli
        JOIN public.accounting_entries ae ON ae.id = abli.entry_id
        JOIN public.milestones m ON m.id = ae.reference_id
        JOIN public.contracts c ON c.id = m.contract_id
        JOIN auth.users au ON au.id = c.student_id
        WHERE ae.reference_type = 'milestone_release'
          AND abli.account_code = '2020'
          AND abli.direction = 'credit'
        GROUP BY au.email
        ORDER BY total_volume DESC
        LIMIT 3
    ) t;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_top_companies
    FROM (
        SELECT
            au.email,
            ROUND(SUM(abli.amount_minor)::numeric / 100.0, 2) AS total_volume,
            COUNT(DISTINCT ae.reference_id) AS contracts_count
        FROM public.accounting_book_lines_v1 abli
        JOIN public.accounting_entries ae ON ae.id = abli.entry_id
        JOIN public.contracts c ON c.id = ae.reference_id
        JOIN auth.users au ON au.id = c.company_id
        WHERE ae.reference_type = 'payment'
          AND abli.account_code = '2010'
          AND abli.direction = 'credit'
        GROUP BY au.email
        ORDER BY total_volume DESC
        LIMIT 3
    ) t;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_recent_activity
    FROM (
        SELECT
            ae.id,
            ae.posted_at AS created_at,
            ae.reference_type AS status,
            COALESCE(au.email, 'system') AS company_name
        FROM public.accounting_entries ae
        LEFT JOIN public.contracts c
          ON c.id = ae.reference_id
         AND ae.reference_type = 'payment'
        LEFT JOIN auth.users au ON au.id = c.company_id
        ORDER BY ae.posted_at DESC
        LIMIT 5
    ) t;

    SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO v_top_categories
    FROM (
        SELECT category, COUNT(*) AS count, ROUND(SUM(value_minor)::numeric / 100.0, 2) AS volume
        FROM (
            SELECT
                COALESCE(sp.title, 'Usługa niestandardowa') AS category,
                (so.amount * 100)::bigint AS value_minor
            FROM public.contracts c
            JOIN public.service_orders so ON c.service_order_id = so.id
            LEFT JOIN public.service_packages sp ON so.package_id = sp.id
            WHERE c.status != 'cancelled'

            UNION ALL

            SELECT
                COALESCE(o.typ, 'Oferta pracy') AS category,
                COALESCE(a.agreed_stawka_minor, (a.agreed_stawka * 100)::bigint) AS value_minor
            FROM public.contracts c
            JOIN public.applications a ON c.application_id = a.id
            JOIN public.offers o ON a.offer_id = o.id
            WHERE c.status != 'cancelled'
        ) combined
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
    ) x;

    RETURN jsonb_build_object(
        'users', jsonb_build_object(
            'students', v_total_students,
            'companies', v_total_companies
        ),
        'contracts', jsonb_build_object(
            'active', v_contracts_active,
            'completed', v_contracts_completed,
            'cancelled', v_contracts_cancelled,
            'total', v_contracts_total
        ),
        'applications', jsonb_build_object(
            'total', v_applications_total
        ),
        'financials', jsonb_build_object(
            'total_volume_pln', ROUND(v_total_volume_minor::numeric / 100.0, 2),
            'escrow_active_pln', ROUND(v_escrow_balance_minor::numeric / 100.0, 2),
            'student_payable_pln', ROUND(v_student_payable_minor::numeric / 100.0, 2),
            'tax_payable_pln', ROUND(v_tax_payable_minor::numeric / 100.0, 2),
            'total_revenue_pln', ROUND(v_total_revenue_minor::numeric / 100.0, 2),
            'paid_out_pln', ROUND(v_paid_out_minor::numeric / 100.0, 2),
            'refunded_pln', ROUND(v_refunded_minor::numeric / 100.0, 2)
        ),
        'metrics', jsonb_build_object(
            'avg_completion_days', ROUND(v_avg_completion_days, 1)
        ),
        'leaderboard', jsonb_build_object(
            'top_students', v_top_students,
            'top_companies', v_top_companies
        ),
        'recent', v_recent_activity,
        'categories', v_top_categories,
        'revenue_history', v_revenue_history,
        'volume_history', v_volume_history,
        'funnel', v_funnel
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO service_role;

COMMIT;
