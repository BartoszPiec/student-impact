-- ============================================================
-- Student Impact - Escrow + Realization Guard (release)
-- Safe to run multiple times.
-- ============================================================

-- =========================
-- 1) CONTRACTS
-- =========================
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('application','service_order')),

  application_id uuid NULL REFERENCES public.applications(id) ON DELETE SET NULL,
  service_order_id uuid NULL REFERENCES public.service_orders(id) ON DELETE SET NULL,

  company_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  currency text NOT NULL DEFAULT 'PLN',
  total_amount numeric NOT NULL DEFAULT 0,

  status text NOT NULL CHECK (status IN (
    'draft','awaiting_funding','active','delivered','completed','cancelled','disputed'
  )) DEFAULT 'draft',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partial unique indexes (avoid duplicates per source)
CREATE UNIQUE INDEX IF NOT EXISTS contracts_application_uq
  ON public.contracts(application_id) WHERE application_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contracts_service_order_uq
  ON public.contracts(service_order_id) WHERE service_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS contracts_company_idx ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS contracts_student_idx ON public.contracts(student_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts_select_participants" ON public.contracts;
CREATE POLICY "contracts_select_participants"
ON public.contracts
FOR SELECT
TO authenticated
USING (auth.uid() = company_id OR auth.uid() = student_id);

-- No INSERT/UPDATE policies on purpose (writes go via RPC SECURITY DEFINER)


-- =========================
-- 2) MILESTONES
-- =========================
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  idx integer NOT NULL,

  title text NOT NULL,
  acceptance_criteria text,
  amount numeric NOT NULL CHECK (amount >= 0),
  due_at timestamptz,

  status text NOT NULL CHECK (status IN (
    'draft','awaiting_funding','funded','in_progress','delivered',
    'revision_requested','accepted','released','disputed','refunded'
  )) DEFAULT 'draft',

  funded_at timestamptz,
  delivered_at timestamptz,
  accepted_at timestamptz,
  auto_accept_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS milestones_contract_idx_uq
  ON public.milestones(contract_id, idx);

CREATE INDEX IF NOT EXISTS milestones_status_idx ON public.milestones(status);
CREATE INDEX IF NOT EXISTS milestones_auto_accept_idx ON public.milestones(auto_accept_at);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestones_select_participants" ON public.milestones;
CREATE POLICY "milestones_select_participants"
ON public.milestones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = milestones.contract_id
      AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);

-- No INSERT/UPDATE policies on purpose (writes go via RPC SECURITY DEFINER)


-- =========================
-- 3) OPTIONAL: PAYMENT INTENTS / PAYOUTS / DISPUTES / AUDIT LOG
-- =========================
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'manual',
  provider_intent_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'PLN',
  status text NOT NULL CHECK (status IN ('created','succeeded','failed','canceled')) DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_intents_select_participants" ON public.payment_intents;
CREATE POLICY "payment_intents_select_participants"
ON public.payment_intents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.milestones m
    JOIN public.contracts c ON c.id = m.contract_id
    WHERE m.id = payment_intents.milestone_id
      AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount_gross numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  amount_net numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','processing','paid','failed','reversed')) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payouts_select_participants" ON public.payouts;
CREATE POLICY "payouts_select_participants"
ON public.payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = payouts.contract_id
      AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('open','resolved')) DEFAULT 'open',
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "disputes_select_participants" ON public.disputes;
CREATE POLICY "disputes_select_participants"
ON public.disputes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.milestones m
    JOIN public.contracts c ON c.id = m.contract_id
    WHERE m.id = disputes.milestone_id
      AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_select_participants" ON public.audit_log;
-- MVP: admin-only możesz dodać później. Na teraz nie daję select policy.


