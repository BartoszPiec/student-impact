-- Refined Upsert Function to Support Both Parties Editing (Version Based)
CREATE OR REPLACE FUNCTION public.contract_upsert_milestone_draft(
  p_contract_id uuid,
  p_milestone_id uuid, -- NULL for insert
  p_title text,
  p_amount numeric,
  p_due_at timestamptz DEFAULT NULL,
  p_criteria text DEFAULT '[]' -- JSON string
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c record;
  v_mid uuid;
  v_new_version int;
BEGIN
  -- Lock Contract
  SELECT * INTO v_c FROM public.contracts WHERE id = p_contract_id FOR UPDATE;

  -- 1. Check Permissions
  IF auth.uid() <> v_c.company_id AND auth.uid() <> v_c.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  -- 2. Determine Version & Status
  v_new_version := v_c.terms_version;

  -- If status is NOT draft (e.g. proposed/agreed), bump version to start new draft
  -- This handles cases where user edits "Proposed" directly to create new draft
  IF v_c.terms_status IN ('agreed', 'proposed') THEN
     v_new_version := v_c.terms_version + 1;
     
     UPDATE public.contracts 
     SET terms_status = 'draft',
         terms_version = v_new_version,
         proposed_by = NULL,
         proposed_at = NULL,
         company_approved_version = NULL,
         student_approved_version = NULL,
         updated_at = now()
     WHERE id = p_contract_id;
  END IF;

  -- 3. Upsert Milestone
  IF p_milestone_id IS NULL THEN
    -- CREATE
    INSERT INTO public.milestones(
        contract_id, idx, title, amount, due_at, acceptance_criteria,
        status, terms_version, created_by, updated_by
    )
    VALUES (
        p_contract_id,
        (SELECT COALESCE(MAX(idx),0)+1 FROM public.milestones WHERE contract_id = p_contract_id),
        p_title, p_amount, p_due_at, COALESCE(p_criteria::jsonb, '[]'::jsonb),
        'draft', v_new_version, auth.uid(), auth.uid()
    )
    RETURNING id INTO v_mid;
  ELSE
    -- UPDATE
    UPDATE public.milestones
    SET title = p_title,
        amount = p_amount,
        due_at = p_due_at,
        acceptance_criteria = COALESCE(p_criteria::jsonb, '[]'::jsonb),
        terms_version = v_new_version, -- Sync version incase of bump
        updated_by = auth.uid(),
        updated_at = now()
    WHERE id = p_milestone_id AND contract_id = p_contract_id;
    
    v_mid := p_milestone_id;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'milestone_not_found'; END IF;
  END IF;

  RETURN v_mid;
END;
$$;

-- Redefine Bulk Update to be safe and update timestamps
CREATE OR REPLACE FUNCTION public.contract_update_milestones_bulk(
  p_contract_id uuid,
  p_updates jsonb -- Array of objects: [{ "id": "uuid", "amount": 123.45 }]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c record;
  v_item jsonb;
  v_milestone_id uuid;
  v_amount numeric;
BEGIN
  -- Lock Contract & Validate
  SELECT * INTO v_c FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'contract_not_found';
  END IF;

  IF v_c.terms_status <> 'draft' THEN
    RAISE EXCEPTION 'contract_not_draft';
  END IF;

  -- Verify permissions
  IF auth.uid() <> v_c.company_id AND auth.uid() <> v_c.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  -- Iterate updates
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_milestone_id := (v_item->>'id')::uuid;
    v_amount := (v_item->>'amount')::numeric;

    UPDATE public.milestones
    SET amount = v_amount,
        updated_by = auth.uid(), -- Mark who updated
        updated_at = now()
    WHERE id = v_milestone_id AND contract_id = p_contract_id;
  END LOOP;

  -- Update contract timestamp
  UPDATE public.contracts SET updated_at = now() WHERE id = p_contract_id;

END;
$$;
