-- DEBUG RLS VISIBILITY
-- Replace the UUID below with the actual user ID from the error log or your auth table
-- User ID from previous error log: 3babf40d-0b17-4f7a-a7f6-1dc82e9ceae0

BEGIN;
    -- 1. Simulate Authenticated User (Student: dracmos12@gmail.com)
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" = 'abd3abe3-76d0-4596-88ab-97687f795b2b';

    -- 2. Debug Contracts Visibility
    -- Should return the contracts for this student
    SELECT 'Contracts Visible' as check_name, count(*) as count, string_agg(id::text, ', ') as ids
    FROM public.contracts;

    -- 3. Debug Milestones Visibility
    -- Should return milestones linked to those contracts
    SELECT 'Milestones Visible' as check_name, count(*) as count, string_agg(status, ', ') as statuses
    FROM public.milestones;

    -- 4. Specific Contract/Milestone Check (if you know an expected ID)
    -- SELECT * FROM public.milestones WHERE status = 'released';

ROLLBACK; -- Use ROLLBACK so we don't mess up any session state permanently, though SELECTs are safe.
