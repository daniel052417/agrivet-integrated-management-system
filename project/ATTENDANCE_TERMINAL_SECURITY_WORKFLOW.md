# Attendance Terminal Security - Workflow Guide

## 🔄 Complete Workflow

This document provides a visual workflow for setting up and using the Attendance Terminal Security system.

---

## 📊 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE TERMINAL SECURITY                  │
│                          WORKFLOW                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  1. SETUP       │
│  (One Time)     │
└────────┬────────┘
         │
         ├───► Run Database Migration
         │     └───► Execute SQL migration file
         │
         ├───► Verify Migration Success
         │     └───► Check tables and columns
         │
         └───► Setup Complete
               │
               ▼
┌─────────────────┐
│  2. CONFIGURE   │
│  BRANCH         │
└────────┬────────┘
         │
         ├───► Go to Settings → Branch Management
         │
         ├───► Edit Branch
         │     │
         │     ├───► Enable Device Verification
         │     │
         │     ├───► Enable Geo-location Verification
         │     │     ├───► Set Latitude
         │     │     ├───► Set Longitude
         │     │     └───► Set Tolerance (meters)
         │     │
         │     ├───► Enable PIN Access Control
         │     │     ├───► Set PIN Code
         │     │     ├───► Set Session Duration
         │     │     └───► Require PIN for Each Session
         │     │
         │     └───► Enable Activity Logging
         │
         └───► Save Branch Configuration
               │
               ▼
┌─────────────────┐
│  3. REGISTER    │
│  DEVICES        │
└────────┬────────┘
         │
         ├───► Go to Settings → Branch Management
         │
         ├───► Select Branch from Dropdown
         │
         ├───► Click "Register Device"
         │     │
         │     ├───► Method 1: Generate Fingerprint
         │     │     └───► Click "Generate" button
         │     │
         │     ├───► Method 2: Manual Entry
         │     │     └───► Paste device fingerprint
         │     │
         │     ├───► Enter Device Name
         │     │
         │     ├───► Select Device Type
         │     │     └───► Kiosk, Desktop, Laptop, Tablet
         │     │
         │     └───► Click "Register Device"
         │
         └───► Device Registered
               │
               ▼
┌─────────────────┐
│  4. TEST        │
│  SECURITY       │
└────────┬────────┘
         │
         ├───► Open Attendance Terminal Page
         │
         ├───► Test Device Verification
         │     └───► Verify device is recognized
         │
         ├───► Test Geo-location Verification
         │     └───► Verify location is within tolerance
         │
         ├───► Test PIN Access Control
         │     └───► Verify PIN entry works
         │
         └───► Test Activity Logging
               └───► Verify logs are created
               │
               ▼
┌─────────────────┐
│  5. MONITOR     │
│  ACTIVITY       │
└────────┬────────┘
         │
         ├───► Go to Settings → Branch Management
         │
         ├───► Select Branch from Dropdown
         │
         ├───► View Activity Logs
         │     │
         │     ├───► Quick View (Last 10 logs)
         │     │
         │     └───► Detailed View (All logs)
         │           ├───► Filter by Action Type
         │           ├───► Filter by Status
         │           ├───► Filter by Date Range
         │           └───► View Log Details
         │
         └───► Review Security Status
               │
               ▼
┌─────────────────┐
│  6. MAINTAIN    │
│  SYSTEM         │
└────────┬────────┘
         │
         ├───► Regular Tasks
         │     │
         │     ├───► Review Activity Logs (Weekly)
         │     │
         │     ├───► Update Device List (Monthly)
         │     │
         │     ├───► Change PIN Codes (Quarterly)
         │     │
         │     └───► Verify Branch Coordinates (As Needed)
         │
         └───► Maintenance Complete
