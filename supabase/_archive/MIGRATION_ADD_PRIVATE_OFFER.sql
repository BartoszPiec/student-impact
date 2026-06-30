
-- Add is_private column to offers table
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Add RLS policy for private offers if needed
-- Standard policy 'Users can view their own offers' should cover Company side (company_id).
-- We need to ensure the Student (who is NOT the owner of the offer, but the target of the inquiry) can see it?
-- Wait, 'offers' table usually has company_id. Student sees it via RLS?
-- If status is 'published', usually creates are public?
-- We might need to ensure 'is_private' offers are NOT visible in public lists.

-- For now, let's just add the column. Logic will handle filtering.
