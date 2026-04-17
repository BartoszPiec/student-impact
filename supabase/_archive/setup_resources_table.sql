-- Create project_resources table if not exists
CREATE TABLE IF NOT EXISTS public.project_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Access project_resources" ON public.project_resources;

CREATE POLICY "Access project_resources"
ON public.project_resources
FOR ALL
USING (
    -- User is uploader OR related to application/order
    auth.uid() = uploader_id
    OR
    EXISTS (
        SELECT 1 FROM applications a 
        LEFT JOIN offers o ON a.offer_id = o.id
        WHERE a.id = project_resources.application_id
        AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = project_resources.service_order_id
        AND (so.student_id = auth.uid() OR so.company_id = auth.uid())
    )
);

-- Ensure Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deliverables', 'deliverables', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'deliverables' );
