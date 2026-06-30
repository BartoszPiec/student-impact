-- Migration: Variable Commission Model v1
-- Created: 2026-03-25
-- Description: Adds per-offer, per-package, and per-contract commission rates and backfills existing data.

BEGIN;

CREATE OR REPLACE FUNCTION public.default_commission_rate(
  p_source_type text,
  p_offer_type text DEFAULT NULL,
  p_is_platform_service boolean DEFAULT false
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  IF COALESCE(p_is_platform_service, false) THEN
    RETURN 0.20;
  END IF;

  IF p_source_type = 'service_order' THEN
    RETURN 0.15;
  END IF;

  IF lower(COALESCE(p_offer_type, '')) LIKE '%micro%'
     OR lower(COALESCE(p_offer_type, '')) LIKE '%mikro%' THEN
    RETURN 0.15;
  END IF;

  RETURN 0.10;
END;
$function$;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,4);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'service_packages'
  ) THEN
    EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS commission_rate numeric(5,4)';
  END IF;
END $$;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,4);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'offers_commission_rate_check'
  ) THEN
    ALTER TABLE public.offers
      ADD CONSTRAINT offers_commission_rate_check
      CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 1));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contracts_commission_rate_check'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_commission_rate_check
      CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 1));
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'service_packages'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_packages_commission_rate_check'
  ) THEN
    EXECUTE '
      ALTER TABLE public.service_packages
      ADD CONSTRAINT service_packages_commission_rate_check
      CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 1))
    ';
  END IF;
END $$;

UPDATE public.offers
SET commission_rate = public.default_commission_rate(
  'application',
  typ,
  COALESCE(is_platform_service, false)
)
WHERE commission_rate IS NULL;

DO $$
DECLARE
  v_has_type boolean;
  v_has_is_system boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'service_packages'
  ) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_packages'
      AND column_name = 'type'
  ) INTO v_has_type;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_packages'
      AND column_name = 'is_system'
  ) INTO v_has_is_system;

  IF v_has_type AND v_has_is_system THEN
    EXECUTE $sql$
      UPDATE public.service_packages
      SET commission_rate = COALESCE(
        commission_rate,
        CASE
          WHEN COALESCE(is_system, false) OR type = 'platform_service' THEN 0.20
          ELSE 0.15
        END
      )
      WHERE commission_rate IS NULL
    $sql$;
  ELSIF v_has_type THEN
    EXECUTE $sql$
      UPDATE public.service_packages
      SET commission_rate = COALESCE(
        commission_rate,
        CASE
          WHEN type = 'platform_service' THEN 0.20
          ELSE 0.15
        END
      )
      WHERE commission_rate IS NULL
    $sql$;
  ELSIF v_has_is_system THEN
    EXECUTE $sql$
      UPDATE public.service_packages
      SET commission_rate = COALESCE(
        commission_rate,
        CASE
          WHEN COALESCE(is_system, false) THEN 0.20
          ELSE 0.15
        END
      )
      WHERE commission_rate IS NULL
    $sql$;
  ELSE
    EXECUTE $sql$
      UPDATE public.service_packages
      SET commission_rate = COALESCE(commission_rate, 0.15)
      WHERE commission_rate IS NULL
    $sql$;
  END IF;
END $$;

UPDATE public.contracts c
SET commission_rate = COALESCE(
  c.commission_rate,
  o.commission_rate,
  public.default_commission_rate('application', o.typ, COALESCE(o.is_platform_service, false))
)
FROM public.applications a
JOIN public.offers o ON o.id = a.offer_id
WHERE c.application_id = a.id
  AND c.commission_rate IS NULL;

DO $$
DECLARE
  v_has_type boolean;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'service_orders'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'service_packages'
  ) THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'service_packages'
        AND column_name = 'type'
    ) INTO v_has_type;

    IF v_has_type THEN
      EXECUTE $sql$
        UPDATE public.contracts c
        SET commission_rate = COALESCE(
          c.commission_rate,
          sp.commission_rate,
          public.default_commission_rate('service_order', NULL, sp.type = 'platform_service')
        )
        FROM public.service_orders so
        LEFT JOIN public.service_packages sp ON sp.id = so.package_id
        WHERE c.service_order_id = so.id
          AND c.commission_rate IS NULL
      $sql$;
    ELSE
      EXECUTE $sql$
        UPDATE public.contracts c
        SET commission_rate = COALESCE(
          c.commission_rate,
          sp.commission_rate,
          public.default_commission_rate('service_order', NULL, false)
        )
        FROM public.service_orders so
        LEFT JOIN public.service_packages sp ON sp.id = so.package_id
        WHERE c.service_order_id = so.id
          AND c.commission_rate IS NULL
      $sql$;
    END IF;
  END IF;
END $$;

UPDATE public.contracts
SET commission_rate = COALESCE(
  commission_rate,
  CASE
    WHEN source_type = 'service_order' THEN 0.15
    ELSE 0.10
  END
)
WHERE commission_rate IS NULL;

