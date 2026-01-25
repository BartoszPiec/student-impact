-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'reviews';

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews';
