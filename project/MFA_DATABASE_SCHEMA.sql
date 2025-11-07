-- ============================================================================
-- MFA (Multi-Factor Authentication) Database Schema
-- ============================================================================
-- This migration creates the necessary tables for MFA functionality
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MFA OTP Codes Table
-- ----------------------------------------------------------------------------
-- Stores one-time password codes for MFA verification
CREATE TABLE IF NOT EXISTS public.mfa_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT mfa_otp_codes_pkey PRIMARY KEY (id),
  CONSTRAINT mfa_otp_codes_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfa_otp_codes_user_id 
  ON mfa_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_otp_codes_user_code 
  ON mfa_otp_codes(user_id, otp_code, used);
CREATE INDEX IF NOT EXISTS idx_mfa_otp_codes_expires_at 
  ON mfa_otp_codes(expires_at);

-- ----------------------------------------------------------------------------
-- 2. Verified Devices Table
-- ----------------------------------------------------------------------------
-- Stores information about verified devices for trusted device verification
CREATE TABLE IF NOT EXISTS public.verified_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser_info JSONB,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT verified_devices_pkey PRIMARY KEY (id),
  CONSTRAINT verified_devices_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT verified_devices_unique_user_device UNIQUE (user_id, device_fingerprint)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verified_devices_user_id 
  ON verified_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_devices_fingerprint 
  ON verified_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_verified_devices_last_used 
  ON verified_devices(last_used_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Cleanup Function for Expired OTP Codes
-- ----------------------------------------------------------------------------
-- Automatically clean up expired OTP codes (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM mfa_otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour'
     OR (used = true AND created_at < NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. RLS Policies
-- ----------------------------------------------------------------------------

-- Allow users to read their own OTP codes (for verification)
CREATE POLICY "Users can read their own OTP codes"
ON mfa_otp_codes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow system to insert OTP codes (via service role)
-- Note: In production, use service role or create a function with SECURITY DEFINER

-- Allow users to update their own OTP codes (mark as used)
CREATE POLICY "Users can update their own OTP codes"
ON mfa_otp_codes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to read their own verified devices
CREATE POLICY "Users can read their own verified devices"
ON verified_devices FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own verified devices
CREATE POLICY "Users can insert their own verified devices"
ON verified_devices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own verified devices
CREATE POLICY "Users can update their own verified devices"
ON verified_devices FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own verified devices
CREATE POLICY "Users can delete their own verified devices"
ON verified_devices FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Enable RLS
-- ----------------------------------------------------------------------------
ALTER TABLE mfa_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_devices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- END OF MFA DATABASE SCHEMA
-- ============================================================================







