-- Student Impact - ROBUST DATABASE SETUP
-- This script is idempotent: it drops policies before creating them to avoid "already exists" errors.
-- It also fixes missing profiles for existing users.

-- ==========================================
-- 1. PROFILES (Users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
    role text CHECK (role IN ('student', 'company', 'admin')) NOT NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.student_profiles (
    user_id uuid REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
    public_name text,
    kierunek text,
    rok integer,
    sciezka text,
    kompetencje text[],
    linki jsonb DEFAULT '{}'::jsonb,
    bio text,
    doswiadczenie text,
    linkedin_url text,
    portfolio_url text,
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.company_profiles (
    user_id uuid REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
    nazwa text,
    branza text,
    osoba_kontaktowa text,
    opis text,
    website text,
    linkedin_url text,
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 2. OFFERS & SAVED
-- ==========================================
CREATE TABLE IF NOT EXISTS public.offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES auth.users(id) NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    salary_range_min numeric,
    salary_range_max numeric,
    deadline timestamptz,
    status text CHECK (status IN ('published', 'in_progress', 'closed')) DEFAULT 'published',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.saved_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    offer_id uuid REFERENCES public.offers(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(student_id, offer_id)
);
ALTER TABLE public.saved_offers ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 3. APPLICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id uuid REFERENCES public.offers(id) NOT NULL,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    status text CHECK (status IN ('sent', 'countered', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'sent',
    message_to_company text,
    counter_stawka numeric,
    agreed_stawka numeric,
    created_at timestamptz DEFAULT now(),
    decided_at timestamptz,
    UNIQUE(offer_id, student_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 4. CONVERSATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid REFERENCES public.applications(id) NOT NULL,
    company_id uuid REFERENCES auth.users(id) NOT NULL,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    offer_id uuid REFERENCES public.offers(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) NOT NULL,
    sender_id uuid REFERENCES auth.users(id) NOT NULL,
    content text,
    payload jsonb,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 5. DELIVERABLES & REVIEWS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.deliverables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid REFERENCES public.applications(id) NOT NULL,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    title text,
    description text,
    files_url text[],
    status text CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved')) DEFAULT 'draft',
    feedback text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.experience_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    company_id uuid REFERENCES auth.users(id) NOT NULL,
    offer_id uuid REFERENCES public.offers(id),
    application_id uuid REFERENCES public.applications(id),
    title text NOT NULL,
    summary text,
    link text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.experience_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_role text NOT NULL,
    reviewer_id uuid REFERENCES auth.users(id) NOT NULL,
    reviewee_id uuid REFERENCES auth.users(id) NOT NULL,
    offer_id uuid REFERENCES public.offers(id),
    rating integer CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 6. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    typ text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 7. SERVICE PACKAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.service_packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    title text NOT NULL,
    description text,
    price numeric NOT NULL CHECK (price >= 0),
    delivery_time_days integer NOT NULL DEFAULT 3,
    status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.service_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id uuid REFERENCES public.service_packages(id) NOT NULL,
    company_id uuid REFERENCES auth.users(id) NOT NULL,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    status text CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    amount numeric NOT NULL,
    requirements text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 8. TRIGGER (Handle New User)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'role', 'student'));
  
  IF (new.raw_user_meta_data->>'role' = 'company') THEN
      INSERT INTO public.company_profiles (user_id, nazwa, osoba_kontaktowa)
      VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'company_name', 'Firma Bez Nazwy'),
        COALESCE(new.raw_user_meta_data->>'full_name', '')
      );
  ELSE
      INSERT INTO public.student_profiles (user_id, public_name)
      VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'Student')
      );
  END IF;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 9. POLICIES (DROP BEFORE CREATE)
-- ==========================================

-- Helper macro not possible, so we use explicit drops.

-- PROFILES
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- STUDENT/COMPANY PROFILES
DROP POLICY IF EXISTS "Profiles readable by auth" ON public.student_profiles;
CREATE POLICY "Profiles readable by auth" ON public.student_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles readable by auth comp" ON public.company_profiles;
CREATE POLICY "Profiles readable by auth comp" ON public.company_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Students update own" ON public.student_profiles;
CREATE POLICY "Students update own" ON public.student_profiles FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Companies update own" ON public.company_profiles;
CREATE POLICY "Companies update own" ON public.company_profiles FOR UPDATE USING (user_id = auth.uid());

-- OFFERS
DROP POLICY IF EXISTS "Offers public view" ON public.offers;
CREATE POLICY "Offers public view" ON public.offers FOR SELECT USING (status = 'published' OR company_id = auth.uid());

DROP POLICY IF EXISTS "Offers company manage" ON public.offers;
CREATE POLICY "Offers company manage" ON public.offers FOR ALL USING (company_id = auth.uid());

-- APPLICATIONS
DROP POLICY IF EXISTS "Apps view own" ON public.applications;
CREATE POLICY "Apps view own" ON public.applications FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.offers WHERE id = applications.offer_id AND company_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Apps student insert" ON public.applications;
CREATE POLICY "Apps student insert" ON public.applications FOR INSERT WITH CHECK (student_id = auth.uid());

-- SERVICE PACKAGES
DROP POLICY IF EXISTS "Public view of active packages" ON public.service_packages;
CREATE POLICY "Public view of active packages" ON public.service_packages FOR SELECT USING (status = 'active' OR student_id = auth.uid());

DROP POLICY IF EXISTS "Students manage own packages" ON public.service_packages;
CREATE POLICY "Students manage own packages" ON public.service_packages FOR ALL USING (student_id = auth.uid());

-- SERVICE ORDERS
DROP POLICY IF EXISTS "Companies view own orders" ON public.service_orders;
CREATE POLICY "Companies view own orders" ON public.service_orders FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "Students view orders for them" ON public.service_orders;
CREATE POLICY "Students view orders for them" ON public.service_orders FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Companies create orders" ON public.service_orders;
CREATE POLICY "Companies create orders" ON public.service_orders FOR INSERT WITH CHECK (company_id = auth.uid());


-- ==========================================
-- 10. FIX DATA (Create missing profiles for existing users)
-- ==========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM auth.users LOOP
    -- Check if missing in public.profiles
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = r.id) THEN
      -- Try to infer role or default to student
      INSERT INTO public.profiles (user_id, role)
      VALUES (r.id, COALESCE(r.raw_user_meta_data->>'role', 'student'));
      
      -- Create subprofile
      IF (r.raw_user_meta_data->>'role' = 'company') THEN
         INSERT INTO public.company_profiles (user_id, nazwa, osoba_kontaktowa)
         VALUES (r.id, COALESCE(r.raw_user_meta_data->>'company_name', 'Firma'), '');
      ELSE
         INSERT INTO public.student_profiles (user_id, public_name)
         VALUES (r.id, COALESCE(r.raw_user_meta_data->>'full_name', 'Student'));
      END IF;
    END IF;
  END LOOP;
END $$;
