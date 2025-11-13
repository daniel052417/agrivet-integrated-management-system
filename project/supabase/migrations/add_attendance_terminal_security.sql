-- ============================================================================
-- Migration: Attendance Terminal Security Features
-- ============================================================================
-- This migration adds security features for attendance terminals:
-- 1. Device verification per branch
-- 2. Geo-location verification
-- 3. PIN/Access control
-- 4. Activity logging
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add Attendance Terminal Security Columns to Branches Table
-- ----------------------------------------------------------------------------

-- Add latitude and longitude for geo-location verification
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8) NULL,
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8) NULL;

-- Add attendance PIN for access control
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS attendance_pin VARCHAR(20) NULL;

-- Add attendance security settings (JSONB for flexible configuration)
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS attendance_security_settings JSONB NULL DEFAULT '{
  "enableDeviceVerification": false,
  "enableGeoLocationVerification": false,
  "enablePinAccessControl": false,
  "geoLocationToleranceMeters": 100,
  "requirePinForEachSession": false,
  "pinSessionDurationHours": 24,
  "enableActivityLogging": true
}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.branches.latitude IS 'Branch latitude coordinate for geo-location verification';
COMMENT ON COLUMN public.branches.longitude IS 'Branch longitude coordinate for geo-location verification';
COMMENT ON COLUMN public.branches.attendance_pin IS 'PIN code for attendance terminal access control';
COMMENT ON COLUMN public.branches.attendance_security_settings IS 'JSONB object containing attendance terminal security settings';

-- ----------------------------------------------------------------------------
-- 2. Create Attendance Terminal Devices Table
-- ----------------------------------------------------------------------------
-- Stores verified devices for each branch's attendance terminal
-- This is different from verified_devices table which is for MFA user authentication

CREATE TABLE IF NOT EXISTS public.attendance_terminal_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT, -- 'desktop', 'laptop', 'tablet', 'kiosk'
  browser_info JSONB,
  registered_by UUID NOT NULL, -- Admin user who registered the device
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT attendance_terminal_devices_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_terminal_devices_branch_id_fkey 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  CONSTRAINT attendance_terminal_devices_registered_by_fkey 
    FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT attendance_terminal_devices_unique_branch_device 
    UNIQUE (branch_id, device_fingerprint)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_devices_branch_id 
  ON public.attendance_terminal_devices(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_devices_fingerprint 
  ON public.attendance_terminal_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_devices_is_active 
  ON public.attendance_terminal_devices(is_active) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_devices_last_used 
  ON public.attendance_terminal_devices(last_used_at DESC);

-- Add comments
COMMENT ON TABLE public.attendance_terminal_devices IS 'Stores verified devices for branch attendance terminals';
COMMENT ON COLUMN public.attendance_terminal_devices.device_fingerprint IS 'Unique device fingerprint/hash for browser/device identification';
COMMENT ON COLUMN public.attendance_terminal_devices.device_name IS 'Human-readable device name (e.g., "Main Branch Kiosk")';
COMMENT ON COLUMN public.attendance_terminal_devices.browser_info IS 'JSONB object containing browser/device information';

-- ----------------------------------------------------------------------------
-- 3. Create Attendance Terminal Activity Logs Table
-- ----------------------------------------------------------------------------
-- Records all attendance terminal access attempts for auditing

CREATE TABLE IF NOT EXISTS public.attendance_terminal_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL,
  device_id UUID NULL, -- Reference to attendance_terminal_devices
  staff_id UUID NULL, -- Staff member who attempted attendance
  device_fingerprint TEXT, -- Device fingerprint from request
  action_type TEXT NOT NULL, -- 'time_in', 'time_out', 'access_denied', 'device_verified', etc.
  status TEXT NOT NULL, -- 'success', 'failed', 'blocked'
  status_reason TEXT, -- Reason for failure/block (e.g., 'unauthorized_location', 'invalid_device', 'invalid_pin')
  location_latitude NUMERIC(10, 8) NULL,
  location_longitude NUMERIC(11, 8) NULL,
  distance_from_branch_meters NUMERIC(10, 2) NULL, -- Distance from branch coordinates
  ip_address INET NULL,
  user_agent TEXT NULL,
  session_data JSONB NULL, -- Additional session information
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT attendance_terminal_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_terminal_activity_logs_branch_id_fkey 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  CONSTRAINT attendance_terminal_activity_logs_device_id_fkey 
    FOREIGN KEY (device_id) REFERENCES attendance_terminal_devices(id) ON DELETE SET NULL,
  CONSTRAINT attendance_terminal_activity_logs_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  CONSTRAINT attendance_terminal_activity_logs_action_type_check 
    CHECK (action_type IN ('time_in', 'time_out', 'access_denied', 'device_verified', 'pin_verified', 'location_verified', 'location_failed', 'device_blocked', 'pin_failed')),
  CONSTRAINT attendance_terminal_activity_logs_status_check 
    CHECK (status IN ('success', 'failed', 'blocked', 'warning'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_activity_logs_branch_id 
  ON public.attendance_terminal_activity_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_activity_logs_device_id 
  ON public.attendance_terminal_activity_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_activity_logs_staff_id 
  ON public.attendance_terminal_activity_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_activity_logs_created_at 
  ON public.attendance_terminal_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_activity_logs_status 
  ON public.attendance_terminal_activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_activity_logs_action_type 
  ON public.attendance_terminal_activity_logs(action_type);

-- Add comments
COMMENT ON TABLE public.attendance_terminal_activity_logs IS 'Audit log for all attendance terminal access attempts and activities';
COMMENT ON COLUMN public.attendance_terminal_activity_logs.status_reason IS 'Reason for status (e.g., unauthorized_location, invalid_device, invalid_pin, face_not_matched)';
COMMENT ON COLUMN public.attendance_terminal_activity_logs.distance_from_branch_meters IS 'Distance from branch coordinates in meters (for geo-location verification)';

-- ----------------------------------------------------------------------------
-- 4. Create Function to Calculate Distance Between Coordinates
-- ----------------------------------------------------------------------------
-- Haversine formula to calculate distance between two coordinates in meters

CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  R NUMERIC := 6371000; -- Earth radius in meters
  dLat NUMERIC;
  dLon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Convert degrees to radians
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  -- Return distance in meters
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment
COMMENT ON FUNCTION calculate_distance_meters IS 'Calculates distance between two coordinates using Haversine formula (returns meters)';

-- ----------------------------------------------------------------------------
-- 5. Create Function to Check if Location is Within Branch
-- ----------------------------------------------------------------------------
-- Checks if given coordinates are within the branch's allowed radius

CREATE OR REPLACE FUNCTION is_within_branch_location(
  p_branch_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_tolerance_meters NUMERIC DEFAULT 100
) RETURNS BOOLEAN AS $$
DECLARE
  v_branch_lat NUMERIC;
  v_branch_lon NUMERIC;
  v_distance NUMERIC;
BEGIN
  -- Get branch coordinates
  SELECT latitude, longitude INTO v_branch_lat, v_branch_lon
  FROM branches
  WHERE id = p_branch_id;
  
  -- If branch has no coordinates, return true (skip geo-location check)
  IF v_branch_lat IS NULL OR v_branch_lon IS NULL THEN
    RETURN true;
  END IF;
  
  -- Calculate distance
  v_distance := calculate_distance_meters(v_branch_lat, v_branch_lon, p_latitude, p_longitude);
  
  -- Check if within tolerance
  RETURN v_distance <= p_tolerance_meters;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment
COMMENT ON FUNCTION is_within_branch_location IS 'Checks if given coordinates are within branch location tolerance';

-- ----------------------------------------------------------------------------
-- 6. Create Updated At Trigger for Attendance Terminal Devices
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_attendance_terminal_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_terminal_devices_updated_at_trigger
  BEFORE UPDATE ON public.attendance_terminal_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_terminal_devices_updated_at();

-- ----------------------------------------------------------------------------
-- 7. RLS Policies for Attendance Terminal Devices
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.attendance_terminal_devices ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all devices
CREATE POLICY "Admins can manage all attendance terminal devices"
ON public.attendance_terminal_devices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'owner')
  )
);

