-- Ensure the canonical company update policy exists in repo and DB.
-- This closes the last repo <-> DB ambiguity after drift cleanup.

DROP POLICY IF EXISTS applications_update_company ON public.applications;

CREATE POLICY applications_update_company
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE o.id = applications.offer_id
        AND o.company_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE o.id = applications.offer_id
        AND o.company_id = auth.uid()
    )
  );
