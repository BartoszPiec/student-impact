BEGIN;

CREATE OR REPLACE FUNCTION public.assign_service_order_student_locked(
  p_order_id uuid,
  p_company_id uuid,
  p_student_id uuid,
  p_max_active_orders integer DEFAULT 1,
  p_preferred_status text DEFAULT 'pending_student_confirmation',
  p_fallback_status text DEFAULT 'pending'
)
RETURNS TABLE (
  order_id uuid,
  applied_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.service_orders%ROWTYPE;
  v_active_orders integer := 0;
BEGIN
  SELECT *
  INTO v_order
  FROM public.service_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono zamowienia.';
  END IF;

  IF v_order.company_id <> p_company_id THEN
    RAISE EXCEPTION 'Nie masz uprawnien do tego zamowienia.';
  END IF;

  IF v_order.student_id IS NOT NULL THEN
    RAISE EXCEPTION 'Do tego zamowienia student jest juz przypisany.';
  END IF;

  IF v_order.status NOT IN ('pending_selection', 'pending') THEN
    RAISE EXCEPTION 'To zamowienie nie jest juz na etapie wyboru studenta.';
  END IF;

  PERFORM 1
  FROM public.student_profiles
  WHERE user_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono profilu studenta.';
  END IF;

  SELECT COUNT(*)::int
  INTO v_active_orders
  FROM public.service_orders
  WHERE student_id = p_student_id
    AND status IN ('active', 'in_progress', 'pending_student_confirmation', 'pending_confirmation');

  IF v_active_orders >= GREATEST(COALESCE(p_max_active_orders, 1), 1) THEN
    RAISE EXCEPTION 'Ten student osiagnal limit aktywnych zlecen. Wybierz innego.';
  END IF;

  BEGIN
    UPDATE public.service_orders
    SET
      student_id = p_student_id,
      status = p_preferred_status,
      student_selection_mode = 'company_choice',
      student_selected_at = NOW()
    WHERE id = p_order_id
      AND company_id = p_company_id
      AND student_id IS NULL
    RETURNING id, status INTO order_id, applied_status;
  EXCEPTION WHEN check_violation THEN
    UPDATE public.service_orders
    SET
      student_id = p_student_id,
      status = p_fallback_status,
      student_selection_mode = 'company_choice',
      student_selected_at = NOW()
    WHERE id = p_order_id
      AND company_id = p_company_id
      AND student_id IS NULL
    RETURNING id, status INTO order_id, applied_status;
  END;

  IF order_id IS NULL THEN
    RAISE EXCEPTION 'Nie udalo sie przypisac studenta.';
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_service_order_student_locked(uuid, uuid, uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_service_order_student_locked(uuid, uuid, uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_service_order_student_locked(uuid, uuid, uuid, integer, text, text) TO service_role;

COMMIT;
