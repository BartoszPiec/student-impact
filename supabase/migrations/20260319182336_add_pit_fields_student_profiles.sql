
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS tax_residence_pl    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS birth_date          DATE,
  ADD COLUMN IF NOT EXISTS pesel               TEXT,
  ADD COLUMN IF NOT EXISTS pit_exemption_u26   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pit_exemption_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS age_confirmed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_consent_url  TEXT;

COMMENT ON COLUMN public.student_profiles.tax_residence_pl IS 'true = rezydent PL, platforma odprowadza PIT (art. 41 ustawy o PIT)';
COMMENT ON COLUMN public.student_profiles.pit_exemption_u26 IS 'Ulga dla mlodych do 26 lat - tylko umowa zlecenia, wymaga dokumentu';
COMMENT ON COLUMN public.student_profiles.pesel IS 'Wymagany do wystawienia PIT-11';
COMMENT ON COLUMN public.student_profiles.parent_consent_url IS 'Wymagany gdy wiek 16-17 lat (skan zgody rodzica)';
;
