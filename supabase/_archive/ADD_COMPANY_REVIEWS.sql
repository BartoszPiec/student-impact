-- Create table for reviews OF companies BY students
CREATE TABLE IF NOT EXISTS public.company_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- The company being reviewed
    student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- The student writing the review (nullable for anonymity if needed)
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can read reviews
CREATE POLICY "Public Read Access Reviews"
ON public.company_reviews
FOR SELECT
USING (true);

-- 2. Authenticated users (students) can write reviews
CREATE POLICY "Students can insert reviews"
ON public.company_reviews
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- SEED DATA (for existing companies in 'offers')
-- We'll add some fake reviews for companies that have offers
DO $$
DECLARE
    company_rec RECORD;
    i INT;
    descriptions TEXT[] := ARRAY[
        'Świetna atmosfera, polecam każdemu!',
        'Bardzo profesjonalne podejście do studenta.',
        'Szybki kontakt i jasne warunki stażu.',
        'Wszystko ok, ale wynagrodzenie mogłoby być wyższe.',
        'Ciekawe projekty, dużo się nauczyłem.'
    ];
BEGIN
    FOR company_rec IN SELECT DISTINCT company_id FROM public.offers WHERE company_id IS NOT NULL LOOP
        -- Insert 1-3 random reviews for each company
        FOR i IN 1..(floor(random() * 3 + 1)::int) LOOP
            INSERT INTO public.company_reviews (company_id, rating, comment, created_at)
            VALUES (
                company_rec.company_id,
                floor(random() * 2 + 4)::int, -- Rating 4 or 5 mostly
                descriptions[floor(random() * array_length(descriptions, 1) + 1)::int],
                now() - (random() * interval '30 days')
            );
        END LOOP;
    END LOOP;
END $$;

-- Grant permissions
GRANT SELECT, INSERT ON public.company_reviews TO anon, authenticated, service_role;
