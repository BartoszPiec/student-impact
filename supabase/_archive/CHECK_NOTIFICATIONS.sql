-- Check notifications table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications';

-- Check create_notification function definition
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_notification';
