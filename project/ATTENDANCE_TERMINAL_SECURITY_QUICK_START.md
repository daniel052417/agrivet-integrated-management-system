# Attendance Terminal Security - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Database Migration (One Time Only)
1. Open Supabase SQL Editor
2. Copy and paste the content from `project/supabase/migrations/add_attendance_terminal_security.sql`
3. Click "Run" to execute
4. Verify migration success (check for tables and columns)

### Step 2: Configure Branch Security
1. Go to **Settings** → **Branch Management**
2. Click **"Edit Branch"** on the branch you want to configure
3. Scroll to **"Attendance Terminal Security"** section
4. Configure security settings (see configuration options below)
5. Click **"Update Branch"** to save

### Step 3: Register Devices
1. Go to **Settings** → **Branch Management**
2. Select the branch from **"Select Branch to Configure Security"** dropdown
3. Click **"Register Device"** button
4. Fill in device information and click **"Register Device"**

---

## 📋 Configuration Options

### Option 1: High Security (Recommended for Production)
```
✅ Device Verification: Enabled
✅ Geo-location Verification: Enabled
   - Latitude: [Your branch latitude]
   - Longitude: [Your branch longitude]
   - Tolerance: 50-100 meters
✅ PIN Access Control: Enabled
   - PIN: [Your secure PIN code]
   - Require PIN for each session: ✅ Enabled
✅ Activity Logging: Enabled
```

### Option 2: Medium Security (Balanced)
```
✅ Device Verification: Enabled
✅ Geo-location Verification: Enabled
   - Latitude: [Your branch latitude]
   - Longitude: [Your branch longitude]
   - Tolerance: 100 meters
✅ PIN Access Control: Enabled
   - PIN: [Your PIN code]
   - Require PIN for each session: ❌ Disabled
   - PIN Session Duration: 24 hours
✅ Activity Logging: Enabled
```

### Option 3: Low Security (Testing Only)
```
❌ Device Verification: Disabled
❌ Geo-location Verification: Disabled
❌ PIN Access Control: Disabled
✅ Activity Logging: Enabled
```

---

## 🔐 Device Registration - Step by Step

### Method 1: Register from Settings (Recommended)

**Step 1: Get Device Fingerprint**
```
1. Open attendance terminal page on the device
2. Open browser console (F12)
3. Copy and paste this code:
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   ctx.fillText('Device fingerprint', 2, 2);
   const canvasFingerprint = canvas.toDataURL();
   const fingerprint = btoa(
     navigator.userAgent +
     navigator.language +
     screen.width + screen.height +
     new Date().getTimezoneOffset() +
     canvasFingerprint
   ).substring(0, 64);
   console.log('Device Fingerprint:', fingerprint);
4. Copy the fingerprint from console
```

**Step 2: Register Device**
```
1. Go to Settings → Branch Management
2. Select branch from dropdown
3. Click "Register Device"
4. Fill in:
   - Device Name: "Main Branch Kiosk"
   - Device Fingerprint: [Paste fingerprint]
   - Device Type: Kiosk
5. Click "Register Device"
```

**Step 3: Verify Registration**
```
1. Check "Verified Devices" list
2. Device should appear with "Active" status
3. Test device access on attendance terminal page
```

### Method 2: Generate Fingerprint in Settings

**Step 1: Open Device Registration**
```
1. Go to Settings → Branch Management
2. Select branch from dropdown
3. Click "Register Device"
```

**Step 2: Generate Fingerprint**
```
1. Click "Generate" button
2. Fingerprint will be automatically generated
3. Copy the generated fingerprint
```

**Step 3: Complete Registration**
```
1. Enter Device Name: "Main Branch Kiosk"
2. Device Fingerprint: [Already filled from Generate]
3. Select Device Type: Kiosk
4. Click "Register Device"
```

---

## 📍 Getting Branch Coordinates

### Using Google Maps

1. **Open Google Maps**
   - Go to https://maps.google.com
   - Search for your branch address

2. **Get Coordinates**
   - Right-click on the exact branch location
   - Click "What's here?" or click on the coordinates
   - Copy the latitude and longitude
   - Example: `14.5995, 120.9842`

