-- Student Impact - Beta Features (Service Packages)
-- Run this in Supabase SQL Editor AFTER release-2025-12-20.sql

-- =========================
-- 1. Service Packages
-- =========================
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

-- Policies
CREATE POLICY "Public view of active packages" 
ON public.service_packages FOR SELECT 
USING (status = 'active' OR student_id = auth.uid());

CREATE POLICY "Students manage own packages" 
ON public.service_packages FOR ALL 
USING (student_id = auth.uid());

-- =========================
-- 2. Service Orders
-- =========================
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

-- Policies
CREATE POLICY "Companies view own orders" 
ON public.service_orders FOR SELECT 
USING (company_id = auth.uid());

CREATE POLICY "Students view orders for them" 
ON public.service_orders FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Companies create orders" 
ON public.service_orders FOR INSERT 
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Participants update status" 
ON public.service_orders FOR UPDATE 
USING (company_id = auth.uid() OR student_id = auth.uid());
