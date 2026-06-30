BEGIN;

-- System service orders use package/variant milestone templates instead of
-- an ad-hoc runtime milestone. This keeps escrow gated by concrete stages.
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS variant_key text;

CREATE TABLE IF NOT EXISTS public.service_package_milestone_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  variant_key text NULL,
  position integer NOT NULL DEFAULT 1 CHECK (position > 0),
  title text NOT NULL,
  acceptance_criteria text NOT NULL DEFAULT '',
  amount_percent numeric NOT NULL DEFAULT 100 CHECK (amount_percent > 0),
  due_days integer NULL CHECK (due_days IS NULL OR due_days >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS service_package_milestone_templates_default_uq
  ON public.service_package_milestone_templates (package_id, position)
  WHERE variant_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_package_milestone_templates_variant_uq
  ON public.service_package_milestone_templates (package_id, variant_key, position)
  WHERE variant_key IS NOT NULL;

ALTER TABLE public.service_package_milestone_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_package_milestone_templates_select_active" ON public.service_package_milestone_templates;
CREATE POLICY "service_package_milestone_templates_select_active"
  ON public.service_package_milestone_templates
  FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "service_package_milestone_templates_admin_all" ON public.service_package_milestone_templates;
CREATE POLICY "service_package_milestone_templates_admin_all"
  ON public.service_package_milestone_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Safe MVP defaults: every active system/platform package gets one template
-- unless a more detailed template already exists. Admin can split it later.
INSERT INTO public.service_package_milestone_templates (
  package_id,
  variant_key,
  position,
  title,
  acceptance_criteria,
  amount_percent,
  due_days
)
SELECT
  sp.id,
  NULL,
  1,
  'Realizacja pakietu',
  'Zakres i kryteria odbioru zgodne z wybranym pakietem oraz danymi zamowienia.',
  100,
  sp.delivery_time_days
FROM public.service_packages sp
WHERE COALESCE(sp.status, 'active') = 'active'
  AND (
    COALESCE(sp.type, '') = 'platform_service'
    OR COALESCE(sp.is_system, false) = true
    OR sp.student_id IS NULL
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_package_milestone_templates t
    WHERE t.package_id = sp.id
      AND t.variant_key IS NULL
  );

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
  v_template record;
  v_template_count integer := 0;
  v_template_index integer := 0;
  v_percent_total numeric := 0;
  v_allocated numeric := 0;
  v_amount numeric := 0;
BEGIN
  IF p_service_order_id IS NULL THEN
    RAISE EXCEPTION 'missing_service_order_id';
  END IF;

  SELECT
    so.id,
    so.company_id,
    so.student_id,
    so.amount,
    so.status,
    so.contract_id,
    so.package_id,
    so.variant_key
  INTO v_order
  FROM public.service_orders so
  WHERE so.id = p_service_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'service_order_not_found';
  END IF;

  IF v_order.student_id IS NULL THEN
    RAISE EXCEPTION 'service_order_missing_student';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> v_order.company_id AND auth.uid() <> v_order.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  v_contract_id := v_order.contract_id;

  IF v_contract_id IS NULL THEN
    SELECT c.id
      INTO v_contract_id
    FROM public.contracts c
    WHERE c.service_order_id = p_service_order_id
    LIMIT 1;
  END IF;

  IF v_contract_id IS NULL THEN
    BEGIN
      SELECT sp.commission_rate
        INTO v_commission_rate
      FROM public.service_packages sp
      WHERE sp.id = v_order.package_id;
    EXCEPTION
      WHEN undefined_column THEN
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
  END IF;

  UPDATE public.service_orders
  SET contract_id = v_contract_id
  WHERE id = p_service_order_id;

  IF NOT EXISTS (SELECT 1 FROM public.milestones m WHERE m.contract_id = v_contract_id) THEN
    SELECT COUNT(*), COALESCE(SUM(amount_percent), 0)
      INTO v_template_count, v_percent_total
    FROM public.service_package_milestone_templates t
    WHERE t.package_id = v_order.package_id
      AND t.active = true
      AND (
        (v_order.variant_key IS NOT NULL AND t.variant_key = v_order.variant_key)
        OR (
          t.variant_key IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM public.service_package_milestone_templates vt
            WHERE vt.package_id = v_order.package_id
              AND vt.active = true
              AND vt.variant_key = v_order.variant_key
          )
        )
      );

    IF v_template_count = 0 OR v_percent_total <= 0 THEN
      INSERT INTO public.milestones(contract_id, idx, title, amount, status, acceptance_criteria)
      VALUES (
        v_contract_id,
        1,
        'Realizacja pakietu',
        COALESCE(v_order.amount, 0),
        'awaiting_funding',
        'Zakres i kryteria odbioru zgodne z wybranym pakietem oraz danymi zamowienia.'
      );
    ELSE
      FOR v_template IN
        SELECT *
        FROM public.service_package_milestone_templates t
        WHERE t.package_id = v_order.package_id
          AND t.active = true
          AND (
            (v_order.variant_key IS NOT NULL AND t.variant_key = v_order.variant_key)
            OR (
              t.variant_key IS NULL
              AND NOT EXISTS (
                SELECT 1
                FROM public.service_package_milestone_templates vt
                WHERE vt.package_id = v_order.package_id
                  AND vt.active = true
                  AND vt.variant_key = v_order.variant_key
              )
            )
          )
        ORDER BY t.position
      LOOP
        v_template_index := v_template_index + 1;

        IF v_template_index = v_template_count THEN
          v_amount := COALESCE(v_order.amount, 0) - v_allocated;
        ELSE
          v_amount := ROUND((COALESCE(v_order.amount, 0) * v_template.amount_percent / v_percent_total)::numeric, 2);
          v_allocated := v_allocated + v_amount;
        END IF;

        INSERT INTO public.milestones(
          contract_id,
          idx,
          title,
          amount,
          due_at,
          status,
          acceptance_criteria
        )
        VALUES (
          v_contract_id,
          v_template.position,
          v_template.title,
          v_amount,
          CASE
            WHEN v_template.due_days IS NULL THEN NULL
            ELSE now() + make_interval(days => v_template.due_days)
          END,
          CASE WHEN v_template.position = 1 THEN 'awaiting_funding' ELSE 'draft' END,
          v_template.acceptance_criteria
        );
      END LOOP;
    END IF;
  END IF;

  PERFORM public._audit(
    'contract',
    v_contract_id,
    'created_from_service_order',
    jsonb_build_object(
      'service_order_id', p_service_order_id,
      'template_source', 'service_package_milestone_templates'
    ),
    auth.uid()
  );

  RETURN v_contract_id;
END;
$$;

COMMIT;