-- =========================
-- 4) BRIDGE COLUMNS (safe, nullable)
-- =========================
DO $$
BEGIN
  -- applications.contract_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='contract_id'
  ) THEN
    ALTER TABLE public.applications
      ADD COLUMN contract_id uuid NULL REFERENCES public.contracts(id) ON DELETE SET NULL;
  END IF;

  -- service_orders.contract_id (only if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='service_orders'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_orders' AND column_name='contract_id'
    ) THEN
      ALTER TABLE public.service_orders
        ADD COLUMN contract_id uuid NULL REFERENCES public.contracts(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- deliverables link to contract/milestone
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='deliverables'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='deliverables' AND column_name='contract_id'
    ) THEN
      ALTER TABLE public.deliverables ADD COLUMN contract_id uuid NULL REFERENCES public.contracts(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='deliverables' AND column_name='milestone_id'
    ) THEN
      ALTER TABLE public.deliverables ADD COLUMN milestone_id uuid NULL REFERENCES public.milestones(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='deliverables' AND column_name='version'
    ) THEN
      ALTER TABLE public.deliverables ADD COLUMN version integer NOT NULL DEFAULT 1;
    END IF;
  END IF;
END $$;


-- =========================
-- 5) RPC HELPERS
-- =========================
CREATE OR REPLACE FUNCTION public._audit(
  p_entity_type text,
  p_entity_id uuid,
  p_event text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_actor_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log(entity_type, entity_id, actor_id, event, payload)
  VALUES (p_entity_type, p_entity_id, p_actor_id, p_event, COALESCE(p_payload,'{}'::jsonb));
END;
$$;

-- no GRANT needed (internal)


-- =========================
-- 6) RPC: ensure_contract_for_application
-- =========================
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


