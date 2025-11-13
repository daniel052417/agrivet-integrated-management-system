-- Migration: Add allow_attendance_device_for_pos column to branches table
-- This allows branches to control whether attendance terminal devices can access POS

DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'branches'
        AND column_name = 'allow_attendance_device_for_pos'
    ) THEN
        -- Add the column
        ALTER TABLE public.branches
        ADD COLUMN allow_attendance_device_for_pos BOOLEAN DEFAULT false NOT NULL;
        
        -- Add comment
        COMMENT ON COLUMN public.branches.allow_attendance_device_for_pos IS 
            'When enabled, attendance terminal devices registered for this branch can access POS. ' ||
            'When disabled, only POS-registered devices can access POS.';
        
        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_branches_allow_attendance_device_for_pos 
        ON public.branches(allow_attendance_device_for_pos) 
        WHERE allow_attendance_device_for_pos = true;
    END IF;
END $$;

