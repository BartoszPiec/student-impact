-- Security Hardening: Privilege Escalation Fix for Profiles
-- Reconstructed from database state to resolve repository drift

DROP POLICY IF EXISTS "profiles_update_own" ON "public"."profiles";

CREATE POLICY "profiles_update_own" ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
    (user_id = auth.uid()) AND 
    (role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()))
);
