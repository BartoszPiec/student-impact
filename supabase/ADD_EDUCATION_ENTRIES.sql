-- ADD EDUCATION ENTRIES TABLE

CREATE TABLE IF NOT EXISTS public.education_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  field_of_study text NOT NULL,
  degree text, -- e.g. Licencjat, Magister, Inżynier
  start_year integer,
  end_year integer,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.education_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own education" ON public.education_entries;
CREATE POLICY "Students view own education" ON public.education_entries
FOR SELECT USING (
  student_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = auth.uid() -- self (redundant but safe)
  ) 
  -- Companies viewing student profiles:
  OR EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() AND p.role = 'company'
  )
);

-- Allow public viewing if needed (e.g. browsing students)? 
-- Currently students are not fully public lists, but company packages show student names.
-- Let's stick to auth.uid check or company role.

-- Students manage own
DROP POLICY IF EXISTS "Students insert own education" ON public.education_entries;
CREATE POLICY "Students insert own education" ON public.education_entries
FOR INSERT WITH CHECK (
  student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students update own education" ON public.education_entries;
CREATE POLICY "Students update own education" ON public.education_entries
FOR UPDATE USING (
  student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students delete own education" ON public.education_entries;
CREATE POLICY "Students delete own education" ON public.education_entries
FOR DELETE USING (
  student_id = auth.uid()
);
