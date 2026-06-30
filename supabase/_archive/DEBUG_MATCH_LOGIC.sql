-- Debug Match Logic
-- Check if we can link reviews to contracts via application_id or service_order_id

WITH student_info AS (
    SELECT user_id FROM student_profiles WHERE public_name LIKE '%Bartosz Piec%' LIMIT 1
)
SELECT 
    'CONTRACT' as type,
    c.id, 
    c.status,
    c.application_id,
    c.service_order_id
FROM contracts c
WHERE c.student_id = (SELECT user_id FROM student_info)

UNION ALL

SELECT 
    'REVIEW' as type,
    r.id,
    r.rating::text,
    r.application_id,
    r.service_order_id
FROM reviews r
WHERE r.reviewee_id = (SELECT user_id FROM student_info) OR r.student_id = (SELECT user_id FROM student_info);
