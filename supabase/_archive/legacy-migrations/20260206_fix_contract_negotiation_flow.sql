-- ========================================
-- MIGRACJA: Naprawa flow negocjacji milestones
-- Data: 2026-02-06
-- Cel: Kontrakty z aplikacji powinny zaczynać w stanie 'draft'
--      i czekać na negocjację milestones przez studenta
-- ========================================

BEGIN;

-- 1. Kontrakty z aplikacji które nie mają jeszcze płatności
--    i nie mają draftu → ustaw na 'draft' żeby wymusić negocjację
UPDATE public.contracts c
SET
  terms_status = 'draft',
  status = 'draft',
  updated_at = now()
WHERE c.source_type = 'application'
  AND c.status = 'awaiting_funding'
  -- Nie ma jeszcze draftu negocjacyjnego
  AND NOT EXISTS (
    SELECT 1 FROM public.milestone_drafts md WHERE md.contract_id = c.id
  )
  -- Żaden milestone nie jest jeszcze opłacony/w realizacji
  AND NOT EXISTS (
    SELECT 1 FROM public.milestones m
    WHERE m.contract_id = c.id
    AND m.status IN ('funded', 'in_progress', 'delivered', 'released', 'accepted')
  );

-- 2. Inicjalizuj drafty dla kontraktów które ich nie mają
INSERT INTO public.milestone_drafts (contract_id, agreed_total_minor, state, created_at, updated_at)
SELECT
  c.id,
  (c.total_amount * 100)::bigint,
  'STUDENT_EDITING',
  now(),
  now()
FROM public.contracts c
WHERE c.source_type = 'application'
  AND c.terms_status = 'draft'
  AND NOT EXISTS (
    SELECT 1 FROM public.milestone_drafts md WHERE md.contract_id = c.id
  );

-- 3. Usuń automatyczne milestones dla kontraktów w fazie negocjacji
--    (student zdefiniuje je przez system drafts)
DELETE FROM public.milestones m
WHERE EXISTS (
  SELECT 1 FROM public.contracts c
  WHERE c.id = m.contract_id
    AND c.source_type = 'application'
    AND c.terms_status = 'draft'
    AND c.status = 'draft'
);

-- 4. Zlecenia systemowe (service_orders) - upewnij się że mają terms_status = 'agreed'
--    bo pomijają negocjację
UPDATE public.contracts
SET
  terms_status = 'agreed',
  updated_at = now()
WHERE source_type = 'service_order'
  AND (terms_status IS NULL OR terms_status != 'agreed');

-- 5. KRYTYCZNE: Kontrakty które są już w realizacji (active, delivered, completed)
--    ale mają terms_status != 'agreed' → napraw je
UPDATE public.contracts c
SET
  terms_status = 'agreed',
  updated_at = now()
WHERE c.status IN ('awaiting_funding', 'active', 'delivered', 'completed')
  AND (c.terms_status IS NULL OR c.terms_status != 'agreed')
  AND EXISTS (
    SELECT 1 FROM public.milestones m WHERE m.contract_id = c.id
  );

-- 6. Popraw funkcję ensure_contract_for_application
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

  IF v_app.status <> 'accepted' THEN
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

  -- ZMIANA: status = 'draft', terms_status = 'draft'
  -- Kontrakt czeka na negocjację milestones przez studenta
  INSERT INTO public.contracts(
    source_type, application_id, company_id, student_id,
    currency, total_amount, status, terms_status
  )
  VALUES (
    'application', p_application_id, v_company_id, v_app.student_id,
    'PLN', v_amount, 'draft', 'draft'
  )
  RETURNING id INTO v_contract_id;

  -- USUNIĘTO: automatyczny milestone
  -- Student zdefiniuje milestones przez system negocjacji (milestone_drafts)

  -- Inicjalizuj draft negocjacyjny
  PERFORM public.draft_initialize(v_contract_id, (v_amount * 100)::bigint);

  UPDATE public.applications SET contract_id = v_contract_id
    WHERE id = p_application_id;

  PERFORM public._audit('contract', v_contract_id, 'created_from_application', jsonb_build_object('application_id', p_application_id), auth.uid());

  RETURN v_contract_id;
END;
$$;

-- 6. Popraw funkcję ensure_contract_for_service_order (dodaj terms_status = 'agreed')
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
BEGIN
  IF p_service_order_id IS NULL THEN
    RAISE EXCEPTION 'missing_service_order_id';
  END IF;

  -- If table doesn't exist, hard fail with clear message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='service_orders'
  ) THEN
    RAISE EXCEPTION 'service_orders_table_missing';
  END IF;

  EXECUTE format($q$
    SELECT id, company_id, student_id, amount, status, contract_id
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

  -- ZMIANA: dodano terms_status = 'agreed' - zlecenia systemowe pomijają negocjację
  INSERT INTO public.contracts(
    source_type, service_order_id, company_id, student_id,
    currency, total_amount, status, terms_status
  )
  VALUES (
    'service_order', p_service_order_id, v_order.company_id, v_order.student_id,
    'PLN', COALESCE(v_order.amount, 0), 'awaiting_funding', 'agreed'
  )
  RETURNING id INTO v_contract_id;

  INSERT INTO public.milestones(contract_id, idx, title, amount, status)
  VALUES (v_contract_id, 1, 'Realizacja zamówienia', COALESCE(v_order.amount,0), 'awaiting_funding');

  EXECUTE format($q$
    UPDATE public.service_orders
    SET contract_id = %L
    WHERE id = %L
  $q$, v_contract_id, p_service_order_id);

  PERFORM public._audit('contract', v_contract_id, 'created_from_service_order', jsonb_build_object('service_order_id', p_service_order_id), auth.uid());

  RETURN v_contract_id;
END;
$$;

COMMIT;
