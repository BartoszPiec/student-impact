SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('milestones', 'milestone_snapshots', 'contracts')
ORDER BY table_name, ordinal_position;
