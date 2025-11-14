-- ============================================================================
-- Migration: Fix RLS Policies for Attendance Terminal Devices
-- ============================================================================
-- This migration adds RLS policies to allow anonymous/unauthenticated users
-- to read attendance_terminal_devices for device verification purposes.
-- This is necessary because attendance terminals are accessed without authentication.
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anonymous users can read devices for verification" ON public.attendance_terminal_devices;
DROP POLICY IF EXISTS "Authenticated users can read devices for verification" ON public.attendance_terminal_devices;

-- Allow anonymous users to SELECT devices for device verification
-- This is safe because:
-- 1. We only allow SELECT (read), not INSERT/UPDATE/DELETE
-- 2. The device_uuid is a stable identifier that doesn't expose sensitive data
-- 3. Device verification is necessary for the attendance terminal to function
-- Note: This policy works alongside existing policies (PostgreSQL RLS uses OR logic for SELECT)
CREATE POLICY "Anonymous users can read devices for verification"
ON public.attendance_terminal_devices
FOR SELECT
TO anon
USING (true); -- Allow reading all devices for verification purposes

-- Also allow authenticated users to read devices (in addition to existing policies)
-- This ensures authenticated users can also verify devices
-- Note: This policy works alongside existing admin/manager policies
CREATE POLICY "Authenticated users can read devices for verification"
ON public.attendance_terminal_devices
FOR SELECT
TO authenticated
USING (true); -- Allow reading all devices for verification purposes

-- ============================================================================
-- Migration Note
-- ============================================================================
-- This policy allows anonymous users to read attendance_terminal_devices
-- which is necessary for device verification in the attendance terminal.
-- The existing policies for admins and branch managers remain in place
-- for INSERT/UPDATE/DELETE operations.
-- ============================================================================

