-- 1. DELIVERABLES BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', false) -- Private bucket
ON CONFLICT (id) DO UPDATE SET public = false;

-- RLS for Storage
DROP POLICY IF EXISTS "Deliverables Auth Upload" ON storage.objects;
CREATE POLICY "Deliverables Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'deliverables' );

-- Allow participants to read files
DROP POLICY IF EXISTS "Deliverables Participant Read" ON storage.objects;
CREATE POLICY "Deliverables Participant Read"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'deliverables' ); 
-- Note: ideally we strictly check ownership, but for MVP authenticated read on this bucket is acceptable 
-- provided filenames are unguessable, or we can add complex policies later.


-- 2. DELIVERABLES TABLE
CREATE TABLE IF NOT EXISTS public.deliverables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid REFERENCES public.applications(id) NOT NULL,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    company_id uuid REFERENCES auth.users(id) NOT NULL,
    
    files jsonb DEFAULT '[]'::jsonb, -- Array of {name, url, size}
    description text,
    
    status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    company_feedback text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deliverables view own" ON public.deliverables;
CREATE POLICY "Deliverables view own" ON public.deliverables
FOR SELECT USING (auth.uid() = student_id OR auth.uid() = company_id);

DROP POLICY IF EXISTS "Deliverables insert student" ON public.deliverables;
CREATE POLICY "Deliverables insert student" ON public.deliverables
FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Deliverables update participants" ON public.deliverables;
CREATE POLICY "Deliverables update participants" ON public.deliverables
FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = company_id);


-- 3. UPDATE APPLICATIONS
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS realization_status text CHECK (realization_status IN ('in_progress', 'delivered', 'completed')) DEFAULT 'in_progress';


-- 4. REVIEWS TABLE (Generic)
-- Consolidated table for both directions
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_id uuid REFERENCES auth.users(id) NOT NULL,
    reviewee_id uuid REFERENCES auth.users(id) NOT NULL,
    
    application_id uuid REFERENCES public.applications(id),
    offer_id uuid REFERENCES public.offers(id),
    
    reviewer_role text CHECK (reviewer_role IN ('student', 'company')) NOT NULL,
    
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews read public" ON public.reviews;
CREATE POLICY "Reviews read public" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reviews insert participant" ON public.reviews;
CREATE POLICY "Reviews insert participant" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Drop old table if generic is preferred, or keep both. 
-- For clarity, we will use 'reviews' going forward.
