BEGIN;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS realization_mode text NOT NULL DEFAULT 'student_defined';

DO $$
BEGIN
  ALTER TABLE public.offers
    DROP CONSTRAINT IF EXISTS offers_realization_mode_check;

  ALTER TABLE public.offers
    ADD CONSTRAINT offers_realization_mode_check
    CHECK (realization_mode IN ('student_defined', 'company_defined'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS company_milestones jsonb;

DO $$
BEGIN
  ALTER TABLE public.offers
    DROP CONSTRAINT IF EXISTS offers_company_milestones_array_check;

  ALTER TABLE public.offers
    ADD CONSTRAINT offers_company_milestones_array_check
    CHECK (
      company_milestones IS NULL
      OR jsonb_typeof(company_milestones) = 'array'
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON COLUMN public.offers.realization_mode IS
  'Determines whether milestones are defined by the student after acceptance or pre-defined by the company.';

COMMENT ON COLUMN public.offers.company_milestones IS
  'Optional ordered list of pre-defined company milestones for micro offers. Stored as JSON array of {title, acceptance_criteria}.';

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
  v_offer_type text;
  v_is_platform_service boolean;
  v_commission_rate numeric;
  v_realization_mode text;
  v_company_milestones jsonb;
  v_milestone_item jsonb;
  v_milestone_count int := 0;
  v_milestone_position int := 0;
  v_milestone_amount numeric := 0;
BEGIN
  IF p_application_id IS NULL THEN
    RAISE EXCEPTION 'missing_application_id';
  END IF;

  SELECT a.id, a.status, a.offer_id, a.student_id,
         a.agreed_stawka, a.proposed_stawka, a.contract_id
    INTO v_app
  FROM public.applications a
  WHERE a.id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application_not_found';
  END IF;

  IF v_app.status <> 'accepted' THEN
    RAISE EXCEPTION 'application_not_accepted';
  END IF;

  SELECT
    o.company_id,
    o.stawka,
    o.typ,
    COALESCE(o.is_platform_service, false),
    o.commission_rate,
    COALESCE(o.realization_mode, 'student_defined'),
    o.company_milestones
  INTO
    v_company_id,
    v_amount,
    v_offer_type,
    v_is_platform_service,
    v_commission_rate,
    v_realization_mode,
    v_company_milestones
  FROM public.offers o
  WHERE o.id = v_app.offer_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_found';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> v_company_id AND auth.uid() <> v_app.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  IF v_app.contract_id IS NOT NULL THEN
    RETURN v_app.contract_id;
  END IF;

  SELECT c.id INTO v_contract_id
  FROM public.contracts c
  WHERE c.application_id = p_application_id
  LIMIT 1;

  IF v_contract_id IS NOT NULL THEN
    UPDATE public.applications
    SET contract_id = v_contract_id
    WHERE id = p_application_id
      AND contract_id IS DISTINCT FROM v_contract_id;

    RETURN v_contract_id;
  END IF;

  v_amount := COALESCE(v_app.agreed_stawka, v_app.proposed_stawka, v_amount, 0);
  v_commission_rate := COALESCE(
    v_commission_rate,
    public.default_commission_rate('application', v_offer_type, v_is_platform_service)
  );

  IF v_realization_mode = 'company_defined'
     AND v_offer_type = 'micro'
     AND jsonb_typeof(v_company_milestones) = 'array'
     AND jsonb_array_length(v_company_milestones) > 0 THEN

    v_milestone_count := jsonb_array_length(v_company_milestones);

    INSERT INTO public.contracts(
      source_type,
      application_id,
      company_id,
      student_id,
      currency,
      total_amount,
      status,
      terms_status,
      commission_rate
    )
    VALUES (
      'application',
      p_application_id,
      v_company_id,
      v_app.student_id,
      'PLN',
      v_amount,
      'draft',
      'agreed',
      v_commission_rate
    )
    RETURNING id INTO v_contract_id;

    UPDATE public.contracts
    SET
      company_approved_version = terms_version,
      student_approved_version = terms_version,
      updated_at = now()
    WHERE id = v_contract_id;

    FOR v_milestone_item IN
      SELECT value
      FROM jsonb_array_elements(v_company_milestones)
    LOOP
      v_milestone_position := v_milestone_position + 1;
      v_milestone_amount := CASE WHEN v_milestone_position = v_milestone_count THEN v_amount ELSE 0 END;

      INSERT INTO public.milestones(
        contract_id,
        idx,
        title,
        amount,
        status,
        acceptance_criteria
      )
      VALUES (
        v_contract_id,
        v_milestone_position,
        COALESCE(NULLIF(trim(v_milestone_item->>'title'), ''), 'Etap ' || v_milestone_position),
        v_milestone_amount,
        CASE WHEN v_milestone_position = 1 THEN 'awaiting_funding' ELSE 'draft' END,
        NULLIF(trim(v_milestone_item->>'acceptance_criteria'), '')
      );
    END LOOP;
  ELSE
    INSERT INTO public.contracts(
      source_type,
      application_id,
      company_id,
      student_id,
      currency,
      total_amount,
      status,
      terms_status,
      commission_rate
    )
    VALUES (
      'application',
      p_application_id,
      v_company_id,
      v_app.student_id,
      'PLN',
      v_amount,
      'draft',
      'draft',
      v_commission_rate
    )
    RETURNING id INTO v_contract_id;

    PERFORM public.draft_initialize(v_contract_id, (v_amount * 100)::bigint);
  END IF;

  UPDATE public.applications
  SET contract_id = v_contract_id
  WHERE id = p_application_id;

  PERFORM public._audit(
    'contract',
    v_contract_id,
    'created_from_application',
    jsonb_build_object(
      'application_id', p_application_id,
      'commission_rate', v_commission_rate,
      'realization_mode', v_realization_mode
    ),
    auth.uid()
  );

  RETURN v_contract_id;
END;
$$;

COMMIT;
