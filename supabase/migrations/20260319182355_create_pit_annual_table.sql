
CREATE TABLE IF NOT EXISTS public.pit_annual (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES auth.users(id),
  tax_year      INTEGER NOT NULL,
  total_gross   NUMERIC NOT NULL DEFAULT 0,
  total_kup     NUMERIC NOT NULL DEFAULT 0,
  total_taxable NUMERIC NOT NULL DEFAULT 0,
  total_pit     NUMERIC NOT NULL DEFAULT 0,
  total_net     NUMERIC NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','generated','sent','confirmed')),
  generated_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  storage_path  TEXT,
  file_name     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, tax_year)
);

ALTER TABLE public.pit_annual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_pit_annual" ON public.pit_annual
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "student_view_own_pit_annual" ON public.pit_annual
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

ALTER TABLE public.pit_withholdings
  ADD CONSTRAINT fk_pit_withholdings_annual
  FOREIGN KEY (pit11_id) REFERENCES public.pit_annual(id);
;
