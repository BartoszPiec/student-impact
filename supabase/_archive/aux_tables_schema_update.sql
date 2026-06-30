-- ============================================================
-- Update Auxiliary Tables to support Service Orders
-- (Resources, Secrets, Reviews)
-- ============================================================

-- 1. PROJECT RESOURCES
ALTER TABLE public.project_resources
ADD COLUMN IF NOT EXISTS service_order_id uuid NULL REFERENCES public.service_orders(id) ON DELETE SET NULL;

ALTER TABLE public.project_resources
ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE public.project_resources
DROP CONSTRAINT IF EXISTS resources_source_check;

ALTER TABLE public.project_resources
ADD CONSTRAINT resources_source_check
CHECK (
  (application_id IS NOT NULL AND service_order_id IS NULL) OR
  (application_id IS NULL AND service_order_id IS NOT NULL)
);

-- RLS for Resources
DROP POLICY IF EXISTS "resources_select_participants" ON public.project_resources;
CREATE POLICY "resources_select_participants"
ON public.project_resources FOR SELECT TO authenticated
USING (
  (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.applications a JOIN public.offers o ON o.id = a.offer_id 
      WHERE a.id = project_resources.application_id AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
  ))
  OR
  (service_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.service_orders so 
      WHERE so.id = project_resources.service_order_id AND (so.student_id = auth.uid() OR so.company_id = auth.uid())
  ))
   OR
    -- Allow admins/contract participants mostly covered above, but good to be safe
    EXISTS (
        SELECT 1 FROM public.contracts c 
        WHERE (c.application_id = project_resources.application_id OR c.service_order_id = project_resources.service_order_id)
        AND (c.company_id = auth.uid() OR c.student_id = auth.uid())
    )
);

-- 2. PROJECT SECRETS
ALTER TABLE public.project_secrets
ADD COLUMN IF NOT EXISTS service_order_id uuid NULL REFERENCES public.service_orders(id) ON DELETE SET NULL;

ALTER TABLE public.project_secrets
ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE public.project_secrets
DROP CONSTRAINT IF EXISTS secrets_source_check;

ALTER TABLE public.project_secrets
ADD CONSTRAINT secrets_source_check
CHECK (
  (application_id IS NOT NULL AND service_order_id IS NULL) OR
  (application_id IS NULL AND service_order_id IS NOT NULL)
);

-- RLS for Secrets
DROP POLICY IF EXISTS "secrets_select_participants" ON public.project_secrets;
CREATE POLICY "secrets_select_participants"
ON public.project_secrets FOR SELECT TO authenticated
USING (
  (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.applications a JOIN public.offers o ON o.id = a.offer_id 
      WHERE a.id = project_secrets.application_id AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
  ))
  OR
  (service_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.service_orders so 
      WHERE so.id = project_secrets.service_order_id AND (so.student_id = auth.uid() OR so.company_id = auth.uid())
  ))
);

-- 3. REVIEWS
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS service_order_id uuid NULL REFERENCES public.service_orders(id) ON DELETE SET NULL;

ALTER TABLE public.reviews
ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE public.reviews
ALTER COLUMN offer_id DROP NOT NULL; -- Service Orders might not have offer_id easily linked or use package_id

-- RLS for Reviews
DROP POLICY IF EXISTS "reviews_select_participants" ON public.reviews;
CREATE POLICY "reviews_select_participants"
ON public.reviews FOR SELECT TO authenticated
USING (
   reviewer_id = auth.uid() 
   OR reviewee_id = auth.uid()
   OR 
   (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.applications a WHERE a.id = reviews.application_id AND (a.student_id = auth.uid() OR exists(select 1 from offers o where o.id=a.offer_id and o.company_id=auth.uid()))
   ))
   OR
   (service_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.service_orders so WHERE so.id = reviews.service_order_id AND (so.student_id = auth.uid() OR so.company_id = auth.uid())
   ))
);

NOTIFY pgrst, 'reload schema';
