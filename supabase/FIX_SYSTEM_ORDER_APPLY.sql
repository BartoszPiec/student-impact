CREATE OR REPLACE FUNCTION public.ensure_contract_for_application(
  p_application_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app record;
  v_company_id uuid;
  v_contract_id uuid;
  v_amount numeric;
BEGIN
  IF p_application_id IS NULL THEN
    RAISE EXCEPTION 'missing_application_id';
  END IF;

  -- lock application row
  SELECT a.id, a.status, a.offer_id, a.student_id,
         a.agreed_stawka, a.proposed_stawka, a.contract_id
    INTO v_app
  FROM public.applications a
  WHERE a.id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application_not_found';
  END IF;

  -- ✅ ALLOW 'in_progress' for System Orders which are auto-accepted
  IF v_app.status NOT IN ('accepted', 'in_progress') THEN
    RAISE EXCEPTION 'application_not_accepted';
  END IF;

  SELECT o.company_id, o.stawka
    INTO v_company_id, v_amount
  FROM public.offers o
  WHERE o.id = v_app.offer_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_found';
  END IF;

  -- auth guard (skip if no auth context; e.g. server role)
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_company_id AND auth.uid() <> v_app.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  -- already linked?
  IF v_app.contract_id IS NOT NULL THEN
    RETURN v_app.contract_id;
  END IF;

  -- existing contract by application?
  SELECT c.id INTO v_contract_id
  FROM public.contracts c
  WHERE c.application_id = p_application_id
  LIMIT 1;

  IF v_contract_id IS NOT NULL THEN
    UPDATE public.applications SET contract_id = v_contract_id
      WHERE id = p_application_id AND contract_id IS DISTINCT FROM v_contract_id;
    RETURN v_contract_id;
  END IF;

  v_amount := COALESCE(v_app.agreed_stawka, v_app.proposed_stawka, v_amount, 0);

  INSERT INTO public.contracts(
    source_type, application_id, company_id, student_id,
    currency, total_amount, status
  )
  VALUES (
    'application', p_application_id, v_company_id, v_app.student_id,
    'PLN', v_amount, 'awaiting_funding'
  )
  RETURNING id INTO v_contract_id;

  -- milestone #1
  INSERT INTO public.milestones(
    contract_id, idx, title, amount, status
  )
  VALUES (
    v_contract_id, 1, 'Realizacja zlecenia', v_amount, 'awaiting_funding'
  );

  UPDATE public.applications SET contract_id = v_contract_id
    WHERE id = p_application_id;

  PERFORM public._audit('contract', v_contract_id, 'created_from_application', jsonb_build_object('application_id', p_application_id), auth.uid());

  RETURN v_contract_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_contract_for_application(uuid) TO authenticated;