-- Allow branch managers to view devices for their branch
CREATE POLICY "Branch managers can view their branch devices"
ON public.attendance_terminal_devices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM branches
    WHERE branches.id = attendance_terminal_devices.branch_id
    AND branches.manager_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- 8. RLS Policies for Activity Logs
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.attendance_terminal_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all activity logs
CREATE POLICY "Admins can view all attendance terminal activity logs"
ON public.attendance_terminal_activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'owner')
  )
);

-- Allow branch managers to view activity logs for their branch
CREATE POLICY "Branch managers can view their branch activity logs"
ON public.attendance_terminal_activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM branches
    WHERE branches.id = attendance_terminal_activity_logs.branch_id
    AND branches.manager_id = auth.uid()
  )
);

-- Allow system to insert activity logs (via service role or function)
-- Note: In production, use service role or create a function with SECURITY DEFINER

-- Create a function to insert activity logs with SECURITY DEFINER
-- This allows the function to bypass RLS when called with proper permissions
-- Note: The function accepts created_at as parameter to allow client to specify Manila timestamp
-- PostgreSQL will automatically convert the timestamp with timezone offset to UTC for storage
CREATE OR REPLACE FUNCTION insert_attendance_terminal_activity_log(
  p_branch_id UUID,
  p_device_id UUID DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_action_type TEXT,
  p_status TEXT,
  p_status_reason TEXT DEFAULT NULL,
  p_location_latitude NUMERIC DEFAULT NULL,
  p_location_longitude NUMERIC DEFAULT NULL,
  p_distance_from_branch_meters NUMERIC DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_data JSONB DEFAULT NULL,
  p_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Use provided timestamp (with timezone offset like +08:00) or current time
  -- PostgreSQL will automatically convert to UTC for storage
  IF p_created_at IS NOT NULL THEN
    v_created_at := p_created_at::TIMESTAMP WITH TIME ZONE;
  ELSE
    v_created_at := now();
  END IF;

  INSERT INTO public.attendance_terminal_activity_logs (
    branch_id,
    device_id,
    staff_id,
    device_fingerprint,
    action_type,
    status,
    status_reason,
    location_latitude,
    location_longitude,
    distance_from_branch_meters,
    ip_address,
    user_agent,
    session_data,
    created_at
  ) VALUES (
    p_branch_id,
    p_device_id,
    p_staff_id,
    p_device_fingerprint,
    p_action_type,
    p_status,
    p_status_reason,
    p_location_latitude,
    p_location_longitude,
    p_distance_from_branch_meters,
    p_ip_address,
    p_user_agent,
    p_session_data,
    v_created_at
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION insert_attendance_terminal_activity_log IS 'Inserts activity log for attendance terminal (bypasses RLS for service role)';

-- Grant execute permission to authenticated users
-- Note: In production, restrict this to service role only
GRANT EXECUTE ON FUNCTION insert_attendance_terminal_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_attendance_terminal_activity_log TO anon;

-- ----------------------------------------------------------------------------
-- 9. Create Index on Branches for Geo-location Queries
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branches_coordinates 
  ON public.branches(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

