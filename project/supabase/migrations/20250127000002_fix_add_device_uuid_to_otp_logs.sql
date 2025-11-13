-- ============================================================================
-- Migration: Fix - Add device_uuid to attendance_terminal_otp_logs if missing
-- ============================================================================
-- This migration ensures device_uuid column exists in attendance_terminal_otp_logs
-- This is a fix migration in case the table was created without the column
-- ============================================================================

-- Add device_uuid column to attendance_terminal_otp_logs table if it doesn't exist
ALTER TABLE public.attendance_terminal_otp_logs
ADD COLUMN IF NOT EXISTS device_uuid UUID NULL;

-- Add index on device_uuid for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_device_uuid 
  ON public.attendance_terminal_otp_logs(device_uuid)
  WHERE device_uuid IS NOT NULL;

-- Add index on device_fingerprint if not exists (for backward compatibility)
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_device_fingerprint 
  ON public.attendance_terminal_otp_logs(device_fingerprint)
  WHERE device_fingerprint IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.attendance_terminal_otp_logs.device_uuid IS 'Stable UUID from browser localStorage for device identification';

-- ============================================================================
-- End of Migration
-- ============================================================================