3. **Enter Coordinates in Settings**
   - Go to Settings → Branch Management
   - Edit the branch
   - Scroll to "Attendance Terminal Security"
   - Enable "Enable Geo-location Verification"
   - Paste latitude: `14.5995`
   - Paste longitude: `120.9842`
   - Set tolerance: `100` meters

---

## 🔑 PIN Access Control Setup

### Setting Up PIN

1. **Enable PIN Access Control**
   - Go to Settings → Branch Management
   - Edit the branch
   - Enable "Enable PIN Access Control"

2. **Set PIN Code**
   - Enter PIN code (4-20 characters)
   - Example: `BRANCH2024` or `1234`
   - **Important**: Keep PIN secure and share only with authorized staff

3. **Configure Session Settings**
   - **Option A**: Require PIN for each session (Maximum Security)
     - Check "Require PIN for each session"
     - PIN must be entered every time
   - **Option B**: PIN session duration (Convenience)
     - Uncheck "Require PIN for each session"
     - Set "PIN Session Duration": 24 hours
     - PIN is valid for 24 hours after first entry

4. **Save Settings**
   - Click "Update Branch" to save

### Using PIN

1. **Access Attendance Terminal**
   - Open attendance terminal page
   - If PIN access is enabled, you'll see a PIN entry screen

2. **Enter PIN**
   - Enter the branch PIN code
   - Click "Submit" or press Enter

3. **Continue to Terminal**
   - If PIN is correct → Continue to attendance terminal
   - If PIN is incorrect → Show error message

---

## 📊 Viewing Activity Logs

### Quick View

1. **Go to Settings → Branch Management**
2. **Select branch** from dropdown
3. **Scroll to "Activity Logs" section**
4. **View recent logs** (last 10 logs)

### Detailed View

1. **Click "View All Logs" button**
2. **Use Filters**:
   - **Action Type**: Filter by action (Time In, Time Out, Access Denied, etc.)
   - **Status**: Filter by status (Success, Failed, Blocked)
   - **Start Date**: Filter by start date
   - **End Date**: Filter by end date
3. **Click "Apply Filters"** to filter logs
4. **View Log Details**:
   - Timestamp
   - Action Type
   - Status
   - Device Name
   - Staff Name
   - Status Reason
   - Location (if available)

---

## 🔍 Security Status Check

### View Security Status

1. **Go to Settings → Branch Management**
2. **Select branch** from dropdown
3. **View "Security Status" section**
   - Device Verification: Enabled/Disabled
   - Geo-location: Enabled/Disabled
   - PIN Access: Enabled/Disabled
   - Coordinates: Set/Not Set

### Check Security Configuration

1. **Edit Branch**
   - Click "Edit Branch" button
   - Scroll to "Attendance Terminal Security" section
   - Check security settings:
     - ✅ Device Verification: Enabled/Disabled
     - ✅ Geo-location Verification: Enabled/Disabled
     - ✅ PIN Access Control: Enabled/Disabled
     - ✅ Activity Logging: Enabled/Disabled

---

## 🛠️ Common Tasks

### Task 1: Register a New Device

**Quick Steps**:
1. Go to Settings → Branch Management
2. Select branch
3. Click "Register Device"
4. Generate or paste fingerprint
5. Enter device name and type
6. Click "Register Device"

### Task 2: Deactivate a Device

**Quick Steps**:
1. Go to Settings → Branch Management
2. Select branch
3. Find device in "Verified Devices" list
4. Click "Ban" icon (🚫)
5. Confirm deactivation

### Task 3: Change PIN Code

**Quick Steps**:
1. Go to Settings → Branch Management
2. Edit branch
3. Scroll to "Attendance Terminal Security"
4. Update "Branch PIN Code" field
5. Click "Update Branch"

### Task 4: Update Branch Coordinates

**Quick Steps**:
1. Go to Settings → Branch Management
2. Edit branch
3. Scroll to "Attendance Terminal Security"
4. Update latitude and longitude
5. Click "Update Branch"

### Task 5: View Activity Logs

