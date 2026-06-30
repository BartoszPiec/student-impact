-- Check table definition
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';

-- Check sample data
SELECT id, typ, user_id, read_at, created_at, payload 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;
