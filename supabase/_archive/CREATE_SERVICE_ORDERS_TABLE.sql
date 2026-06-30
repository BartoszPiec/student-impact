-- Create service_orders table if it doesn't exist
-- Essential for tracking direct service orders from companies to students.

CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    company_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.service_packages(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'inquiry', -- inquiry, pending, proposal_sent, active, completed, cancelled
    amount NUMERIC DEFAULT 0,
    requirements TEXT,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('inquiry', 'pending', 'proposal_sent', 'active', 'completed', 'cancelled', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Re-apply RLS policies (just to be sure)
DROP POLICY IF EXISTS "Companies can create orders" ON service_orders;
CREATE POLICY "Companies can create orders" ON service_orders FOR INSERT WITH CHECK (auth.uid() = company_id);

DROP POLICY IF EXISTS "Users see own orders" ON service_orders;
CREATE POLICY "Users see own orders" ON service_orders FOR SELECT USING (auth.uid() = company_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Users update own orders" ON service_orders;
CREATE POLICY "Users update own orders" ON service_orders FOR UPDATE USING (auth.uid() = company_id OR auth.uid() = student_id);

SELECT 'service_orders table created/verified' as status;
