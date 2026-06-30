-- Drop ALL variations of the function to clear ambiguity
DROP FUNCTION IF EXISTS public.contract_upsert_milestone_draft(uuid, uuid, text, numeric, timestamptz, jsonb);
DROP FUNCTION IF EXISTS public.contract_upsert_milestone_draft(uuid, uuid, text, numeric, timestamptz, text);

-- Recreate the single definitive version accepting TEXT for criteria (safest for RPC)
CREATE OR REPLACE FUNCTION public.contract_upsert_milestone_draft(
  p_contract_id uuid,
  p_milestone_id uuid, -- NULL for insert
  p_title text,
  p_amount numeric,
  p_due_at timestamptz DEFAULT NULL,
  p_criteria text DEFAULT '[]' -- Pass as text, cast to jsonb inside
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

  IF auth.uid() <> v_c.company_id AND auth.uid() <> v_c.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  v_new_version := v_c.terms_version;

  -- Bump version if modifying a frozen/proposed contract
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

  -- Upsert
  IF p_milestone_id IS NULL THEN
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
    UPDATE public.milestones
    SET title = p_title,
        amount = p_amount,
        due_at = p_due_at,
        acceptance_criteria = COALESCE(p_criteria::jsonb, '[]'::jsonb),
        terms_version = v_new_version,
        updated_by = auth.uid(),
        updated_at = now()
    WHERE id = p_milestone_id AND contract_id = p_contract_id;
    
    v_mid := p_milestone_id;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'milestone_not_found'; END IF;
  END IF;

  RETURN v_mid;
END;
$$;
