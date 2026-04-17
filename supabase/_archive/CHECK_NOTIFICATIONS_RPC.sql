-- Check notifications table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Check create_notification RPC definition
SELECT proname, prosrc, proconfig, prosecdef 
FROM pg_proc 
WHERE proname = 'create_notification';