```

---

## 🎯 Step-by-Step Workflow

### Step 1: Setup (One Time Only)

**Goal**: Prepare the database for attendance terminal security features.

**Actions**:
1. Open Supabase SQL Editor
2. Copy migration SQL from `add_attendance_terminal_security.sql`
3. Execute migration
4. Verify tables and columns were created

**Output**: Database is ready for security features.

---

### Step 2: Configure Branch

**Goal**: Configure security settings for each branch.

**Actions**:
1. Go to Settings → Branch Management
2. Click "Edit Branch" on the branch you want to configure
3. Scroll to "Attendance Terminal Security" section
4. Enable desired security features:
   - Device Verification
   - Geo-location Verification (set coordinates and tolerance)
   - PIN Access Control (set PIN and session settings)
   - Activity Logging
5. Click "Update Branch" to save

**Output**: Branch security settings are configured.

---

### Step 3: Register Devices

**Goal**: Register devices that are allowed to access the attendance terminal.

**Actions**:
1. Go to Settings → Branch Management
2. Select branch from dropdown
3. Click "Register Device" button
4. Generate or paste device fingerprint
5. Enter device name and type
6. Click "Register Device"

**Output**: Device is registered and can access the attendance terminal.

---

### Step 4: Test Security

**Goal**: Verify that security features are working correctly.

**Actions**:
1. Open attendance terminal page on registered device
2. Test device verification (device should be recognized)
3. Test geo-location verification (location should be within tolerance)
4. Test PIN access control (PIN entry should work)
5. Test activity logging (logs should be created)

**Output**: Security features are verified and working.

---

### Step 5: Monitor Activity

**Goal**: Monitor attendance terminal activity and security events.

**Actions**:
1. Go to Settings → Branch Management
2. Select branch from dropdown
3. View activity logs (quick view or detailed view)
4. Apply filters if needed (action type, status, date range)
5. Review log details
6. Check security status

**Output**: Activity is monitored and security status is known.

---

### Step 6: Maintain System

**Goal**: Keep the system secure and up-to-date.

**Actions**:
1. Review activity logs weekly
2. Update device list monthly (add/remove devices)
3. Change PIN codes quarterly
4. Verify branch coordinates as needed (if branch moves)
5. Monitor security status regularly

**Output**: System is maintained and secure.

---

## 🔐 Security Flow

### Device Access Flow

```
User Opens Attendance Terminal
         │
         ▼
┌────────────────────────┐
│ Device Verification    │
│ Enabled?               │
└────┬───────────────┬───┘
     │ Yes           │ No
     ▼               ▼
┌─────────┐    ┌──────────────┐
│ Check   │    │ Allow Access │
│ Device  │    │ (Skip Check) │
│         │    └──────────────┘
└────┬────┘
     │
     ├───► Device Registered?
     │     │
     │     ├───► Yes ──► Continue
     │     │
     │     └───► No ───► Block Access
     │                    └───► Log: "Device Blocked"
     │
     ▼
┌────────────────────────┐
│ Geo-location           │
│ Verification Enabled?  │
└────┬───────────────┬───┘
     │ Yes           │ No
     ▼               ▼
┌─────────┐    ┌──────────────┐
│ Check   │    │ Allow Access │
│ Location│    │ (Skip Check) │
│         │    └──────────────┘
└────┬────┘
     │
     ├───► Within Tolerance?
     │     │
     │     ├───► Yes ──► Continue
     │     │
     │     └───► No ───► Block Access
     │                    └───► Log: "Location Failed"
     │
     ▼
┌────────────────────────┐
│ PIN Access Control     │
│ Enabled?               │
└────┬───────────────┬───┘
     │ Yes           │ No
     ▼               ▼
┌─────────┐    ┌──────────────┐
│ Prompt  │    │ Allow Access │
│ PIN     │    │ (Skip Check) │
│         │    └──────────────┘
└────┬────┘
     │
     ├───► PIN Correct?
     │     │
     │     ├───► Yes ──► Continue
     │     │
     │     └───► No ───► Block Access
     │                    └───► Log: "PIN Failed"
     │
     ▼
┌────────────────────────┐
│ Allow Access to        │
│ Attendance Terminal    │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Log Activity:          │
│ "Access Granted"       │
└────────────────────────┘
```

---

## 📋 Checklist Workflow

### Initial Setup Checklist

- [ ] Run database migration
- [ ] Verify migration success
- [ ] Configure branch security settings
- [ ] Register devices
- [ ] Test security features
- [ ] Monitor activity logs
- [ ] Verify security status

### Regular Maintenance Checklist

- [ ] Review activity logs (weekly)
- [ ] Update device list (monthly)
- [ ] Change PIN codes (quarterly)
- [ ] Verify branch coordinates (as needed)
- [ ] Monitor security status (monthly)
- [ ] Review security settings (quarterly)

---

## 🎯 Quick Reference

### Setup Flow
1. Run migration → Configure branch → Register devices → Test → Monitor

### Security Flow
1. Device verification → Geo-location verification → PIN access → Allow access → Log activity

### Maintenance Flow
1. Review logs → Update devices → Change PIN → Verify coordinates → Monitor status

---

## 📞 Support

### Getting Help
1. Check workflow diagram for your current step
2. Refer to relevant guide for detailed instructions
3. Check troubleshooting section for common issues
4. Contact support if needed

### Useful Resources
- **Quick Start Guide**: For quick setup
- **User Guide**: For detailed instructions
- **Device Registration Guide**: For device-related tasks
- **Implementation Guide**: For technical implementation

---

## ✅ Conclusion

This workflow guide provides a visual representation of the complete setup and usage process for the Attendance Terminal Security system. Follow the workflow steps to set up and maintain the security features effectively.

For detailed instructions, refer to the relevant guides:
- **Quick Start Guide**: For quick setup
- **User Guide**: For detailed instructions
- **Device Registration Guide**: For device-related tasks

