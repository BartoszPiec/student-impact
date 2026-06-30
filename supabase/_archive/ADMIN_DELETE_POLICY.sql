-- Enable Admin Role features

-- 1. Create Policy for Admins to DELETE Offers (Micro-orders, Jobs, Internships)
DROP POLICY IF EXISTS "Admins can delete offers" ON offers;

CREATE POLICY "Admins can delete offers"
ON offers
FOR DELETE
USING (
  exists (
    select 1 from profiles
    where profiles.user_id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 2. Create Policy for Admins to DELETE Applications (Cleanup)
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;

CREATE POLICY "Admins can delete applications"
ON applications
FOR DELETE
USING (
  exists (
    select 1 from profiles
    where profiles.user_id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 3. Ensure Admins can SEE all tables (usually public, but good to ensure if RLS is strict)
-- Currently offers are public read, so no action needed.

-- 4. Allow Admins to Delete Conversations (if cascade fails or manual cleanup)
DROP POLICY IF EXISTS "Admins can delete conversations" ON conversations;
CREATE POLICY "Admins can delete conversations"
ON conversations
FOR DELETE
USING (
  exists (
    select 1 from profiles
    where profiles.user_id = auth.uid()
    and profiles.role = 'admin'
  )
);
