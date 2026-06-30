-- Phase 10: Materialized Views for Professional Reporting (v2 with joins)

-- 1. Monthly Revenue (Platform Commission)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_monthly_revenue AS
SELECT
    TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month,
    SUM(amount_minor) as total_revenue_minor,
    COUNT(*) as transaction_count
FROM public.financial_ledger
WHERE type = 'platform_commission'
GROUP BY 1
ORDER BY 1 DESC;

-- 2. Student Obligations (Pending Payouts - Joined with contracts)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_student_obligations AS
SELECT
    c.student_id,
    SUM(p.amount_net_minor) as total_pending_net_minor,
    SUM(p.amount_gross_minor) as total_pending_gross_minor,
    COUNT(*) as pending_payout_count
FROM public.payouts p
JOIN public.contracts c ON p.contract_id = c.id
WHERE p.status = 'pending'
GROUP BY 1;

-- 3. PIT Summary (By Student and Year)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_pit_summary AS
SELECT
    student_id,
    LEFT(tax_period, 4) as tax_year,
    SUM(amount_gross_minor) as total_gross_minor,
    SUM(pit_amount_minor) as total_pit_minor,
    SUM(amount_net_minor) as total_net_minor
FROM public.pit_withholdings
GROUP BY 1, 2;

-- Create refreshing function
CREATE OR REPLACE FUNCTION public.refresh_accounting_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_monthly_revenue;
  REFRESH MATERIALIZED VIEW public.mv_student_obligations;
  REFRESH MATERIALIZED VIEW public.mv_pit_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to admins
GRANT SELECT ON public.mv_monthly_revenue TO authenticated;
GRANT SELECT ON public.mv_student_obligations TO authenticated;
GRANT SELECT ON public.mv_pit_summary TO authenticated;
;
