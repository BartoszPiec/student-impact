-- ============================================================
-- CHECK AUXILIARY TABLES SCHEMA
-- ============================================================
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('project_resources', 'project_secrets', 'reviews')
AND table_schema = 'public'
AND column_name IN ('application_id', 'service_order_id', 'contract_id')
ORDER BY table_name, column_name;
