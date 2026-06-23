-- Fix Applications where Contract is Completed but Application is In Progress
UPDATE applications
SET status = 'completed', realization_status = 'completed'
WHERE id IN (
  SELECT application_id 
  FROM contracts 
  WHERE status = 'completed' 
  AND application_id IS NOT NULL
)
AND (status != 'completed' OR realization_status != 'completed');

-- Fix Service Orders where Contract is Completed but Order is In Progress
UPDATE service_orders
SET status = 'completed'
WHERE id IN (
  SELECT service_order_id 
  FROM contracts 
  WHERE status = 'completed' 
  AND service_order_id IS NOT NULL
)
AND status != 'completed';
