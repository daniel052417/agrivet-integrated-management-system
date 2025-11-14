-- ============================================================================
-- Migration: Add device_uuid to Attendance Terminal Devices
-- ============================================================================
-- This migration adds a stable device_uuid column to attendance_terminal_devices
-- table for consistent device identification using localStorage UUID
-- ============================================================================

-- Add device_uuid column to attendance_terminal_devices table
ALTER TABLE public.attendance_terminal_devices
ADD COLUMN IF NOT EXISTS device_uuid UUID NULL;

-- Add index on device_uuid for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_devices_device_uuid 
  ON public.attendance_terminal_devices(device_uuid)
  WHERE device_uuid IS NOT NULL;

-- Add unique constraint on branch_id + device_uuid combination
-- This ensures one device UUID can only be registered once per branch
ALTER TABLE public.attendance_terminal_devices
DROP CONSTRAINT IF EXISTS attendance_terminal_devices_unique_branch_device_uuid;

ALTER TABLE public.attendance_terminal_devices
ADD CONSTRAINT attendance_terminal_devices_unique_branch_device_uuid
  UNIQUE (branch_id, device_uuid)
  DEFERRABLE INITIALLY DEFERRED;

-- Add comment for documentation
COMMENT ON COLUMN public.attendance_terminal_devices.device_uuid IS 'Stable UUID stored in browser localStorage for consistent device identification across sessions';

-- ============================================================================
-- Update OTP logs table to include device_uuid
-- ============================================================================

-- Add device_uuid column to attendance_terminal_otp_logs table
ALTER TABLE public.attendance_terminal_otp_logs
ADD COLUMN IF NOT EXISTS device_uuid UUID NULL;

-- Add index on device_uuid for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_device_uuid 
  ON public.attendance_terminal_otp_logs(device_uuid)
  WHERE device_uuid IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.attendance_terminal_otp_logs.device_uuid IS 'Stable UUID from browser localStorage for device identification';

-- ============================================================================
-- Migration Note
-- ============================================================================
-- Existing devices will have device_uuid as NULL
-- New device registrations will use device_uuid for lookup
-- The device_fingerprint is still stored for metadata/logging purposes
-- ============================================================================

