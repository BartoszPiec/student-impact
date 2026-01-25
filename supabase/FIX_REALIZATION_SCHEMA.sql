-- FIX SCRIPT for Realization Schema
-- Run this to fix the "column company_id does not exist" error

DO $$
BEGIN
    -- 1. Ensure table exists if it wasn't created
    CREATE TABLE IF NOT EXISTS public.deliverables (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        application_id uuid REFERENCES public.applications(id) NOT NULL,
        student_id uuid REFERENCES auth.users(id) NOT NULL,
        created_at timestamptz DEFAULT now()
    );

    -- 2. Add columns if they are missing (Safe migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'company_id') THEN
        ALTER TABLE public.deliverables ADD COLUMN company_id uuid REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'files') THEN
        ALTER TABLE public.deliverables ADD COLUMN files jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'description') THEN
        ALTER TABLE public.deliverables ADD COLUMN description text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'status') THEN
        ALTER TABLE public.deliverables ADD COLUMN status text DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'company_feedback') THEN
        ALTER TABLE public.deliverables ADD COLUMN company_feedback text;
    END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'updated_at') THEN
        ALTER TABLE public.deliverables ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    -- Ensure student_id is present (it was in CREATE TABLE, but just to be safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'student_id') THEN
        ALTER TABLE public.deliverables ADD COLUMN student_id uuid REFERENCES auth.users(id);
    END IF;
    
    -- Ensure application_id is present
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'application_id') THEN
        ALTER TABLE public.deliverables ADD COLUMN application_id uuid REFERENCES public.applications(id);
    END IF;

END $$;

-- 3. Now that columns definitely exist, we can recreate policies
BEGIN;
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
COMMIT;
