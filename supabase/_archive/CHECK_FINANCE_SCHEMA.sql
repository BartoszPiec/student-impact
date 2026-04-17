SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%notif%' OR table_name LIKE '%transact%' OR table_name LIKE '%wallet%' OR table_name LIKE '%financ%');
