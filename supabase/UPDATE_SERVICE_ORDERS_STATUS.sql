-- Update Status Check and Add Negotiation Columns

-- 1. Update Status Constraint
ALTER TABLE public.service_orders
DROP CONSTRAINT IF EXISTS service_orders_status_check;

ALTER TABLE public.service_orders
ADD CONSTRAINT service_orders_status_check
CHECK (status IN ('inquiry', 'pending', 'proposal_sent', 'sent', 'countered', 'rejected', 'completed', 'cancelled', 'accepted'));

-- 2. Add Negotiation Columns if they don't exist
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS counter_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS agreed_amount NUMERIC(10, 2);

NOTIFY pgrst, 'reload schema';
SELECT 'Service Orders negotiation schema updated successfully' as status;
