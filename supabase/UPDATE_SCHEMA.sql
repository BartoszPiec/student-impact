DO $$
BEGIN
    -- Add milestone_id to deliverables if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliverables' 
        AND column_name = 'milestone_id'
    ) THEN
        ALTER TABLE public.deliverables ADD COLUMN milestone_id UUID REFERENCES public.milestones(id);
        RAISE NOTICE 'Added milestone_id to deliverables';
    ELSE
        RAISE NOTICE 'Column milestone_id already exists in deliverables';
    END IF;
END $$;
