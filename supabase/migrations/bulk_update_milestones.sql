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

  -- Verify permissions (assuming only student/company logic, but strictly this is draft edit)
  -- The calling code checks "canEdit", defaulting to Student usually for now.
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
        updated_at = now()
    WHERE id = v_milestone_id AND contract_id = p_contract_id;
  END LOOP;

  -- Update contract timestamp
  UPDATE public.contracts SET updated_at = now() WHERE id = p_contract_id;

END;
$$;
