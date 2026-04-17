-- FIX RLS FOR SAVED_OFFERS

-- Allow students to view their saved offers
DROP POLICY IF EXISTS "Students view own saved offers" ON public.saved_offers;
CREATE POLICY "Students view own saved offers" ON public.saved_offers
FOR SELECT USING (
  student_id = auth.uid()
);

-- Allow students to save offers (insert)
DROP POLICY IF EXISTS "Students save offers" ON public.saved_offers;
CREATE POLICY "Students save offers" ON public.saved_offers
FOR INSERT WITH CHECK (
  student_id = auth.uid()
);

-- Allow students to match remove saved offers (delete)
DROP POLICY IF EXISTS "Students delete own saved offers" ON public.saved_offers;
CREATE POLICY "Students delete own saved offers" ON public.saved_offers
FOR DELETE USING (
  student_id = auth.uid()
);
