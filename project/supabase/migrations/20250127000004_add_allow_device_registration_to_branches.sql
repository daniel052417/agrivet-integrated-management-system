-- Migration: Add allow_device_registration column to branches table
-- This column controls whether new devices can request OTP for registration

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'branches' 
    AND column_name = 'allow_device_registration'
  ) THEN
    ALTER TABLE public.branches 
    ADD COLUMN allow_device_registration BOOLEAN DEFAULT false NOT NULL;
    
    -- Add comment
    COMMENT ON COLUMN public.branches.allow_device_registration IS 
      'When true, allows unregistered devices to request OTP for device registration. Automatically set to false after a device is registered.';
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_branches_allow_device_registration 
ON public.branches(allow_device_registration) 
WHERE allow_device_registration = true;

