-- CHECK_APPS_ORDERS_SCHEMA.sql
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('applications', 'orders', 'conversations')
    AND column_name IN ('id', 'offer_id', 'package_id', 'application_id', 'status', 'proposed_stawka', 'counter_stawka');
