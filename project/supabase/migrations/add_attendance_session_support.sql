-- ============================================================================
-- Migration: Add Support for Morning and Afternoon Sessions
-- ============================================================================
-- This migration ensures the attendance table has all necessary columns
-- for morning and afternoon session tracking
-- ============================================================================

-- The attendance table already has the following columns that we'll use:
-- - time_in: Morning Time In (7:00 AM - 12:00 NN)
-- - break_start: Morning Time Out / Lunch Break Start (12:00 NN)
-- - break_end: Afternoon Time In / Lunch Break End (1:00 PM)
-- - time_out: Afternoon Time Out (1:00 PM - 7:00 PM)

-- Verify all required columns exist
DO $$
BEGIN
  -- Check if time_in column exists and is timestamp with time zone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'time_in'
    AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN time_in TIMESTAMP WITH TIME ZONE NULL;
  END IF;

  -- Check if break_start column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'break_start'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN break_start TIMESTAMP WITH TIME ZONE NULL;
  END IF;

  -- Check if break_end column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'break_end'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN break_end TIMESTAMP WITH TIME ZONE NULL;
  END IF;

  -- Check if time_out column exists and is timestamp with time zone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'time_out'
    AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN time_out TIMESTAMP WITH TIME ZONE NULL;
  END IF;

  -- Check if check_in_method column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'check_in_method'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN check_in_method VARCHAR(20) NULL DEFAULT 'manual';
    
    -- Add check constraint for check_in_method
    ALTER TABLE public.attendance
    ADD CONSTRAINT check_method CHECK (
      check_in_method IN ('manual', 'pin', 'qr', 'biometric')
    );
  END IF;

  -- Check if updated_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now();
  END IF;

  -- Check if created_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now();
  END IF;
END $$;

-- Add comments to clarify column usage for morning/afternoon sessions
COMMENT ON COLUMN public.attendance.time_in IS 'Morning session time in (7:00 AM - 12:00 NN)';
COMMENT ON COLUMN public.attendance.break_start IS 'Morning session time out / Lunch break start (12:00 NN)';
COMMENT ON COLUMN public.attendance.break_end IS 'Afternoon session time in / Lunch break end (1:00 PM)';
COMMENT ON COLUMN public.attendance.time_out IS 'Afternoon session time out (1:00 PM - 7:00 PM)';
COMMENT ON COLUMN public.attendance.check_in_method IS 'Method used for attendance: manual, pin, qr, or biometric';

-- Create index on break_start if it doesn't exist (for querying morning time outs)
CREATE INDEX IF NOT EXISTS idx_attendance_break_start 
ON public.attendance(break_start) 
WHERE break_start IS NOT NULL;

-- Create index on break_end if it doesn't exist (for querying afternoon time ins)
CREATE INDEX IF NOT EXISTS idx_attendance_break_end 
ON public.attendance(break_end) 
WHERE break_end IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

