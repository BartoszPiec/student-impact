-- Enable RLS (if not already)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop key policies to recreate them correctly
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all" ON notifications;

-- 1. View Policy
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Update Policy (Mark as Read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Validation: Check if table has data (for debugging)
SELECT count(*) as total_notifications FROM notifications;