ALTER TABLE public.contracts
  ALTER COLUMN commission_rate SET NOT NULL;

COMMENT ON COLUMN public.offers.commission_rate IS 'Platform commission rate stored as decimal fraction (e.g. 0.15 = 15%)';
COMMENT ON COLUMN public.contracts.commission_rate IS 'Frozen commission rate copied onto the contract at creation time';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'service_packages'
  ) THEN
    EXECUTE '
      COMMENT ON COLUMN public.service_packages.commission_rate
      IS ''Default platform commission rate for orders created from this package''
    ';
  END IF;
END $$;

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

  SELECT o.company_id, o.stawka, o.typ, COALESCE(o.is_platform_service, false), o.commission_rate
    INTO v_company_id, v_amount, v_offer_type, v_is_platform_service, v_commission_rate
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
    UPDATE public.applications SET contract_id = v_contract_id
      WHERE id = p_application_id AND contract_id IS DISTINCT FROM v_contract_id;
    RETURN v_contract_id;
  END IF;

  v_amount := COALESCE(v_app.agreed_stawka, v_app.proposed_stawka, v_amount, 0);
  v_commission_rate := COALESCE(
    v_commission_rate,
    public.default_commission_rate('application', v_offer_type, v_is_platform_service)
  );

  INSERT INTO public.contracts(
    source_type, application_id, company_id, student_id,
    currency, total_amount, status, terms_status, commission_rate
  )
  VALUES (
    'application', p_application_id, v_company_id, v_app.student_id,
    'PLN', v_amount, 'draft', 'draft', v_commission_rate
  )
  RETURNING id INTO v_contract_id;

  PERFORM public.draft_initialize(v_contract_id, (v_amount * 100)::bigint);

  UPDATE public.applications SET contract_id = v_contract_id
    WHERE id = p_application_id;

  PERFORM public._audit(
    'contract',
    v_contract_id,
    'created_from_application',
    jsonb_build_object(
      'application_id', p_application_id,
      'commission_rate', v_commission_rate
    ),
    auth.uid()
  );

  RETURN v_contract_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_contract_for_service_order(
  p_service_order_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_contract_id uuid;
  v_commission_rate numeric;
BEGIN
  IF p_service_order_id IS NULL THEN
    RAISE EXCEPTION 'missing_service_order_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='service_orders'
  ) THEN
    RAISE EXCEPTION 'service_orders_table_missing';
  END IF;

  EXECUTE format($q$
    SELECT id, company_id, student_id, amount, status, contract_id, package_id
    FROM public.service_orders
    WHERE id = %L
    FOR UPDATE
  $q$, p_service_order_id)
  INTO v_order;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'service_order_not_found';
  END IF;

  IF v_order.student_id IS NULL THEN
    RAISE EXCEPTION 'service_order_missing_student';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> v_order.company_id AND auth.uid() <> v_order.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  IF v_order.contract_id IS NOT NULL THEN
    RETURN v_order.contract_id;
  END IF;

  SELECT c.id INTO v_contract_id
  FROM public.contracts c
  WHERE c.service_order_id = p_service_order_id
  LIMIT 1;

  IF v_contract_id IS NOT NULL THEN
    EXECUTE format($q$
      UPDATE public.service_orders
      SET contract_id = %L
      WHERE id = %L
    $q$, v_contract_id, p_service_order_id);
    RETURN v_contract_id;
  END IF;

  BEGIN
    SELECT sp.commission_rate
      INTO v_commission_rate
    FROM public.service_packages sp
    WHERE sp.id = v_order.package_id;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      v_commission_rate := NULL;
  END;

  v_commission_rate := COALESCE(
    v_commission_rate,
    public.default_commission_rate('service_order', NULL, true)
  );

  INSERT INTO public.contracts(
    source_type, service_order_id, company_id, student_id,
    currency, total_amount, status, terms_status, commission_rate
  )
  VALUES (
    'service_order', p_service_order_id, v_order.company_id, v_order.student_id,
    'PLN', COALESCE(v_order.amount, 0), 'awaiting_funding', 'agreed', v_commission_rate
  )
  RETURNING id INTO v_contract_id;

  INSERT INTO public.milestones(contract_id, idx, title, amount, status)
  VALUES (v_contract_id, 1, 'Realizacja zamowienia', COALESCE(v_order.amount,0), 'awaiting_funding');

  EXECUTE format($q$
    UPDATE public.service_orders
    SET contract_id = %L
    WHERE id = %L
  $q$, v_contract_id, p_service_order_id);

  PERFORM public._audit(
    'contract',
    v_contract_id,
    'created_from_service_order',
    jsonb_build_object(
      'service_order_id', p_service_order_id,
      'commission_rate', v_commission_rate
    ),
    auth.uid()
  );

  RETURN v_contract_id;
END;
$$;

COMMIT;
