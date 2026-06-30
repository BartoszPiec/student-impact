
SELECT 
    c.id, c.status, c.student_id, c.created_at,
    m.id as milestone_id, m.amount, m.status as milestone_status
FROM contracts c
LEFT JOIN milestones m ON c.id = m.contract_id
LIMIT 10;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contracts';
