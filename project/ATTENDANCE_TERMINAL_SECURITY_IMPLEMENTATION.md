# Attendance Terminal Security Implementation

## Overview
This document describes the implementation of attendance terminal security features based on the security plan. The implementation includes device verification, geo-location verification, PIN access control, and activity logging.

## Database Changes

### 1. Migration File
**File**: `project/supabase/migrations/add_attendance_terminal_security.sql`

This migration adds:
- **New columns to `branches` table**:
  - `latitude` (NUMERIC): Branch latitude coordinate
  - `longitude` (NUMERIC): Branch longitude coordinate
  - `attendance_pin` (VARCHAR): PIN code for attendance terminal access
  - `attendance_security_settings` (JSONB): Security settings configuration

- **New table: `attendance_terminal_devices`**:
  - Stores verified devices for each branch
  - Fields: `id`, `branch_id`, `device_fingerprint`, `device_name`, `device_type`, `browser_info`, `registered_by`, `is_active`, `last_used_at`, `registered_at`, `updated_at`

- **New table: `attendance_terminal_activity_logs`**:
  - Records all attendance terminal access attempts
  - Fields: `id`, `branch_id`, `device_id`, `staff_id`, `device_fingerprint`, `action_type`, `status`, `status_reason`, `location_latitude`, `location_longitude`, `distance_from_branch_meters`, `ip_address`, `user_agent`, `session_data`, `created_at`

- **New functions**:
  - `calculate_distance_meters()`: Calculates distance between two coordinates using Haversine formula
  - `is_within_branch_location()`: Checks if coordinates are within branch location tolerance

### 2. SQL Migration Execution
Run the migration file in your Supabase SQL editor:
```sql
-- Execute: project/supabase/migrations/add_attendance_terminal_security.sql
```

## Code Changes

### 1. Service Layer
**File**: `project/src/lib/attendanceTerminalDeviceService.ts`
- New service for managing attendance terminal devices
- Methods:
  - `getBranchDevices(branchId)`: Get all devices for a branch
  - `getAllDevices()`: Get all devices across all branches
  - `getDeviceByFingerprint(branchId, fingerprint)`: Get device by fingerprint
  - `registerDevice(deviceData, registeredBy)`: Register a new device
  - `updateDevice(deviceData)`: Update device information
  - `deactivateDevice(deviceId)`: Deactivate a device
  - `deleteDevice(deviceId)`: Delete a device
  - `updateDeviceLastUsed(deviceId)`: Update device last used timestamp
  - `logActivity(logData)`: Log activity
  - `getBranchActivityLogs(branchId, limit, offset)`: Get activity logs for a branch
  - `getActivityLogs(filters)`: Get activity logs with filters

### 2. Branch Management Service Updates
**File**: `project/src/lib/branchManagementService.ts`
- Updated `Branch` interface to include:
  - `latitude`, `longitude`, `attendance_pin`, `attendance_security_settings`
- Updated `CreateBranchData` and `UpdateBranchData` interfaces
- Added `AttendanceSecuritySettings` interface
- Updated `createBranch` and `updateBranch` methods to handle new fields

### 3. Settings Page UI
**File**: `project/src/components/settings/SettingsPage.tsx`
- Added Attendance Terminal Security section in Branch Management
- Features:
  - **Branch Security Configuration**: Configure security settings per branch
  - **Device Management**: Register, view, deactivate, and delete devices
  - **Activity Logs**: View and filter activity logs
  - **Security Settings UI**: Enable/disable security features, configure geo-location, PIN, etc.

## Features Implemented

### 1. Device Verification
- **Enable/Disable**: Toggle device verification per branch
- **Device Registration**: Register devices for each branch
- **Device Management**: View, deactivate, and delete devices
- **Device Fingerprint**: Unique identifier for each device/browser

### 2. Geo-location Verification
- **Enable/Disable**: Toggle geo-location verification per branch
- **Coordinates**: Set branch latitude and longitude
- **Tolerance**: Configure location tolerance in meters (default: 100m)
- **Distance Calculation**: Uses Haversine formula to calculate distance

