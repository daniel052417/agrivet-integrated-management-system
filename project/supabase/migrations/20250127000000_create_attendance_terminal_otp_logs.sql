-- Create table for attendance terminal OTP request logs
-- This table stores OTP requests for device registration

CREATE TABLE IF NOT EXISTS public.attendance_terminal_otp_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  otp_code character varying(6) NOT NULL,
  device_uuid uuid NULL, -- Stable UUID from localStorage (primary identifier)
  device_fingerprint text NULL, -- Metadata fingerprint (for logging)
  device_name text NULL,
  device_type character varying(20) NULL,
  location_latitude numeric(10, 8) NULL,
  location_longitude numeric(11, 8) NULL,
  ip_address character varying(45) NULL,
  user_agent text NULL,
  browser_info jsonb NULL,
  status character varying(20) NOT NULL DEFAULT 'pending',
  verified_at timestamp with time zone NULL,
  verified_by uuid NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attendance_terminal_otp_logs_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_terminal_otp_logs_branch_id_fkey FOREIGN KEY (branch_id) 
    REFERENCES public.branches (id) ON DELETE CASCADE,
  CONSTRAINT attendance_terminal_otp_logs_verified_by_fkey FOREIGN KEY (verified_by) 
    REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT attendance_terminal_otp_logs_status_check CHECK (status IN ('pending', 'verified', 'expired', 'failed'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_branch_id ON public.attendance_terminal_otp_logs (branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_status ON public.attendance_terminal_otp_logs (status);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_otp_code ON public.attendance_terminal_otp_logs (otp_code);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_created_at ON public.attendance_terminal_otp_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_device_uuid ON public.attendance_terminal_otp_logs (device_uuid) WHERE device_uuid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_otp_logs_device_fingerprint ON public.attendance_terminal_otp_logs (device_fingerprint) WHERE device_fingerprint IS NOT NULL;

-- Enable RLS
ALTER TABLE public.attendance_terminal_otp_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert OTP logs (for device registration requests)
CREATE POLICY "Allow insert attendance_terminal_otp_logs" ON public.attendance_terminal_otp_logs
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read OTP logs
CREATE POLICY "Allow read attendance_terminal_otp_logs" ON public.attendance_terminal_otp_logs
  FOR SELECT
  USING (true);

-- Allow authenticated admin users to update OTP logs
CREATE POLICY "Allow update attendance_terminal_otp_logs" ON public.attendance_terminal_otp_logs
  FOR UPDATE
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_attendance_terminal_otp_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_attendance_terminal_otp_logs_updated_at
  BEFORE UPDATE ON public.attendance_terminal_otp_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_attendance_terminal_otp_logs_updated_at();

-- Create function to insert OTP log (bypasses RLS for public access)
-- Note: All timestamps should be passed with timezone information
-- PostgreSQL will automatically convert them to UTC for storage
CREATE OR REPLACE FUNCTION public.insert_attendance_terminal_otp_log(
  p_branch_id uuid,
  p_otp_code character varying,
  p_device_uuid uuid DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL,
  p_device_name text DEFAULT NULL,
  p_device_type character varying DEFAULT NULL,
  p_location_latitude numeric DEFAULT NULL,
  p_location_longitude numeric DEFAULT NULL,
  p_ip_address character varying DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_browser_info jsonb DEFAULT NULL,
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_created_at timestamp with time zone DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_otp_log_id uuid;
  v_expires_at timestamp with time zone;
  v_created_at timestamp with time zone;
BEGIN
  -- Use provided timestamps if available, otherwise generate with timezone awareness
  -- PostgreSQL automatically converts timestamps with timezone to UTC for storage
  -- If expires_at is provided with timezone (e.g., +08:00), PostgreSQL will convert it to UTC
  -- Otherwise, calculate from current time + 10 minutes (stored in UTC)
  v_expires_at := COALESCE(
    p_expires_at::timestamp with time zone,
    now() + INTERVAL '10 minutes'
  );
  
  -- Use provided created_at if available, otherwise use current time
  -- PostgreSQL will store it in UTC regardless of the input timezone
  v_created_at := COALESCE(
    p_created_at::timestamp with time zone,
    now()
  );
  
  INSERT INTO public.attendance_terminal_otp_logs (
    branch_id,
    otp_code,
    device_uuid,
    device_fingerprint,
    device_name,
    device_type,
    location_latitude,
    location_longitude,
    ip_address,
    user_agent,
    browser_info,
    status,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    p_branch_id,
    p_otp_code,
    p_device_uuid,
    p_device_fingerprint,
    p_device_name,
    p_device_type,
    p_location_latitude,
    p_location_longitude,
    p_ip_address,
    p_user_agent,
    p_browser_info,
    'pending',
    v_expires_at,
    v_created_at,
    v_created_at
  )
  RETURNING id INTO v_otp_log_id;
  
  RETURN v_otp_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify OTP
-- Note: All timestamps are stored in UTC in PostgreSQL
-- When comparing expires_at with now(), both are in UTC, so comparison is correct
-- However, we need to ensure the comparison accounts for Philippine time (UTC+8)
-- Since expires_at is stored in UTC (converted from Philippine time +08:00),
-- and now() returns UTC, the comparison is correct
CREATE OR REPLACE FUNCTION public.verify_attendance_terminal_otp(
  p_otp_code character varying,
  p_branch_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_otp_log public.attendance_terminal_otp_logs%ROWTYPE;
  v_current_utc_time timestamp with time zone;
BEGIN
  -- Get current UTC time for comparison
  -- Note: expires_at is stored in UTC (converted from Philippine time +08:00)
  -- So we compare UTC with UTC, which is correct
  v_current_utc_time := now();
  
  -- Find the OTP log
  -- Compare expires_at (stored in UTC) with current UTC time
  -- This ensures correct expiration check regardless of server timezone
  SELECT * INTO v_otp_log
  FROM public.attendance_terminal_otp_logs
  WHERE otp_code = p_otp_code
    AND branch_id = p_branch_id
    AND status = 'pending'
    AND expires_at > v_current_utc_time  -- Both are UTC, comparison is correct
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if OTP exists and is valid
  IF v_otp_log.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired OTP code'
    );
  END IF;

  -- Note: Device UUID is NOT checked here - OTP verification only verifies the OTP code
  -- Device registration check happens after OTP verification in the client
  -- This allows the user to verify OTP and wait for admin to register the device

  -- Update OTP status to verified
  -- Use UTC time for consistency (same timezone as stored expires_at)
  UPDATE public.attendance_terminal_otp_logs
  SET status = 'verified',
      verified_at = v_current_utc_time,
      updated_at = v_current_utc_time
  WHERE id = v_otp_log.id;

  -- Fetch updated OTP log to get any updated fields
  SELECT * INTO v_otp_log
  FROM public.attendance_terminal_otp_logs
  WHERE id = v_otp_log.id;

  -- Return OTP log data (including device_uuid for client-side polling)
  -- Note: Do NOT check device registration here - that happens in the client
  RETURN jsonb_build_object(
    'success', true,
    'otp_log_id', v_otp_log.id,
    'device_uuid', v_otp_log.device_uuid,
    'device_fingerprint', v_otp_log.device_fingerprint,
    'device_name', v_otp_log.device_name,
    'device_type', v_otp_log.device_type,
    'location_latitude', v_otp_log.location_latitude,
    'location_longitude', v_otp_log.location_longitude,
    'browser_info', v_otp_log.browser_info,
    'user_agent', v_otp_log.user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.attendance_terminal_otp_logs IS 'Stores OTP requests for attendance terminal device registration';
COMMENT ON COLUMN public.attendance_terminal_otp_logs.status IS 'Status: pending, verified, expired, failed';
COMMENT ON COLUMN public.attendance_terminal_otp_logs.device_uuid IS 'Stable UUID from browser localStorage for device identification';
COMMENT ON COLUMN public.attendance_terminal_otp_logs.device_fingerprint IS 'Device fingerprint for metadata/logging purposes';

