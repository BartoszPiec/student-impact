
-- ============================================================
-- RPC: oblicz i zarejestruj zaliczkę PIT po akceptacji milestone
-- Wywołać po każdym uwolnieniu środków z escrow
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_pit_withholding(
  p_milestone_id UUID,
  p_contract_id  UUID,
  p_student_id   UUID,
  p_amount_gross NUMERIC  -- wynagrodzenie brutto studenta (po odjęciu prowizji platformy)
)
RETURNS TABLE (
  withholding_id UUID,
  amount_gross   NUMERIC,
  kup_rate       NUMERIC,
  taxable_base   NUMERIC,
  pit_rate       NUMERIC,
  pit_amount     NUMERIC,
  amount_net     NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kup_rate    NUMERIC := 0.50;   -- 50% KUP dla umowy o dzieło twórczej
  v_pit_rate    NUMERIC := 0.12;   -- 12% próg I (32% powyżej 120k zł/rok)
  v_taxable     NUMERIC;
  v_pit         NUMERIC;
  v_net         NUMERIC;
  v_id          UUID;
  v_tax_period  TEXT;
  v_exemption   BOOLEAN := false;
BEGIN
  -- Sprawdź ulgę dla młodych (pit_exemption_u26)
  SELECT COALESCE(pit_exemption_u26, false)
    INTO v_exemption
  FROM public.student_profiles
  WHERE user_id = p_student_id;

  -- Przy umowie o dzieło ulga u26 nie obowiązuje
  -- (tylko przy zleceniu) — zostawiamy v_exemption = false

  -- Oblicz podstawę opodatkowania z 50% KUP
  v_taxable := ROUND(p_amount_gross * (1 - v_kup_rate), 2);

  -- Oblicz zaliczkę PIT
  IF v_exemption THEN
    v_pit := 0;
  ELSE
    v_pit := ROUND(v_taxable * v_pit_rate, 2);
  END IF;

  v_net        := p_amount_gross - v_pit;
  v_tax_period := TO_CHAR(NOW(), 'YYYY-MM');

  -- Zapisz rekord
  INSERT INTO public.pit_withholdings (
    contract_id, milestone_id, student_id,
    amount_gross, kup_rate, taxable_base,
    pit_rate, pit_amount, amount_net,
    status, tax_period
  ) VALUES (
    p_contract_id, p_milestone_id, p_student_id,
    p_amount_gross, v_kup_rate, v_taxable,
    v_pit_rate, v_pit, v_net,
    'pending', v_tax_period
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT
    v_id,
    p_amount_gross,
    v_kup_rate,
    v_taxable,
    v_pit_rate,
    v_pit,
    v_net;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_pit_withholding TO authenticated;

-- ============================================================
-- RPC: podsumowanie roczne per student (do generowania PIT-11)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_pit_annual_summary(
  p_student_id UUID,
  p_tax_year   INTEGER
)
RETURNS TABLE (
  student_id    UUID,
  tax_year      INTEGER,
  total_gross   NUMERIC,
  total_kup     NUMERIC,
  total_taxable NUMERIC,
  total_pit     NUMERIC,
  total_net     NUMERIC,
  record_count  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_student_id,
    p_tax_year,
    COALESCE(SUM(pw.amount_gross),  0),
    COALESCE(SUM(pw.amount_gross * pw.kup_rate), 0),
    COALESCE(SUM(pw.taxable_base),  0),
    COALESCE(SUM(pw.pit_amount),    0),
    COALESCE(SUM(pw.amount_net),    0),
    COUNT(*)
  FROM public.pit_withholdings pw
  WHERE pw.student_id  = p_student_id
    AND EXTRACT(YEAR FROM pw.created_at) = p_tax_year;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pit_annual_summary TO authenticated;
;
