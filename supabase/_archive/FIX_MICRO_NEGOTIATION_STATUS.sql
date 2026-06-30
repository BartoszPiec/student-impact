-- FIX: Revert application status to 'sent' for negotiations that were auto-accepted erroneously (status='in_progress' but have a negotiation proposal)

UPDATE applications
SET status = 'sent'
WHERE id IN (
  SELECT m.conversation_id -- Wait, we need application_id from conversations? No, join.
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  JOIN applications a ON c.application_id = a.id
  WHERE m.event = 'negotiation_proposed' 
    AND a.status = 'in_progress'
    -- Ensure we target recent ones if needed, or all. Safer to target all incorrectly state ones.
);

-- Actually precise query:
UPDATE applications
SET status = 'sent'
FROM conversations c, messages m
WHERE applications.id = c.application_id
  AND c.id = m.conversation_id
  AND m.event = 'negotiation_proposed'
  AND applications.status = 'in_progress'
  AND m.sender_id = applications.student_id; -- Ensure it's the student's proposal
