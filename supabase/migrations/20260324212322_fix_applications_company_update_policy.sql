-- Recreate the missing company UPDATE policy on applications
-- This allows companies to accept/reject/counter applications to their own offers
CREATE POLICY "applications_update_company"
ON applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = applications.offer_id
      AND offers.company_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = applications.offer_id
      AND offers.company_id = auth.uid()
  )
);;
