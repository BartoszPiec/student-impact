-- 20260124_admin_stats_v3.sql
-- Adds Advanced Analytics: Completion Time, Cancellation Rate, Conversion, Top Users

BEGIN;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to see all data
AS $$
DECLARE
    -- Basic Counts
    v_total_students INT;
    v_total_companies INT;
    v_contracts_active INT;
    v_contracts_completed INT;
    v_contracts_cancelled INT;
    v_contracts_total INT;
    v_applications_total INT;
    
    -- Financials
    v_volume_total NUMERIC; 
    v_volume_escrow NUMERIC;
    
    -- Advanced Metrics
    v_avg_completion_days NUMERIC;
    v_top_students JSONB;
    v_top_companies JSONB;
    v_recent_activity JSONB;
    v_top_categories JSONB;
BEGIN
    -- 1. User Stats
    SELECT COUNT(*) INTO v_total_students FROM profiles WHERE role = 'student';
    SELECT COUNT(*) INTO v_total_companies FROM profiles WHERE role = 'company';
    
    -- 2. Contract & App Stats
    SELECT COUNT(*) INTO v_contracts_total FROM contracts;
    SELECT COUNT(*) INTO v_contracts_active FROM contracts WHERE status IN ('active', 'awaiting_funding', 'draft');
    SELECT COUNT(*) INTO v_contracts_completed FROM contracts WHERE status IN ('completed', 'delivered');
    SELECT COUNT(*) INTO v_contracts_cancelled FROM contracts WHERE status IN ('cancelled', 'disputed');
    SELECT COUNT(*) INTO v_applications_total FROM applications;

    -- 3. Financials
    SELECT COALESCE(SUM(
        CASE 
            WHEN c.service_order_id IS NOT NULL THEN (SELECT amount FROM service_orders WHERE id = c.service_order_id)
            WHEN c.application_id IS NOT NULL THEN (SELECT agreed_stawka FROM applications WHERE id = c.application_id)
            ELSE 0 
        END
    ), 0)
    INTO v_volume_total
    FROM contracts c
    WHERE c.status != 'cancelled';

    SELECT COALESCE(SUM(
        CASE 
            WHEN c.service_order_id IS NOT NULL THEN (SELECT amount FROM service_orders WHERE id = c.service_order_id)
            WHEN c.application_id IS NOT NULL THEN (SELECT agreed_stawka FROM applications WHERE id = c.application_id)
            ELSE 0 
        END
    ), 0)
    INTO v_volume_escrow
    FROM contracts c
    WHERE c.status IN ('active', 'awaiting_funding', 'delivered');

    -- 4. Avg Completion Time (Days)
    -- Difference between updated_at (completion time) and created_at for completed contracts
    SELECT COALESCE(AVG(
        EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
    ), 0)
    INTO v_avg_completion_days
    FROM contracts
    WHERE status = 'completed';

    -- 5. Top Students (By Volume)
    SELECT jsonb_agg(t) INTO v_top_students
    FROM (
        SELECT 
            p.email, -- Fallback if profile name missing
            SUM(
                CASE 
                    WHEN c.service_order_id IS NOT NULL THEN (SELECT amount FROM service_orders WHERE id = c.service_order_id)
                    WHEN c.application_id IS NOT NULL THEN (SELECT agreed_stawka FROM applications WHERE id = c.application_id)
                    ELSE 0 
                END
            ) as total_volume,
            COUNT(*) as contracts_count
        FROM contracts c
        JOIN auth.users p ON c.student_id = p.id
        WHERE c.status = 'completed'
        GROUP BY p.email
        ORDER BY total_volume DESC
        LIMIT 3
    ) t;

    -- 6. Top Companies (By Volume)
    SELECT jsonb_agg(t) INTO v_top_companies
    FROM (
        SELECT 
            p.email,
            SUM(
                CASE 
                    WHEN c.service_order_id IS NOT NULL THEN (SELECT amount FROM service_orders WHERE id = c.service_order_id)
                    WHEN c.application_id IS NOT NULL THEN (SELECT agreed_stawka FROM applications WHERE id = c.application_id)
                    ELSE 0 
                END
            ) as total_volume,
            COUNT(*) as contracts_count
        FROM contracts c
        JOIN auth.users p ON c.company_id = p.id
        WHERE c.status != 'cancelled' -- Include active investers too
        GROUP BY p.email
        ORDER BY total_volume DESC
        LIMIT 3
    ) t;

    -- 7. Recent Activity
    SELECT jsonb_agg(t) INTO v_recent_activity
    FROM (
        SELECT 
            c.id, 
            c.created_at, 
            c.status,
            p.email as company_name 
        FROM contracts c
        LEFT JOIN auth.users p ON c.company_id = p.id
        ORDER BY c.created_at DESC
        LIMIT 5
    ) t;

    -- 8. Top Categories
    SELECT jsonb_agg(x) INTO v_top_categories
    FROM (
        SELECT category, COUNT(*) as count, SUM(value) as volume
        FROM (
            SELECT 
                COALESCE(sp.title, 'Usługa Niestandardowa') as category,
                so.amount as value
            FROM contracts c
            JOIN service_orders so ON c.service_order_id = so.id
            LEFT JOIN service_packages sp ON so.package_id = sp.id
            WHERE c.status != 'cancelled'
            UNION ALL
            SELECT 
                COALESCE(o.typ, 'Oferta Pracy') as category,
                a.agreed_stawka as value
            FROM contracts c
            JOIN applications a ON c.application_id = a.id
            JOIN offers o ON a.offer_id = o.id
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
            'total_volume_pln', v_volume_total,
            'escrow_active_pln', v_volume_escrow
        ),
        'metrics', jsonb_build_object(
            'avg_completion_days', ROUND(v_avg_completion_days, 1)
        ),
        'leaderboard', jsonb_build_object(
            'top_students', COALESCE(v_top_students, '[]'::jsonb),
            'top_companies', COALESCE(v_top_companies, '[]'::jsonb)
        ),
        'recent', COALESCE(v_recent_activity, '[]'::jsonb),
        'categories', COALESCE(v_top_categories, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO service_role;

COMMIT;
