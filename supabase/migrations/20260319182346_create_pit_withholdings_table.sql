
CREATE TABLE IF NOT EXISTS public.pit_withholdings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID NOT NULL REFERENCES public.contracts(id),
  milestone_id  UUID NOT NULL REFERENCES public.milestones(id),
  student_id    UUID NOT NULL REFERENCES auth.users(id),
  amount_gross  NUMERIC NOT NULL,
  kup_rate      NUMERIC NOT NULL DEFAULT 0.50,
  taxable_base  NUMERIC NOT NULL,
  pit_rate      NUMERIC NOT NULL DEFAULT 0.12,
  pit_amount    NUMERIC NOT NULL,
  amount_net    NUMERIC NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid','reported')),
  paid_to_us_at TIMESTAMPTZ,
  tax_period    TEXT,
  pit11_id      UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pit_withholdings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pit_w_student ON public.pit_withholdings(student_id);
CREATE INDEX IF NOT EXISTS idx_pit_w_period  ON public.pit_withholdings(tax_period);
CREATE INDEX IF NOT EXISTS idx_pit_w_status  ON public.pit_withholdings(status);

CREATE POLICY "admin_all_pit_withholdings" ON public.pit_withholdings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "student_view_own_pit" ON public.pit_withholdings
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());
;
