-- 1) Add columns to applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 2) Create the RPC function
CREATE OR REPLACE FUNCTION public.cancel_application(
  p_application_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contract_id UUID;
BEGIN
  -- Update application
  UPDATE public.applications
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = p_reason,
    decided_at = NOW()
  WHERE id = p_application_id;

  -- Get associated contract
  SELECT contract_id INTO v_contract_id FROM public.applications WHERE id = p_application_id;

  -- If contract exists, update its status
  IF v_contract_id IS NOT NULL THEN
    UPDATE public.contracts
    SET
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = v_contract_id;
  END IF;

  -- Also update related contract if linked the other way
  UPDATE public.contracts
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE application_id = p_application_id;
END;
$$;
;
