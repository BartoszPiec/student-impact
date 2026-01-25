-- Enable pgcrypto if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Redefine propose function with correct search_path
CREATE OR REPLACE FUNCTION public.contract_propose_terms(
  p_contract_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
-- IMPORTANT: Add extensions to search_path to find digest()
SET search_path = public, extensions
AS $$
DECLARE
  v_c record;
  v_terms_json jsonb;
  v_hash text;
BEGIN
  -- Lock Contract
  SELECT * INTO v_c FROM public.contracts WHERE id = p_contract_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'contract_not_found';
  END IF;

  -- Verify permissions
  IF auth.uid() <> v_c.company_id AND auth.uid() <> v_c.student_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  -- Collect Milestones (Draft)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'amount', m.amount,
      'due_at', m.due_at,
      'idx', m.idx,
      'criteria', m.acceptance_criteria
    ) ORDER BY m.idx ASC
  ) INTO v_terms_json
  FROM (
    SELECT *
    FROM public.milestones m
    WHERE m.contract_id = p_contract_id
  ) m;

  IF v_terms_json IS NULL THEN 
     v_terms_json := '[]'::jsonb; 
  END IF;

  -- NOW digest() SHOULD WORK
  v_hash := encode(digest(v_terms_json::text, 'sha256'), 'hex');

  -- Create Snapshot
  INSERT INTO public.contract_term_versions(
    contract_id, version, terms_json, sha256, status, proposed_by, created_at
  )
  VALUES (
    p_contract_id, v_c.terms_version, v_terms_json, v_hash, 'proposed', auth.uid(), now()
  )
  ON CONFLICT (contract_id, version) 
  DO UPDATE SET 
    terms_json = EXCLUDED.terms_json,
    sha256 = EXCLUDED.sha256,
    status = 'proposed',
    proposed_by = EXCLUDED.proposed_by,
    created_at = now();

  -- Update Contract Status with Auto-Approval for Proposer
  UPDATE public.contracts
  SET terms_status = 'proposed',
      proposed_by = auth.uid(),
      proposed_at = now(),
      company_approved_version = CASE WHEN company_id = auth.uid() THEN v_c.terms_version ELSE company_approved_version END,
      student_approved_version = CASE WHEN student_id = auth.uid() THEN v_c.terms_version ELSE student_approved_version END,
      updated_at = now()
  WHERE id = p_contract_id;
  
  -- NOTIFY System
  PERFORM public.create_notification(
    CASE WHEN auth.uid() = v_c.company_id THEN v_c.student_id ELSE v_c.company_id END,
    'terms_proposed',
    jsonb_build_object('contract_id', p_contract_id, 'version', v_c.terms_version)
  );

  RETURN v_c.terms_version;
END;
$$;
