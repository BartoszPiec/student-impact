-- Make student_id nullable for open orders
ALTER TABLE public.service_orders ALTER COLUMN student_id DROP NOT NULL;

-- Add title to service_orders for easier display
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS title text;
