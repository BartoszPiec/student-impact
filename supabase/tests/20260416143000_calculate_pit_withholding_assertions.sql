-- 20260416143000_calculate_pit_withholding_assertions.sql
-- Manual SQL assertions for calculate_pit_withholding().
-- Run in a non-production environment:
--   npx supabase db query --linked --file supabase/tests/20260416143000_calculate_pit_withholding_assertions.sql

BEGIN;

DO $$
DECLARE
  v_amount numeric := 1000;
  v_case record;
  v_result record;
BEGIN
  -- Scenario 1: student <26 (pit_exemption_u26 = true) => PIT = 0
  SELECT c.id AS contract_id, m.id AS milestone_id, sp.user_id AS student_id
  INTO v_case
  FROM public.student_profiles sp
  JOIN public.contracts c ON c.student_id = sp.user_id
  JOIN public.milestones m ON m.contract_id = c.id
  WHERE COALESCE(sp.pit_exemption_u26, false) = true
  ORDER BY m.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_case.contract_id IS NOT NULL THEN
    SELECT *
    INTO v_result
    FROM public.calculate_pit_withholding(v_case.milestone_id, v_case.contract_id, v_case.student_id, v_amount);

    IF COALESCE(v_result.pit_amount, -1) <> 0 THEN
      RAISE EXCEPTION 'Scenario <26 failed: expected pit_amount=0, got %', v_result.pit_amount;
    END IF;
  ELSE
    RAISE NOTICE 'SKIP: brak danych dla scenariusza <26.';
  END IF;

  -- Scenario 2: student >26, tax residence PL => PIT = 60.00 dla 1000 PLN (50%% KUP, 12%% PIT)
  v_case := NULL;
  SELECT c.id AS contract_id, m.id AS milestone_id, sp.user_id AS student_id
  INTO v_case
  FROM public.student_profiles sp
  JOIN public.contracts c ON c.student_id = sp.user_id
  JOIN public.milestones m ON m.contract_id = c.id
  WHERE COALESCE(sp.pit_exemption_u26, false) = false
    AND COALESCE(sp.tax_residence_pl, true) = true
  ORDER BY m.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_case.contract_id IS NOT NULL THEN
    SELECT *
    INTO v_result
    FROM public.calculate_pit_withholding(v_case.milestone_id, v_case.contract_id, v_case.student_id, v_amount);

    IF COALESCE(v_result.pit_amount, -1) <> 60 THEN
      RAISE EXCEPTION 'Scenario >26 PL failed: expected pit_amount=60, got %', v_result.pit_amount;
    END IF;
  ELSE
    RAISE NOTICE 'SKIP: brak danych dla scenariusza >26 PL.';
  END IF;

  -- Scenario 3: student zagraniczny (tax_residence_pl = false)
  -- Current production logic does NOT branch on residence and still applies 12%% PIT (unless U26 exemption).
  v_case := NULL;
  SELECT c.id AS contract_id, m.id AS milestone_id, sp.user_id AS student_id
  INTO v_case
  FROM public.student_profiles sp
  JOIN public.contracts c ON c.student_id = sp.user_id
  JOIN public.milestones m ON m.contract_id = c.id
  WHERE COALESCE(sp.tax_residence_pl, true) = false
    AND COALESCE(sp.pit_exemption_u26, false) = false
  ORDER BY m.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_case.contract_id IS NOT NULL THEN
    SELECT *
    INTO v_result
    FROM public.calculate_pit_withholding(v_case.milestone_id, v_case.contract_id, v_case.student_id, v_amount);

    IF COALESCE(v_result.pit_amount, -1) <> 60 THEN
      RAISE EXCEPTION 'Scenario foreign failed: expected pit_amount=60 in current logic, got %', v_result.pit_amount;
    END IF;
  ELSE
    RAISE NOTICE 'SKIP: brak danych dla scenariusza zagranicznego.';
  END IF;
END
$$;

ROLLBACK;
