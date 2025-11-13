# Attendance Terminal Security - User Guide

## Overview
This guide explains how to configure and use the attendance terminal security features, including device verification, geo-location verification, PIN access control, and activity logging.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Configuring Branch Security](#configuring-branch-security)
3. [Device Registration](#device-registration)
4. [Using the Attendance Terminal](#using-the-attendance-terminal)
5. [Viewing Activity Logs](#viewing-activity-logs)
6. [Troubleshooting](#troubleshooting)

---

## 1. Initial Setup

### Step 1: Run Database Migration
Before using the security features, you must run the database migration:

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Execute Migration File**
   - Open the file: `project/supabase/migrations/add_attendance_terminal_security.sql`
   - Copy the entire SQL content
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute the migration

3. **Verify Migration Success**
   - Check that the following were created:
     - New columns in `branches` table: `latitude`, `longitude`, `attendance_pin`, `attendance_security_settings`
     - New table: `attendance_terminal_devices`
     - New table: `attendance_terminal_activity_logs`
     - New functions: `calculate_distance_meters`, `is_within_branch_location`, `insert_attendance_terminal_activity_log`

### Step 2: Access Settings Page
1. Log in to the admin dashboard
2. Go to **Settings** → **Branch Management**
3. Scroll down to the **Attendance Terminal Security** section

---

## 2. Configuring Branch Security

### Option A: Configure Security When Creating/Editing a Branch

1. **Create or Edit a Branch**
   - Click "Add Branch" or edit an existing branch
   - Fill in branch information (name, address, etc.)

2. **Scroll to Attendance Terminal Security Section**
   - You'll see the security configuration options

3. **Configure Geo-location Verification** (Optional but Recommended)
   - ✅ Enable "Enable Geo-location Verification"
   - **Get Branch Coordinates**:
     - Open Google Maps in your browser
     - Search for your branch address
     - Right-click on the exact location
     - Select "What's here?" or click on the coordinates
     - Copy the latitude and longitude
   - **Enter Coordinates**:
     - Latitude: Paste the latitude (e.g., `14.5995`)
     - Longitude: Paste the longitude (e.g., `120.9842`)
   - **Set Tolerance**:
     - Location Tolerance: Set the maximum distance in meters (default: 100m)
     - This determines how far from the branch coordinates attendance can be recorded
     - Recommended: 50-100 meters for accurate location verification

4. **Configure Device Verification** (Recommended)
   - ✅ Enable "Enable Device Verification"
   - This requires devices to be registered before they can access the attendance terminal
   - **Note**: After enabling, you must register devices (see Device Registration section)

5. **Configure PIN Access Control** (Recommended)
   - ✅ Enable "Enable PIN Access Control"
   - **Set PIN Code**:
     - Enter a 4-20 character PIN code
     - Example: `1234` or `BRANCH2024`
     - **Important**: Keep this PIN secure and share it only with authorized staff
   - **Configure Session Settings**:
     - **Require PIN for each session**: If enabled, PIN must be entered every time the terminal is accessed
     - **PIN Session Duration**: If "Require PIN for each session" is disabled, set how long the PIN session remains valid (default: 24 hours)
     - Example: If set to 24 hours, PIN is valid for 24 hours after first entry

6. **Configure Activity Logging** (Recommended)
   - ✅ Enable "Enable Activity Logging"
   - This logs all attendance terminal access attempts for auditing
   - **Note**: Activity logging is enabled by default and recommended for security

7. **Save Branch**
   - Click "Save" or "Update Branch" to save the security settings

### Option B: Configure Security for Existing Branch

1. **Select Branch in Settings Page**
   - Go to Settings → Branch Management
   - Scroll to "Attendance Terminal Security" section
   - Select a branch from the dropdown: "Select Branch to Configure Security"

2. **Edit Branch Security Settings**
   - Click "Edit Branch" button next to the branch
   - Scroll to "Attendance Terminal Security" section
   - Configure security settings as described above
   - Save the branch

---

## 3. Device Registration

### Method 1: Register Device from Settings Page (Recommended)

1. **Access Device Management**
   - Go to Settings → Branch Management
   - Scroll to "Attendance Terminal Security" section
   - Select the branch from the dropdown

2. **Register New Device**
   - Click "Register Device" button
   - Fill in device information:
     - **Device Name**: Enter a friendly name (e.g., "Main Branch Kiosk", "Office Laptop", "Reception Tablet")
     - **Device Fingerprint**: 
       - Option A: Generate fingerprint by clicking "Generate" button
       - Option B: Paste fingerprint from the attendance terminal page
       - **Note**: The fingerprint is a unique identifier for the device/browser
     - **Device Type**: Select from dropdown (Kiosk, Desktop, Laptop, Tablet)

3. **Save Device**
   - Click "Register Device" to save
   - The device will appear in the "Verified Devices" list

### Method 2: Register Device from Attendance Terminal Page (Future Implementation)

**Note**: This feature will be implemented in the Attendance Terminal component. For now, use Method 1.

1. **Open Attendance Terminal**
   - Navigate to the attendance terminal page
   - If device verification is enabled, you'll see a prompt to register the device

2. **Get Device Fingerprint**
   - The system will generate a device fingerprint
   - Copy the fingerprint

3. **Register in Settings**
   - Go to Settings → Branch Management
   - Select the branch
   - Click "Register Device"
   - Paste the fingerprint and fill in device information
   - Save the device

### Device Management

#### View Registered Devices
- Go to Settings → Branch Management
- Select a branch
- View the list of registered devices in the "Verified Devices" section
- Each device shows:
  - Device Name
  - Device Type
  - Registration Status (Active/Inactive)
  - Device Fingerprint (truncated)
  - Registered By (admin user)
  - Last Used timestamp

#### Deactivate a Device
- Click the "Ban" icon (🚫) next to the device
- Confirm the deactivation
- The device will be marked as inactive and cannot access the attendance terminal

#### Delete a Device
- Click the "Trash" icon (🗑️) next to the device
- Confirm the deletion
- **Warning**: This action cannot be undone
- The device will be removed from the database

#### Reactivate a Device
- Currently, you need to delete and re-register the device
- **Future Enhancement**: Add a "Reactivate" button

---

## 4. Using the Attendance Terminal

### Security Flow

When a user accesses the attendance terminal, the following security checks are performed (if enabled):

1. **Device Verification** (if enabled)
   - System checks if the device fingerprint is registered for the branch
   - If not registered → Show "Unauthorized Device" error
   - If registered → Continue to next check

2. **PIN Access Control** (if enabled)
   - System prompts for branch PIN code
   - If PIN is incorrect → Show "Invalid PIN" error
   - If PIN is correct → Continue to next check
   - **Session Management**:
     - If "Require PIN for each session" is enabled → PIN must be entered every time
     - If session duration is set → PIN is valid for the specified duration (stored in localStorage)

3. **Geo-location Verification** (if enabled)
   - System requests browser geolocation permission
   - If permission denied → Show "Location access denied" error
   - If permission granted → System checks if location is within branch tolerance
   - If outside tolerance → Show "Location not within branch" error
   - If within tolerance → Continue to attendance recording

4. **Facial Recognition** (Always Required)
   - System captures face image
   - System matches face with registered staff
   - If match found → Record attendance
   - If no match → Show "Face not recognized" error

5. **Activity Logging** (if enabled)
   - System logs all access attempts (success, failed, blocked)
   - Logs include: device, staff, location, action, status, reason

### Accessing the Attendance Terminal

1. **Open Attendance Terminal Page**
   - Navigate to `/attendance-terminal` (or your attendance terminal URL)
   - The page will load and perform security checks

2. **Device Verification Check** (if enabled)
   - If device is not registered → You'll see an "Unauthorized Device" message
   - **Solution**: Register the device in Settings → Branch Management

3. **PIN Entry** (if enabled)
   - Enter the branch PIN code
   - Click "Submit" or press Enter
   - If PIN is correct → Continue to attendance terminal
   - If PIN is incorrect → Show error message

4. **Location Permission** (if geo-location is enabled)
   - Browser will prompt for location permission
   - Click "Allow" to grant permission
   - If denied → Attendance cannot be recorded

5. **Record Attendance**
   - Click "Time In" or "Time Out" button
   - System will capture your face
   - If face is recognized → Attendance is recorded
   - If face is not recognized → Show error message

---

## 5. Viewing Activity Logs

### View Activity Logs in Settings

1. **Access Activity Logs**
   - Go to Settings → Branch Management
   - Select a branch from the dropdown
   - Scroll to "Activity Logs" section

2. **View Recent Logs**
   - The section shows the 10 most recent activity logs
   - Each log shows:
     - Timestamp
     - Action Type (Time In, Time Out, Access Denied, etc.)
     - Status (Success, Failed, Blocked)
     - Device Name
     - Staff Name (if available)
     - Status Reason (if failed/blocked)

3. **View All Logs**
   - Click "View All Logs" button
   - A modal will open showing all activity logs

4. **Filter Logs**
   - **Action Type**: Filter by action type (Time In, Time Out, Access Denied, etc.)
   - **Status**: Filter by status (Success, Failed, Blocked, Warning)
   - **Start Date**: Filter by start date
   - **End Date**: Filter by end date
   - Click "Apply Filters" to filter the logs

5. **Log Details**
   - Each log entry shows:
     - **Timestamp**: When the activity occurred
     - **Action Type**: What action was attempted
     - **Status**: Whether it was successful, failed, or blocked
     - **Device**: Which device was used
     - **Staff**: Which staff member attempted the action
     - **Reason**: Why it failed or was blocked (if applicable)
     - **Location**: GPS coordinates and distance from branch (if available)

---

## 6. Troubleshooting

### Issue: "Unauthorized Device" Error

**Problem**: Device is not registered for the branch.

**Solution**:
1. Go to Settings → Branch Management
2. Select the branch
3. Click "Register Device"
4. Generate or paste the device fingerprint
5. Fill in device information
6. Click "Register Device"

**How to Get Device Fingerprint**:
- Open the attendance terminal page
- Open browser console (F12)
- The system will generate a device fingerprint
- Copy the fingerprint and register it in Settings

### Issue: "Invalid PIN" Error

**Problem**: PIN code is incorrect or not set.

**Solution**:
1. Verify the PIN code in Settings → Branch Management
2. Edit the branch and check the "Attendance PIN Code" field
3. Make sure you're entering the correct PIN
4. If PIN is forgotten, you can reset it in the branch settings

### Issue: "Location Not Within Branch" Error

**Problem**: Device location is outside the branch's allowed radius.

**Solution**:
1. **Check Branch Coordinates**:
   - Go to Settings → Branch Management
   - Edit the branch
   - Verify that latitude and longitude are correct
   - Use Google Maps to get accurate coordinates

2. **Check Location Tolerance**:
   - Increase the "Location Tolerance" (meters) if the branch is in a large building
   - Default: 100 meters
   - Recommended: 50-100 meters for accuracy

3. **Check Browser Geolocation**:
   - Make sure browser geolocation is enabled
   - Grant location permission when prompted
   - Check if GPS is enabled on the device

4. **Verify Location Accuracy**:
   - Open Google Maps on the device
   - Check if the location is accurate
   - If location is inaccurate, the system may reject attendance

### Issue: Device Not Found After Registration

**Problem**: Device was registered but still shows as unauthorized.

**Solution**:
1. **Verify Device Registration**:
   - Go to Settings → Branch Management
   - Select the branch
   - Check if the device appears in the "Verified Devices" list
   - Verify that the device is marked as "Active"

2. **Check Device Fingerprint**:
   - Make sure the device fingerprint matches exactly
   - Device fingerprints are case-sensitive
   - Regenerate the fingerprint if unsure

3. **Clear Browser Cache**:
   - Clear browser cache and cookies
   - Refresh the page
   - Try accessing the attendance terminal again

4. **Check Branch Selection**:
   - Make sure you selected the correct branch when registering the device
   - Each branch has its own list of registered devices

### Issue: Activity Logs Not Showing

**Problem**: Activity logs are not appearing in the logs viewer.

**Solution**:
1. **Check Activity Logging Settings**:
   - Go to Settings → Branch Management
   - Edit the branch
   - Verify that "Enable Activity Logging" is enabled

2. **Check Branch Selection**:
   - Make sure you selected the correct branch
   - Activity logs are filtered by branch

3. **Check Filters**:
   - Clear all filters in the activity logs modal
   - Click "Apply Filters" to refresh the logs

4. **Check Date Range**:
   - Make sure the date range includes the time when activity occurred
   - Activity logs are filtered by the `created_at` timestamp

### Issue: PIN Session Expired

**Problem**: PIN session has expired and needs to be re-entered.

**Solution**:
1. **Re-enter PIN**:
   - Enter the branch PIN code again
   - Click "Submit" to continue

2. **Check Session Duration**:
   - Go to Settings → Branch Management
   - Edit the branch
   - Check the "PIN Session Duration" setting
   - Increase the duration if sessions expire too quickly

3. **Enable "Require PIN for Each Session"**:
   - If you want PIN to be required every time, enable this option
   - This ensures PIN is always required, regardless of session duration

---

## 7. Best Practices

### Security Configuration

1. **Enable All Security Features**:
   - Enable device verification, geo-location verification, and PIN access control
   - This provides multiple layers of security

2. **Set Accurate Coordinates**:
   - Use Google Maps to get precise branch coordinates
   - Set appropriate location tolerance (50-100 meters)

3. **Use Strong PIN Codes**:
   - Use a PIN code that is not easily guessed
   - Change PIN codes regularly
   - Don't share PIN codes with unauthorized personnel

4. **Register Only Authorized Devices**:
   - Only register devices that will be used at the branch
   - Deactivate devices that are no longer in use
   - Delete devices that are permanently removed

5. **Monitor Activity Logs**:
   - Review activity logs regularly
   - Look for suspicious activity (failed attempts, blocked devices)
   - Take action if abuse is detected

### Device Registration

1. **Use Descriptive Device Names**:
   - Use clear, descriptive names (e.g., "Main Branch Kiosk", "Reception Desktop")
   - This makes it easier to identify devices in the logs

2. **Register Devices at Branch Location**:
   - Register devices at the actual branch location
   - This ensures the device fingerprint is generated correctly

3. **Keep Device List Updated**:
   - Remove devices that are no longer in use
   - Deactivate devices temporarily if needed
   - Reactivate devices when they're back in use

### Geo-location Configuration

1. **Get Accurate Coordinates**:
   - Use Google Maps to get precise coordinates
   - Right-click on the exact branch location
   - Copy the latitude and longitude

2. **Set Appropriate Tolerance**:
   - Small branch (single building): 50 meters
   - Medium branch (multiple buildings): 100 meters
   - Large branch (campus): 200-500 meters
   - **Note**: Larger tolerance reduces security but may be necessary for large premises

3. **Test Location Accuracy**:
   - Test the location verification at the branch
   - Make sure attendance can be recorded within the branch
   - Adjust tolerance if needed

### PIN Management

1. **Use Secure PIN Codes**:
   - Use 6-20 character PIN codes
   - Mix numbers and letters if possible
   - Don't use easily guessable PINs (e.g., "1234", "0000")

2. **Change PIN Codes Regularly**:
   - Change PIN codes every 3-6 months
   - Notify authorized staff when PIN changes

3. **Manage PIN Sessions**:
   - Use "Require PIN for each session" for maximum security
   - Use session duration for convenience (e.g., 24 hours)

---

## 8. Security Features Summary

### Device Verification
- **Purpose**: Only allow pre-registered devices to access the attendance terminal
- **How it works**: System checks if device fingerprint is registered for the branch
- **When to use**: Enable for all branches to prevent unauthorized device access
- **Configuration**: Register devices in Settings → Branch Management

### Geo-location Verification
- **Purpose**: Ensure attendance is only recorded within branch location
- **How it works**: System checks if device location is within branch coordinates (with tolerance)
- **When to use**: Enable for all branches to prevent remote attendance recording
- **Configuration**: Set branch coordinates and tolerance in branch settings

### PIN Access Control
- **Purpose**: Require PIN code to access the attendance terminal
- **How it works**: System prompts for PIN code before allowing access
- **When to use**: Enable for all branches to prevent unauthorized access
- **Configuration**: Set PIN code and session duration in branch settings

### Activity Logging
- **Purpose**: Log all attendance terminal access attempts for auditing
- **How it works**: System logs all access attempts (success, failed, blocked)
- **When to use**: Enable for all branches to monitor attendance terminal usage
- **Configuration**: Enable activity logging in branch settings (enabled by default)

---

## 9. Example Configuration

### Example 1: High Security Branch

**Settings**:
- ✅ Device Verification: Enabled
- ✅ Geo-location Verification: Enabled
  - Latitude: `14.5995`
  - Longitude: `120.9842`
  - Tolerance: `50` meters
- ✅ PIN Access Control: Enabled
  - PIN: `BRANCH2024`
  - Require PIN for each session: ✅ Enabled
- ✅ Activity Logging: Enabled

**Devices**:
- Main Branch Kiosk (Active)
- Reception Desktop (Active)
- Manager Laptop (Active)

**Result**: Maximum security - only registered devices at branch location with PIN can access the terminal.

### Example 2: Medium Security Branch

**Settings**:
- ✅ Device Verification: Enabled
- ✅ Geo-location Verification: Enabled
  - Latitude: `14.6042`
  - Longitude: `120.9822`
  - Tolerance: `100` meters
- ✅ PIN Access Control: Enabled
  - PIN: `1234`
  - Require PIN for each session: ❌ Disabled
  - PIN Session Duration: `24` hours
- ✅ Activity Logging: Enabled

**Devices**:
- Branch Kiosk (Active)

**Result**: Balanced security - registered devices at branch location with PIN session (valid for 24 hours).

### Example 3: Low Security Branch (Testing)

**Settings**:
- ❌ Device Verification: Disabled
- ❌ Geo-location Verification: Disabled
- ❌ PIN Access Control: Disabled
- ✅ Activity Logging: Enabled

**Devices**: None required

**Result**: No security restrictions - anyone can access the terminal (for testing only).

---

## 10. Frequently Asked Questions (FAQ)

### Q: Can I use the same device for multiple branches?
**A**: Yes, but you need to register the device for each branch separately. Each branch has its own list of registered devices.

### Q: What happens if I lose the device fingerprint?
**A**: You can regenerate the device fingerprint by clicking "Generate" in the device registration form. However, the new fingerprint will be different, so you'll need to re-register the device.

### Q: Can I change the PIN code after it's set?
**A**: Yes, you can change the PIN code by editing the branch and updating the "Attendance PIN Code" field.

### Q: What if the branch moves to a new location?
**A**: Update the branch coordinates in the branch settings. The system will use the new coordinates for geo-location verification.

### Q: Can I disable security features temporarily?
**A**: Yes, you can disable any security feature by editing the branch and unchecking the corresponding option. However, this reduces security, so use with caution.

### Q: How do I know if a device is registered?
**A**: Go to Settings → Branch Management, select the branch, and check the "Verified Devices" list. Registered devices will appear in the list.

### Q: What if I forget which branch a device is registered to?
**A**: You can search for the device fingerprint in the activity logs or check all branches' device lists.

### Q: Can I export activity logs?
**A**: Currently, activity logs can only be viewed in the Settings page. Export functionality can be added in the future.

### Q: How long are activity logs kept?
**A**: Activity logs are kept indefinitely unless manually deleted. You can filter logs by date range to view specific periods.

### Q: What if the attendance terminal is used offline?
**A**: If the device is offline, security checks may fail. The system will attempt to log the activity when connectivity is restored.

---

## 11. Support and Maintenance

### Regular Maintenance Tasks

1. **Review Activity Logs** (Weekly)
   - Check for suspicious activity
   - Look for failed attempts or blocked devices
   - Take action if abuse is detected

2. **Update Device List** (Monthly)
   - Remove devices that are no longer in use
   - Register new devices as needed
   - Verify that all active devices are still in use

3. **Change PIN Codes** (Quarterly)
   - Change PIN codes every 3-6 months
   - Notify authorized staff when PIN changes
   - Update PIN in branch settings

4. **Verify Branch Coordinates** (As Needed)
   - Verify that branch coordinates are still accurate
   - Update coordinates if branch moves
   - Test location verification at the branch

### Getting Help

If you encounter issues or need assistance:

1. **Check Troubleshooting Section**: Review the troubleshooting section above
2. **Check Activity Logs**: Review activity logs for error messages
3. **Verify Settings**: Verify that security settings are configured correctly
4. **Contact Support**: Contact your system administrator for assistance

---

## 12. Security Recommendations

### For Production Use

1. **Enable All Security Features**:
   - Device Verification: ✅ Enabled
   - Geo-location Verification: ✅ Enabled
   - PIN Access Control: ✅ Enabled
   - Activity Logging: ✅ Enabled

2. **Use Strong PIN Codes**:
   - Minimum 8 characters
   - Mix of numbers and letters
   - Changed regularly

3. **Set Appropriate Location Tolerance**:
   - 50-100 meters for most branches
   - Larger tolerance only if necessary

4. **Register Only Authorized Devices**:
   - Only register devices that will be used at the branch
   - Remove devices that are no longer in use

5. **Monitor Activity Logs**:
   - Review logs regularly
   - Look for suspicious activity
   - Take action if abuse is detected

### For Testing

1. **Disable Security Features Temporarily**:
   - Disable device verification for testing
   - Disable geo-location verification for testing
   - Disable PIN access control for testing
   - **Note**: Re-enable security features after testing

2. **Use Test Devices**:
   - Register test devices for testing
   - Remove test devices after testing

3. **Use Test Coordinates**:
   - Use test coordinates for testing
   - Update to actual coordinates after testing

---

## Conclusion

The attendance terminal security features provide multiple layers of protection to ensure that attendance is only recorded from authorized devices and locations. By following this guide, you can configure and use these features effectively to secure your attendance terminal system.

For additional assistance, refer to the troubleshooting section or contact your system administrator.

