-- ============================================================
-- Update Deliverables Schema to support Service Orders
-- ============================================================

-- 1. Modify Table Structure
ALTER TABLE public.deliverables
ADD COLUMN IF NOT EXISTS service_order_id uuid NULL REFERENCES public.service_orders(id) ON DELETE SET NULL;

ALTER TABLE public.deliverables
ALTER COLUMN application_id DROP NOT NULL;

-- 2. Add Constraint (Must have either App OR ServiceOrder)
ALTER TABLE public.deliverables
DROP CONSTRAINT IF EXISTS deliverables_source_check;

ALTER TABLE public.deliverables
ADD CONSTRAINT deliverables_source_check
CHECK (
  (application_id IS NOT NULL AND service_order_id IS NULL) OR
  (application_id IS NULL AND service_order_id IS NOT NULL)
);

-- 3. Update Policy (Select)
DROP POLICY IF EXISTS "deliverables_select_participants" ON public.deliverables;
CREATE POLICY "deliverables_select_participants"
ON public.deliverables
FOR SELECT
TO authenticated
USING (
  -- Participant in Contract
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = deliverables.contract_id
    AND (c.company_id = auth.uid() OR c.student_id = auth.uid())
  )
  OR
  -- Legacy fallback (App)
  (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.offers o ON o.id = a.offer_id
      WHERE a.id = deliverables.application_id
      AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
  ))
  OR
  -- Legacy fallback (ServiceOrder)
  (service_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = deliverables.service_order_id
      AND (so.student_id = auth.uid() OR so.company_id = auth.uid())
  ))
);

-- 4. Update RPC: submit_delivery (Generic)
-- Replaces/Wraps submit_application_delivery
CREATE OR REPLACE FUNCTION public.submit_delivery(
  p_source_id uuid, -- application_id OR service_order_id
  p_source_type text, -- 'application' or 'service_order'
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
  v_company_id uuid;
  v_student_id uuid;
  v_m record;
  v_deliverable_id uuid;
  v_auto interval := interval '8 days';
  v_app_id uuid := NULL;
  v_so_id uuid := NULL;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- RESOLVE SOURCE
  IF p_source_type = 'application' THEN
    v_app_id := p_source_id;
    SELECT student_id, (SELECT company_id FROM offers WHERE id = applications.offer_id)
    INTO v_student_id, v_company_id
    FROM public.applications WHERE id = v_app_id;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'application_not_found'; END IF;
    
    -- Ensure Contract
    v_contract_id := public.ensure_contract_for_application(v_app_id);

  ELSIF p_source_type = 'service_order' THEN
    v_so_id := p_source_id;
    SELECT student_id, company_id
    INTO v_student_id, v_company_id
    FROM public.service_orders WHERE id = v_so_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'service_order_not_found'; END IF;

    -- Ensure Contract
    v_contract_id := public.ensure_contract_for_service_order(v_so_id);
    
  ELSE
    RAISE EXCEPTION 'invalid_source_type';
  END IF;

  -- VALIDATE AUTH
  IF auth.uid() <> v_student_id THEN
    RAISE EXCEPTION 'only_student_can_submit';
  END IF;

  -- FIND FUNDED MILESTONE
  SELECT m.* INTO v_m
  FROM public.milestones m
  WHERE m.contract_id = v_contract_id
    AND m.status IN ('funded','in_progress','revision_requested')
  ORDER BY m.idx ASC
  LIMIT 1
  FOR UPDATE;

  IF v_m.id IS NULL THEN
    RAISE EXCEPTION 'no_funded_milestone';
  END IF;

  -- UPDATE STATES
  UPDATE public.milestones
  SET status = 'delivered', delivered_at = now(), auto_accept_at = now() + v_auto, updated_at = now()
  WHERE id = v_m.id;

  UPDATE public.contracts
  SET status = 'delivered', updated_at = now()
  WHERE id = v_contract_id AND status IN ('active','awaiting_funding','draft');

  -- INSERT DELIVERABLE
  INSERT INTO public.deliverables(
    application_id, service_order_id,
    student_id, company_id,
    files, description, status,
    contract_id, milestone_id, version
  )
  VALUES (
    v_app_id, v_so_id,
    v_student_id, v_company_id,
    COALESCE(p_files,'[]'::jsonb), NULLIF(trim(COALESCE(p_description,'')),''),
    'pending',
    v_contract_id, v_m.id, 1
  )
  RETURNING id INTO v_deliverable_id;

  -- UPDATE LEGACY STATUS
  IF v_app_id IS NOT NULL THEN
    UPDATE public.applications SET realization_status = 'delivered' WHERE id = v_app_id;
  END IF;
  
  -- Service Orders don't have 'realization_status' column usually, but 'status' check check constraint
  -- We keeping Service Order status as 'completed' only at end, or maybe 'delivered' if we added it?
  -- Check existing status constraint: ('inquiry', 'pending', 'proposal_sent', 'sent', 'countered', 'rejected', 'completed', 'cancelled', 'accepted')
  -- There is no 'delivered'. We assume 'accepted' (active) covers delivery phase until 'completed'.
  -- OR we can update it if we want. For now, leave as is.

  -- NOTIFY COMPANY
  PERFORM public.create_notification(
    v_company_id,
    'deliverable_new',
    jsonb_build_object(
      'source_id', p_source_id,
      'source_type', p_source_type,
      'deliverable_id', v_deliverable_id,
      'snippet', 'Otrzymałeś nowe pliki do realizacji.'
    )
  );

  RETURN v_deliverable_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_delivery(uuid, text, text, jsonb) TO authenticated;
