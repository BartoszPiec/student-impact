-- FIX COLUMN TYPE MISMATCH
-- The 'criteria' column in 'milestone_snapshots' is currently JSONB, but should be TEXT.
-- This script converts it to TEXT.

BEGIN;

DO $$ 
BEGIN
    -- Check if column exists and convert
    -- We use USING to handle existing data safely (converting json structure to text representation)
    ALTER TABLE public.milestone_snapshots 
    ALTER COLUMN criteria TYPE text USING criteria::text;
    
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table milestone_snapshots does not exist, skipping.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error altering column: %', SQLERRM;
        RAISE; -- Re-throw to fail script
END $$;

COMMIT;