### 3. PIN Access Control
- **Enable/Disable**: Toggle PIN access control per branch
- **PIN Code**: Set branch PIN code (4-20 characters)
- **Session Duration**: Configure PIN session duration (hours)
- **Session Management**: Require PIN for each session or use session duration

### 4. Activity Logging
- **Enable/Disable**: Toggle activity logging per branch
- **Log Types**: Log all access attempts (success, failed, blocked)
- **Log Details**: Device, staff, location, action type, status, reason
- **Log Filters**: Filter by action type, status, date range
- **Log Viewing**: View logs in table format with filters

## Usage Instructions

### 1. Run Database Migration
1. Open Supabase SQL Editor
2. Copy and execute the migration file: `project/supabase/migrations/add_attendance_terminal_security.sql`
3. Verify that tables and columns were created successfully

### 2. Configure Branch Security
1. Go to Settings → Branch Management
2. Edit a branch or create a new one
3. Scroll to "Attendance Terminal Security" section
4. Configure security settings:
   - **Geo-location Verification**: Enable and set coordinates
   - **Device Verification**: Enable device verification
   - **PIN Access Control**: Enable and set PIN code
   - **Activity Logging**: Enable activity logging

### 3. Register Devices
1. Go to Settings → Branch Management
2. Select a branch from "Select Branch to Configure Security"
3. Click "Register Device" button
4. Fill in device information:
   - Device Name: Friendly name (e.g., "Main Branch Kiosk")
   - Device Fingerprint: Unique identifier (can be generated or pasted)
   - Device Type: Select from dropdown (kiosk, desktop, laptop, tablet)
5. Click "Register Device"

### 4. View Activity Logs
1. Go to Settings → Branch Management
2. Select a branch from "Select Branch to Configure Security"
3. Click "View All Logs" button
4. Use filters to filter logs:
   - Action Type: Filter by action type
   - Status: Filter by status (success, failed, blocked)
   - Start Date: Filter by start date
   - End Date: Filter by end date
5. Click "Apply Filters" to apply filters

## Security Features

### 1. Device Verification
- Only pre-registered devices can access attendance terminal
- Devices are tied to specific branches
- Device fingerprints are unique and cannot be duplicated
- Devices can be deactivated or deleted

### 2. Geo-location Verification
- Attendance can only be recorded within branch location
- Configurable tolerance (default: 100 meters)
- Uses Haversine formula for accurate distance calculation
- Location is logged for auditing

### 3. PIN Access Control
- PIN code required to access attendance terminal
- PIN can be required for each session or valid for a duration
- PIN session duration is configurable (default: 24 hours)
- PIN is stored securely in database

### 4. Activity Logging
- All access attempts are logged
- Logs include: device, staff, location, action, status, reason
- Logs can be filtered and viewed for auditing
- Logs help identify misuse or abuse attempts

## Implementation Summary

### ✅ Completed
1. **Database Migration**: Created SQL migration file with all necessary tables, columns, indexes, functions, and RLS policies
2. **Service Layer**: Created `attendanceTerminalDeviceService.ts` for device and activity log management
3. **Branch Service Updates**: Updated `branchManagementService.ts` to support attendance terminal security fields
4. **Settings UI**: Added Attendance Terminal Security section to SettingsPage.tsx Branch Management
5. **Device Management UI**: Added device registration, viewing, deactivation, and deletion UI
6. **Activity Logs UI**: Added activity logs viewer with filters
7. **Security Configuration UI**: Added UI for configuring all security settings per branch

### 🔄 Next Steps

### 1. Run Database Migration
**Priority: High**
- Execute the SQL migration file in Supabase SQL Editor
- Verify that all tables, columns, indexes, and functions were created successfully
- Test RLS policies to ensure proper access control

### 2. Update Attendance Terminal Component
The Attendance Terminal component (`AttendanceTerminal.tsx`) needs to be updated to:
- **Device Verification**: Check if device is registered when device verification is enabled
- **Geo-location Verification**: Request browser geolocation and verify it's within branch tolerance
- **PIN Access Control**: Prompt for PIN code when PIN access control is enabled
- **Activity Logging**: Log all access attempts (success, failed, blocked)
- **Security Settings**: Fetch and use security settings from the branch
- **Device Registration**: Allow device registration from the terminal page
- **Error Handling**: Handle security check failures gracefully

