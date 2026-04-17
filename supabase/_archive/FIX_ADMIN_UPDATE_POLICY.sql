-- Enable Admin Update on Offers
-- Required for "Close" functionality (changing status)

DROP POLICY IF EXISTS "Admins can update offers" ON offers;

CREATE POLICY "Admins can update offers"
ON offers
FOR UPDATE
USING (
  exists (
    select 1 from profiles
    where profiles.user_id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Note: Ensure that we are updating ONLY fields we want, but FOR UPDATE usually covers all.
-- This effectively gives admins edit rights on offers (which includes status).

SELECT 'Admin update policy enabled' as status;