**Quick Steps**:
1. Go to Settings → Branch Management
2. Select branch
3. Scroll to "Activity Logs" section
4. Click "View All Logs" for detailed view
5. Use filters to filter logs

---

## ⚠️ Troubleshooting Quick Fixes

### Issue: "Unauthorized Device" Error
**Fix**: Register the device in Settings → Branch Management

### Issue: "Invalid PIN" Error
**Fix**: Verify PIN code in branch settings or contact admin

### Issue: "Location Not Within Branch" Error
**Fix**: Check branch coordinates and increase tolerance if needed

### Issue: Device Not Found After Registration
**Fix**: Verify device fingerprint matches exactly and device is active

### Issue: Activity Logs Not Showing
**Fix**: Check activity logging is enabled and filters are cleared

---

## 📝 Quick Reference Card

### Security Settings
- **Device Verification**: Enable to restrict access to registered devices
- **Geo-location Verification**: Enable to restrict access to branch location
- **PIN Access Control**: Enable to require PIN code for access
- **Activity Logging**: Enable to log all access attempts

### Device Registration
- **Device Name**: Descriptive name (e.g., "Main Branch Kiosk")
- **Device Fingerprint**: Unique identifier (64 characters)
- **Device Type**: Kiosk, Desktop, Laptop, or Tablet

### Branch Configuration
- **Latitude**: Branch latitude coordinate (e.g., 14.5995)
- **Longitude**: Branch longitude coordinate (e.g., 120.9842)
- **Tolerance**: Maximum distance from branch (meters, default: 100)
- **PIN Code**: Branch PIN code (4-20 characters)
- **Session Duration**: PIN session duration (hours, default: 24)

### Activity Logs
- **Action Type**: Time In, Time Out, Access Denied, etc.
- **Status**: Success, Failed, Blocked, Warning
- **Filters**: Action type, status, date range

---

## 🎯 Best Practices

### Security
1. ✅ Enable all security features for maximum security
2. ✅ Use strong PIN codes (8+ characters, mixed alphanumeric)
3. ✅ Set accurate branch coordinates
4. ✅ Register only authorized devices
5. ✅ Monitor activity logs regularly

### Device Management
1. ✅ Use descriptive device names
2. ✅ Register devices at branch location
3. ✅ Keep device list updated
4. ✅ Remove unused devices
5. ✅ Monitor device usage

### Configuration
1. ✅ Test security settings before production
2. ✅ Set appropriate location tolerance
3. ✅ Change PIN codes regularly
4. ✅ Review activity logs weekly
5. ✅ Update branch coordinates if branch moves

---

## 📞 Support

### Getting Help
1. **Check Troubleshooting Section**: Review troubleshooting in user guide
2. **Check Activity Logs**: Review activity logs for error messages
3. **Verify Settings**: Verify security settings are configured correctly
4. **Contact Support**: Contact system administrator for assistance

### Useful Links
- **User Guide**: `ATTENDANCE_TERMINAL_SECURITY_USER_GUIDE.md`
- **Device Registration Guide**: `ATTENDANCE_TERMINAL_DEVICE_REGISTRATION_GUIDE.md`
- **Implementation Guide**: `ATTENDANCE_TERMINAL_SECURITY_IMPLEMENTATION.md`

---

## ✅ Checklist

### Initial Setup
- [ ] Run database migration
- [ ] Verify tables and columns were created
- [ ] Configure branch security settings
- [ ] Register devices for branch
- [ ] Test device access
- [ ] Test security features
- [ ] Review activity logs

### Regular Maintenance
- [ ] Review activity logs (weekly)
- [ ] Update device list (monthly)
- [ ] Change PIN codes (quarterly)
- [ ] Verify branch coordinates (as needed)
- [ ] Monitor security status (monthly)

---

## Conclusion

This quick start guide provides a fast overview of how to use the attendance terminal security features. For detailed information, refer to the complete user guide (`ATTENDANCE_TERMINAL_SECURITY_USER_GUIDE.md`).

Remember to:
1. Run the database migration first
2. Configure security settings for each branch
3. Register devices for each branch
4. Monitor activity logs regularly
5. Keep security settings updated

For additional assistance, refer to the troubleshooting section or contact your system administrator.

