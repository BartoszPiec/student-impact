
SELECT 
    con.constraint_name, 
    con.constraint_type,
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS con 
    JOIN information_schema.key_column_usage AS kcu 
      ON con.constraint_name = kcu.constraint_name 
      AND con.table_schema = kcu.table_schema 
    JOIN information_schema.constraint_column_usage AS ccu 
      ON con.constraint_name = ccu.constraint_name 
      AND con.table_schema = ccu.table_schema 
WHERE 
    con.table_name = 'conversations';