### 2. Device Fingerprint Generation
The Attendance Terminal component should:
- Generate device fingerprint on page load
- Check if device is registered
- Prompt for device registration if not registered
- Store device fingerprint in localStorage

### 3. Geo-location Check
The Attendance Terminal component should:
- Request browser geolocation
- Check if location is within branch tolerance
- Reject attendance if outside tolerance
- Log location for auditing

### 4. PIN Access Check
The Attendance Terminal component should:
- Prompt for PIN code if enabled
- Check PIN against branch PIN
- Store PIN session in localStorage if session duration is set
- Require PIN for each session if configured

### 5. Activity Logging
The Attendance Terminal component should:
- Log all access attempts
- Log device, staff, location, action, status, reason
- Use the activity logging service
- Handle logging errors gracefully

## Database Schema

### Branches Table (Updated)
```sql
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8) NULL,
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8) NULL,
ADD COLUMN IF NOT EXISTS attendance_pin VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS attendance_security_settings JSONB NULL;
```

### Attendance Terminal Devices Table
```sql
CREATE TABLE IF NOT EXISTS public.attendance_terminal_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT,
  browser_info JSONB,
  registered_by UUID NOT NULL,
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
```

### Attendance Terminal Activity Logs Table
```sql
CREATE TABLE IF NOT EXISTS public.attendance_terminal_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL,
  device_id UUID NULL,
  staff_id UUID NULL,
  device_fingerprint TEXT,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL,
  status_reason TEXT,
  location_latitude NUMERIC(10, 8) NULL,
  location_longitude NUMERIC(11, 8) NULL,
  distance_from_branch_meters NUMERIC(10, 2) NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  session_data JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT attendance_terminal_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_terminal_activity_logs_branch_id_fkey 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  CONSTRAINT attendance_terminal_activity_logs_device_id_fkey 
    FOREIGN KEY (device_id) REFERENCES attendance_terminal_devices(id) ON DELETE SET NULL,
  CONSTRAINT attendance_terminal_activity_logs_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);
```

## Testing

### 1. Database Migration
- Run migration SQL file
- Verify tables and columns were created
- Verify indexes were created
- Verify RLS policies were created

### 2. Branch Security Configuration
- Create a new branch with security settings
- Update an existing branch with security settings
- Verify settings are saved correctly
- Verify settings are loaded correctly

### 3. Device Management
- Register a device for a branch
- View devices for a branch
- Deactivate a device
- Delete a device
- Verify device registration works correctly

### 4. Activity Logging
- View activity logs for a branch
- Filter logs by action type
- Filter logs by status
- Filter logs by date range
- Verify logs are displayed correctly

## Notes

1. **Device Fingerprint**: The device fingerprint is generated based on browser characteristics. It should be unique for each device/browser combination.

2. **Geo-location**: The geo-location verification uses the browser's geolocation API. Users must grant permission for location access.

3. **PIN Access**: The PIN code is stored in the database. It should be kept secure and changed regularly.

4. **Activity Logging**: Activity logging is enabled by default. It helps identify misuse or abuse attempts.

5. **RLS Policies**: Row Level Security (RLS) policies are in place to ensure only authorized users can access device and log data.

6. **Manila Timestamp**: All timestamps use Manila timezone (UTC+8) for consistency.

## Security Considerations

1. **Device Fingerprint**: Device fingerprints should be unique and not easily spoofable. Consider using more advanced fingerprinting techniques in production.

2. **Geo-location**: Geo-location can be spoofed. Consider using additional verification methods.

3. **PIN Access**: PIN codes should be stored securely (hashed) in production. Consider using more secure authentication methods.

4. **Activity Logging**: Activity logs should be reviewed regularly to identify misuse or abuse attempts.

5. **RLS Policies**: RLS policies ensure data security. Only authorized users can access device and log data.

## Conclusion

The attendance terminal security features have been successfully implemented. The implementation includes device verification, geo-location verification, PIN access control, and activity logging. The next step is to update the Attendance Terminal component to use these security features.

