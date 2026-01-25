
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('contracts', 'milestones') 
ORDER BY 
    table_name, 
    ordinal_position;
