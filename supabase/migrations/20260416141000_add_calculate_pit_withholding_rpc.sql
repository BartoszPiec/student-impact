-- 20260416141000_add_calculate_pit_withholding_rpc.sql
-- Restores canonical PIT withholding RPC in migrations (was present in DB only).

CREATE OR REPLACE FUNCTION public.calculate_pit_withholding(
  p_milestone_id uuid,
  p_contract_id uuid,
  p_student_id uuid,
  p_amount_gross numeric
)
RETURNS TABLE(
  id uuid,
  amount_gross numeric,
  kup_rate numeric,
  taxable_base numeric,
  pit_rate numeric,
  pit_amount numeric,
  amount_net numeric,
  amount_gross_minor bigint,
  taxable_base_minor bigint,
  pit_amount_minor bigint,
  amount_net_minor bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_kup_rate    NUMERIC := 0.50;   -- 50% KUP dla umowy o dzielo tworczego
  v_pit_rate    NUMERIC := 0.12;   -- Aktualna logika prod: staly PIT 12%
  v_taxable     NUMERIC;
  v_pit         NUMERIC;
  v_net         NUMERIC;
  v_id          UUID;
  v_tax_period  TEXT;
  v_exemption   BOOLEAN := false;
  v_amount_gross_minor bigint;
  v_taxable_minor      bigint;
  v_pit_minor          bigint;
  v_net_minor          bigint;
BEGIN
  -- Sprawdz ulge dla mlodych (pit_exemption_u26)
  SELECT COALESCE(pit_exemption_u26, false)
    INTO v_exemption
  FROM public.student_profiles
  WHERE user_id = p_student_id;

  -- Oblicz podstawe opodatkowania z 50% KUP
  v_taxable := ROUND(p_amount_gross * (1 - v_kup_rate), 2);

  -- Oblicz zaliczke PIT
  IF v_exemption THEN
    v_pit := 0;
  ELSE
    v_pit := ROUND(v_taxable * v_pit_rate, 2);
  END IF;

  v_net        := p_amount_gross - v_pit;
  v_tax_period := TO_CHAR(NOW(), 'YYYY-MM');

  -- Kwoty minor (grosze)
  v_amount_gross_minor := (p_amount_gross * 100)::bigint;
  v_taxable_minor      := (v_taxable * 100)::bigint;
  v_pit_minor          := (v_pit * 100)::bigint;
  v_net_minor          := (v_net * 100)::bigint;

  INSERT INTO public.pit_withholdings (
    contract_id,
    milestone_id,
    student_id,
    amount_gross,
    kup_rate,
    taxable_base,
    pit_rate,
    pit_amount,
    amount_net,
    amount_gross_minor,
    taxable_base_minor,
    pit_amount_minor,
    amount_net_minor,
    status,
    tax_period
  ) VALUES (
    p_contract_id,
    p_milestone_id,
    p_student_id,
    p_amount_gross,
    v_kup_rate,
    v_taxable,
    v_pit_rate,
    v_pit,
    v_net,
    v_amount_gross_minor,
    v_taxable_minor,
    v_pit_minor,
    v_net_minor,
    'pending',
    v_tax_period
  )
  RETURNING public.pit_withholdings.id INTO v_id;

  RETURN QUERY SELECT
    v_id,
    p_amount_gross,
    v_kup_rate,
    v_taxable,
    v_pit_rate,
    v_pit,
    v_net,
    v_amount_gross_minor,
    v_taxable_minor,
    v_pit_minor,
    v_net_minor;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric) TO service_role;