-- =========================
-- 7) RPC: ensure_contract_for_service_order
-- =========================
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

  INSERT INTO public.contracts(
    source_type, service_order_id, company_id, student_id,
    currency, total_amount, status
  )
  VALUES (
    'service_order', p_service_order_id, v_order.company_id, v_order.student_id,
    'PLN', COALESCE(v_order.amount, 0), 'awaiting_funding'
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

GRANT EXECUTE ON FUNCTION public.ensure_contract_for_service_order(uuid) TO authenticated;


-- =========================
-- 8) RPC: get_contract_summary_for_application
-- =========================
CREATE OR REPLACE FUNCTION public.get_contract_summary_for_application(
  p_application_id uuid
)
RETURNS TABLE (
  contract_id uuid,
  contract_status text,
  active_milestone_id uuid,
  active_milestone_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS contract_id,
    c.status AS contract_status,
    m.id AS active_milestone_id,
    m.status AS active_milestone_status
  FROM public.contracts c
  LEFT JOIN LATERAL (
    SELECT m2.*
    FROM public.milestones m2
    WHERE m2.contract_id = c.id
      AND m2.status IN ('awaiting_funding','funded','in_progress','revision_requested','delivered')
    ORDER BY m2.idx ASC
    LIMIT 1
  ) m ON TRUE
  WHERE c.application_id = p_application_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_contract_summary_for_application(uuid) TO authenticated;


-- =========================
-- 9) RPC: company_mark_milestone_funded (MVP manual)
-- =========================
CREATE OR REPLACE FUNCTION public.company_mark_milestone_funded(
  p_milestone_id uuid,
  p_provider text DEFAULT 'manual',
  p_provider_intent_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_m record;
  v_c record;
BEGIN
  SELECT m.id, m.contract_id, m.status, m.amount
    INTO v_m
  FROM public.milestones m
  WHERE m.id = p_milestone_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'milestone_not_found';
  END IF;

  SELECT c.id, c.company_id, c.student_id, c.status, c.currency
    INTO v_c
  FROM public.contracts c
  WHERE c.id = v_m.contract_id
  FOR UPDATE;

  IF auth.uid() IS NULL OR auth.uid() <> v_c.company_id THEN
    RAISE EXCEPTION 'only_company_can_fund';
  END IF;

  IF v_m.status NOT IN ('awaiting_funding','draft') THEN
    RAISE EXCEPTION 'milestone_not_fundable';
  END IF;

  UPDATE public.milestones
  SET status = 'funded',
      funded_at = now(),
      updated_at = now()
  WHERE id = p_milestone_id;

  INSERT INTO public.payment_intents(milestone_id, provider, provider_intent_id, amount, currency, status, confirmed_at)
  VALUES (p_milestone_id, COALESCE(p_provider,'manual'), p_provider_intent_id, v_m.amount, v_c.currency, 'succeeded', now());

  UPDATE public.contracts
  SET status = 'active',
      updated_at = now()
  WHERE id = v_c.id
    AND status IN ('draft','awaiting_funding');

  -- notify student
  PERFORM public.create_notification(
    v_c.student_id,
    'escrow_funded',
    jsonb_build_object('milestone_id', p_milestone_id, 'contract_id', v_c.id)
  );

  PERFORM public._audit('milestone', p_milestone_id, 'funded', jsonb_build_object('provider', p_provider), auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.company_mark_milestone_funded(uuid, text, text) TO authenticated;


-- =========================
-- 10) RPC: submit_application_delivery (bridges to existing deliverables UI)
-- =========================
CREATE OR REPLACE FUNCTION public.submit_application_delivery(
  p_application_id uuid,
  p_description text,
  p_files jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id uuid;
  v_app record;
  v_company_id uuid;
  v_m record;
  v_deliverable_id uuid;
  v_auto interval := interval '8 days';
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Get application + validate student
  SELECT a.id, a.student_id, a.offer_id
    INTO v_app
  FROM public.applications a
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application_not_found';
  END IF;

  IF auth.uid() <> v_app.student_id THEN
    RAISE EXCEPTION 'only_student_can_submit';
  END IF;

  SELECT o.company_id INTO v_company_id
  FROM public.offers o
  WHERE o.id = v_app.offer_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_found';
  END IF;

  -- Ensure contract exists (requires accepted application)
  v_contract_id := public.ensure_contract_for_application(p_application_id);

  -- Pick active milestone
  SELECT m.*
    INTO v_m
  FROM public.milestones m
  WHERE m.contract_id = v_contract_id
    AND m.status IN ('funded','in_progress','revision_requested')
  ORDER BY m.idx ASC
  LIMIT 1
  FOR UPDATE;

  IF v_m.id IS NULL THEN
    RAISE EXCEPTION 'no_funded_milestone';
  END IF;

  -- Move to delivered + set auto_accept
  UPDATE public.milestones
  SET status = 'delivered',
      delivered_at = now(),
      auto_accept_at = now() + v_auto,
      updated_at = now()
  WHERE id = v_m.id;

  UPDATE public.contracts
  SET status = 'delivered',
      updated_at = now()
  WHERE id = v_contract_id
    AND status IN ('active','awaiting_funding','draft');

  -- Insert deliverable (existing table)
  INSERT INTO public.deliverables(
    application_id, student_id, company_id,
    files, description, status,
    contract_id, milestone_id, version,
    created_at, updated_at
  )
  VALUES (
    p_application_id, v_app.student_id, v_company_id,
    COALESCE(p_files,'[]'::jsonb), NULLIF(trim(COALESCE(p_description,'')),''),
    'pending',
    v_contract_id, v_m.id, 1,
    now(), now()
  )
  RETURNING id INTO v_deliverable_id;

  -- keep your existing workspace badge logic
  UPDATE public.applications
  SET realization_status = 'delivered'
  WHERE id = p_application_id;

  -- notify company
  PERFORM public.create_notification(
    v_company_id,
    'deliverable_new',
    jsonb_build_object(
      'application_id', p_application_id,
      'deliverable_id', v_deliverable_id,
      'contract_id', v_contract_id,
      'milestone_id', v_m.id,
      'snippet', 'Otrzymałeś nowe pliki do realizacji.'
    )
  );

  PERFORM public._audit('deliverable', v_deliverable_id, 'submitted', jsonb_build_object('application_id', p_application_id), auth.uid());

  RETURN v_deliverable_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_application_delivery(uuid, text, jsonb) TO authenticated;


-- =========================
-- 11) RPC: review_deliverable_and_progress
-- =========================
CREATE OR REPLACE FUNCTION public.review_deliverable_and_progress(
  p_deliverable_id uuid,
  p_decision text,
  p_feedback text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_d record;
  v_c record;
  v_fee numeric := 0; -- MVP: 0, możesz później policzyć prowizję
  v_net numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT d.*
    INTO v_d
  FROM public.deliverables d
  WHERE d.id = p_deliverable_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'deliverable_not_found';
  END IF;

  IF auth.uid() <> v_d.company_id THEN
    RAISE EXCEPTION 'only_company_can_review';
  END IF;

  IF v_d.milestone_id IS NULL OR v_d.contract_id IS NULL THEN
    -- Legacy deliverable without milestone linking
    -- Keep old behavior: update status + application realization_status
    UPDATE public.deliverables
    SET status = CASE WHEN p_decision='accepted' THEN 'accepted' ELSE 'rejected' END,
        company_feedback = p_feedback,
        updated_at = now()
    WHERE id = p_deliverable_id;

    IF p_decision = 'accepted' THEN
      UPDATE public.applications SET realization_status='completed' WHERE id = v_d.application_id;
    ELSE
      UPDATE public.applications SET realization_status='in_progress' WHERE id = v_d.application_id;
    END IF;

    RETURN;
  END IF;

  SELECT c.*
    INTO v_c
  FROM public.contracts c
  WHERE c.id = v_d.contract_id
  FOR UPDATE;

  -- Update deliverable status
  UPDATE public.deliverables
  SET status = CASE WHEN p_decision='accepted' THEN 'accepted' ELSE 'rejected' END,
      company_feedback = p_feedback,
      updated_at = now()
  WHERE id = p_deliverable_id;

  IF p_decision = 'accepted' THEN
    -- milestone accepted -> released
    UPDATE public.milestones
    SET status = 'released',
        accepted_at = now(),
        updated_at = now()
    WHERE id = v_d.milestone_id
      AND status = 'delivered';

    v_net := GREATEST(v_c.total_amount - v_fee, 0);

    INSERT INTO public.payouts(milestone_id, contract_id, amount_gross, platform_fee, amount_net, status)
    VALUES (v_d.milestone_id, v_c.id, v_c.total_amount, v_fee, v_net, 'pending');

    UPDATE public.applications
    SET realization_status = 'completed'
    WHERE id = v_d.application_id;

    UPDATE public.contracts
    SET status = 'completed',
        updated_at = now()
    WHERE id = v_c.id;

    PERFORM public.create_notification(
      v_d.student_id,
      'deliverable_accepted',
      jsonb_build_object('application_id', v_d.application_id, 'deliverable_id', v_d.id)
    );

    PERFORM public._audit('milestone', v_d.milestone_id, 'released', jsonb_build_object('deliverable_id', v_d.id), auth.uid());

  ELSE
    -- revision requested
    UPDATE public.milestones
    SET status = 'revision_requested',
        updated_at = now()
    WHERE id = v_d.milestone_id
      AND status = 'delivered';

    UPDATE public.applications
    SET realization_status = 'in_progress'
    WHERE id = v_d.application_id;

    UPDATE public.contracts
    SET status = 'active',
        updated_at = now()
    WHERE id = v_c.id;

    PERFORM public.create_notification(
      v_d.student_id,
      'deliverable_rejected',
      jsonb_build_object('application_id', v_d.application_id, 'deliverable_id', v_d.id)
    );

    PERFORM public._audit('milestone', v_d.milestone_id, 'revision_requested', jsonb_build_object('deliverable_id', v_d.id), auth.uid());
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_deliverable_and_progress(uuid, text, text) TO authenticated;


-- =========================
-- 12) RPC: auto_accept_due_milestones
-- =========================
CREATE OR REPLACE FUNCTION public.auto_accept_due_milestones(
  p_limit int DEFAULT 100
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  r record;
BEGIN
  FOR r IN
    SELECT m.id AS milestone_id, m.contract_id
    FROM public.milestones m
    WHERE m.status = 'delivered'
      AND m.auto_accept_at IS NOT NULL
      AND m.auto_accept_at <= now()
    ORDER BY m.auto_accept_at ASC
    LIMIT p_limit
  LOOP
    -- accept + release
    UPDATE public.milestones
    SET status = 'released',
        accepted_at = now(),
        updated_at = now()
    WHERE id = r.milestone_id
      AND status = 'delivered';

    -- accept latest pending deliverable for this milestone if any
    UPDATE public.deliverables d
    SET status = 'accepted',
        company_feedback = COALESCE(d.company_feedback,'') || CASE WHEN d.company_feedback IS NULL THEN '' ELSE E'\n' END || 'Auto-accept (timeout).',
        updated_at = now()
    WHERE d.milestone_id = r.milestone_id
      AND d.status = 'pending'
      AND d.id = (
        SELECT d2.id FROM public.deliverables d2
        WHERE d2.milestone_id = r.milestone_id
        ORDER BY d2.created_at DESC
        LIMIT 1
      );

    UPDATE public.contracts
    SET status = 'completed',
        updated_at = now()
    WHERE id = r.contract_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
