-- FIX RLS for service_orders
-- Problem: Companies cannot create (INSERT) orders, Students cannot see (SELECT) orders.

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- 1. INSERT (Companies)
DROP POLICY IF EXISTS "Companies can create orders" ON service_orders;
CREATE POLICY "Companies can create orders"
ON service_orders
FOR INSERT
WITH CHECK (
    auth.uid() = company_id
);

-- 2. SELECT (Companies sees own, Students sees own)
DROP POLICY IF EXISTS "Users see own orders" ON service_orders;
CREATE POLICY "Users see own orders"
ON service_orders
FOR SELECT
USING (
    auth.uid() = company_id OR auth.uid() = student_id
);

-- 3. UPDATE (Companies and Students can update generic fields - status logic handled by app usually)
-- Refine if needed. For now allow update own orders.
DROP POLICY IF EXISTS "Users update own orders" ON service_orders;
CREATE POLICY "Users update own orders"
ON service_orders
FOR UPDATE
USING (
    auth.uid() = company_id OR auth.uid() = student_id
);

-- 4. DELETE (Maybe only company?)
DROP POLICY IF EXISTS "Companies delete own orders" ON service_orders;
CREATE POLICY "Companies delete own orders"
ON service_orders
FOR DELETE
USING (
    auth.uid() = company_id
);

SELECT 'Service Orders RLS fixed' as status;
