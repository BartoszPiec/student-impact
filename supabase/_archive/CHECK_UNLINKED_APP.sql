-- Check for unlinked applications
SELECT 
    c.id as conversation_id,
    c.application_id as conv_app_id,
    a.id as found_app_id,
    a.status,
    a.proposed_stawka,
    c.student_id,
    c.offer_id,
    c.package_id
FROM conversations c
LEFT JOIN applications a ON (
    a.student_id = c.student_id 
    AND (
        (c.offer_id IS NOT NULL AND a.offer_id = c.offer_id)
        OR 
        (c.package_id IS NOT NULL AND a.package_id = c.package_id)
    )
)
WHERE c.id = '99e041c3-675d-414d-be67-ce8290898a18';
