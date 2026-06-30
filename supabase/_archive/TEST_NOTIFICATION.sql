-- 1. Direct Insert Test (Bypasses RPC)
INSERT INTO notifications (user_id, type, payload, read_at)
VALUES 
  ('00e8d0dd-e1e6-42eb-9b06-41764785a052', 'system_alert', '{"message": "Test powiadomienia (Direct Insert)"}', NULL);

-- 2. RPC Call Test (Tests Permissions/Logic)
-- Note: Logic inside RPC might block if p_user_id != auth.uid() unless SECURITY DEFINER is correct
-- This will fail if current SQL Editor user is not '00e8d0dd...' or if RPC is broken via REST
-- But inside SQL Editor, we usually run as postgres/service_role.

SELECT create_notification(
  '00e8d0dd-e1e6-42eb-9b06-41764785a052',
  'system_alert',
  '{"message": "Test powiadomienia (RPC Call)"}'
);
