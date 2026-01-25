-- Reset Application Status to match the Chat History (Student Proposed, so status should be 'sent')
UPDATE applications
SET 
  status = 'sent',
  counter_stawka = NULL,
  decided_at = NULL
WHERE id = '2c2f6668-4f1c-4a04-8fe0-872a9bfd6b62';
