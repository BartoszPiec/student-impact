-- Fix Deliverables Status Constraint
ALTER TABLE public.deliverables
DROP CONSTRAINT IF EXISTS deliverables_status_check;

ALTER TABLE public.deliverables
ADD CONSTRAINT deliverables_status_check
CHECK (status IN ('pending', 'accepted', 'rejected', 'delivered')); 
-- Added 'delivered' just in case, though 'pending' is what we use in RPC.
