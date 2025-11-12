# Attendance Terminal Device Registration - Quick Guide

## Quick Start: Registering a Device

### Step 1: Get Device Fingerprint

**Option A: Generate Fingerprint in Settings**
1. Go to Settings → Branch Management
2. Select a branch
3. Click "Register Device"
4. Click "Generate" button to generate a device fingerprint
5. Copy the generated fingerprint

**Option B: Get Fingerprint from Attendance Terminal Page**
1. Open the attendance terminal page in the browser where you want to register the device
2. Open browser console (F12 → Console tab)
3. Run this code to generate a fingerprint:
```javascript
// Generate device fingerprint
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
// Copy this fingerprint
```
4. Copy the fingerprint from the console

**Option C: Use Browser Extension** (Future)
- A browser extension can be developed to automatically generate and copy the fingerprint

### Step 2: Register Device in Settings

1. **Go to Settings Page**
   - Navigate to Settings → Branch Management
   - Scroll to "Attendance Terminal Security" section

2. **Select Branch**
   - Select the branch from the dropdown: "Select Branch to Configure Security"

3. **Click "Register Device"**
   - Click the "Register Device" button

4. **Fill in Device Information**
   - **Device Name**: Enter a descriptive name (e.g., "Main Branch Kiosk", "Reception Desktop")
   - **Device Fingerprint**: Paste the fingerprint you generated/copied
   - **Device Type**: Select from dropdown (Kiosk, Desktop, Laptop, Tablet)

5. **Save Device**
   - Click "Register Device" to save
   - The device will appear in the "Verified Devices" list

### Step 3: Verify Device Registration

1. **Check Device List**
   - The device should appear in the "Verified Devices" list
   - Status should be "Active"
   - Device fingerprint should be displayed (truncated)

2. **Test Device Access**
   - Open the attendance terminal page on the registered device
   - If device verification is enabled, the device should be recognized
   - You should be able to access the attendance terminal

---

## Device Registration Workflow

### Complete Workflow

```
1. Admin decides to register a device for a branch
   ↓
2. Admin opens the attendance terminal page on the device to be registered
   ↓
3. Admin gets the device fingerprint (generate or copy from console)
   ↓
4. Admin goes to Settings → Branch Management
   ↓
5. Admin selects the branch
   ↓
6. Admin clicks "Register Device"
   ↓
7. Admin fills in device information (name, fingerprint, type)
   ↓
8. Admin clicks "Register Device" to save
   ↓
9. Device appears in "Verified Devices" list
   ↓
10. Device can now access the attendance terminal (if device verification is enabled)
```

---

## Device Fingerprint Generation

### What is a Device Fingerprint?

A device fingerprint is a unique identifier generated from browser and device characteristics, including:
- User Agent (browser information)
- Language settings
- Screen resolution
- Timezone
- Canvas fingerprint (browser rendering characteristics)

### How to Generate Fingerprint

**Method 1: Using Settings Page (Easiest)**
1. Go to Settings → Branch Management
2. Select a branch
3. Click "Register Device"
4. Click "Generate" button
5. Copy the generated fingerprint

**Method 2: Using Browser Console**
1. Open the attendance terminal page
2. Open browser console (F12)
3. Paste and run this code:
```javascript
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
```
4. Copy the fingerprint from the console

**Method 3: Using Attendance Terminal Page (Future)**
- The attendance terminal page will automatically generate and display the fingerprint
- Copy the fingerprint from the page

---

## Device Management

### Viewing Registered Devices

1. **Go to Settings → Branch Management**
2. **Select a branch** from the dropdown
3. **View "Verified Devices" section**
   - List of all registered devices for the branch
   - Each device shows:
     - Device Name
     - Device Type
     - Status (Active/Inactive)
     - Device Fingerprint (truncated)
     - Registered By (admin user)
     - Last Used timestamp

### Deactivating a Device

1. **Find the device** in the "Verified Devices" list
2. **Click the "Ban" icon** (🚫) next to the device
3. **Confirm the deactivation**
4. **Device status changes to "Inactive"**
   - Device can no longer access the attendance terminal
   - Device remains in the database (can be reactivated)

### Deleting a Device

1. **Find the device** in the "Verified Devices" list
2. **Click the "Trash" icon** (🗑️) next to the device
3. **Confirm the deletion**
4. **Device is removed from the database**
   - **Warning**: This action cannot be undone
   - Device must be re-registered if needed again

### Reactivating a Device

**Current Method**:
1. Delete the device
2. Re-register the device with the same fingerprint

**Future Enhancement**:
- Add "Reactivate" button to reactivate deactivated devices

---

## Troubleshooting Device Registration

### Issue: "Device already registered" Error

**Problem**: Device fingerprint is already registered for the branch.

**Solution**:
1. Check if the device is already in the "Verified Devices" list
2. If device is inactive, delete it and re-register
3. If device is active, no action needed (device is already registered)

### Issue: Device Not Recognized After Registration

**Problem**: Device was registered but still shows as unauthorized.

**Solutions**:
1. **Verify Device Fingerprint**:
   - Make sure the fingerprint matches exactly
   - Device fingerprints are case-sensitive
   - Regenerate the fingerprint if unsure

2. **Check Branch Selection**:
   - Make sure you selected the correct branch
   - Each branch has its own list of registered devices

3. **Check Device Status**:
   - Verify that the device is marked as "Active"
   - Deactivated devices cannot access the terminal

4. **Clear Browser Cache**:
   - Clear browser cache and cookies
   - Refresh the page
   - Try accessing the attendance terminal again

5. **Check Device Verification Setting**:
   - Verify that "Enable Device Verification" is enabled in branch settings
   - If disabled, device verification is not enforced

### Issue: Fingerprint Generation Fails

**Problem**: Cannot generate device fingerprint.

**Solution**:
1. **Check Browser Console**:
   - Open browser console (F12)
   - Check for JavaScript errors
   - Fix any errors if present

2. **Use Manual Generation**:
   - Use the browser console method to generate fingerprint
   - Copy the fingerprint manually

3. **Check Browser Compatibility**:
   - Make sure you're using a modern browser (Chrome, Firefox, Edge, Safari)
   - Older browsers may not support fingerprint generation

---

## Best Practices for Device Registration

### 1. Use Descriptive Device Names
- **Good**: "Main Branch Kiosk", "Reception Desktop", "Manager Laptop"
- **Bad**: "Device 1", "Computer", "Laptop"

### 2. Register Devices at Branch Location
- Register devices at the actual branch location
- This ensures the device fingerprint is generated correctly
- Also ensures geo-location works correctly

### 3. Register All Authorized Devices
- Register all devices that will be used at the branch
- Don't register devices that won't be used
- Remove devices that are no longer in use

### 4. Keep Device List Updated
- Regularly review the device list
- Remove devices that are no longer in use
- Deactivate devices temporarily if needed
- Reactivate devices when they're back in use

### 5. Document Device Registration
- Keep a record of which devices are registered for which branch
- Document device names and types
- This helps with troubleshooting and management

---

## Security Considerations

### Device Fingerprint Security

1. **Fingerprint Uniqueness**:
   - Device fingerprints are unique to each device/browser combination
   - Same device with different browser = different fingerprint
   - Same browser on different device = different fingerprint

2. **Fingerprint Spoofing**:
   - Device fingerprints can be spoofed with advanced techniques
   - Use additional security measures (geo-location, PIN) for maximum security
   - Don't rely solely on device fingerprint for security

3. **Fingerprint Privacy**:
   - Device fingerprints don't contain personal information
   - They're based on browser and device characteristics
   - Safe to store in the database

### Device Registration Security

1. **Register Only Authorized Devices**:
   - Only register devices that will be used at the branch
   - Don't register devices for testing unless necessary
   - Remove test devices after testing

2. **Monitor Device Usage**:
   - Review activity logs to see which devices are being used
   - Look for unusual device usage patterns
   - Take action if unauthorized devices are detected

3. **Deactivate Unused Devices**:
   - Deactivate devices that are no longer in use
   - Delete devices that are permanently removed
   - Keep the device list clean and up-to-date

---

## Example: Registering a Kiosk Device

### Scenario
You want to register a kiosk device at the Main Branch for the attendance terminal.

### Steps

1. **Physical Setup**
   - Set up the kiosk device at the Main Branch
   - Connect it to the network
   - Open the attendance terminal page in the browser

2. **Get Device Fingerprint**
   - Open browser console (F12)
   - Run the fingerprint generation code
   - Copy the fingerprint (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`)

3. **Register Device in Settings**
   - Go to Settings → Branch Management
   - Select "Main Branch" from the dropdown
   - Click "Register Device"
   - Fill in:
     - Device Name: `Main Branch Kiosk`
     - Device Fingerprint: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`
     - Device Type: `Kiosk`
   - Click "Register Device"

4. **Verify Registration**
   - Check that the device appears in "Verified Devices" list
   - Status should be "Active"
   - Device fingerprint should be displayed (truncated)

5. **Test Device Access**
   - Open the attendance terminal page on the kiosk
   - If device verification is enabled, the device should be recognized
   - You should be able to access the attendance terminal

---

## Quick Reference

### Device Registration Checklist
- [ ] Device is set up at branch location
- [ ] Device fingerprint is generated
- [ ] Branch is selected in Settings
- [ ] Device information is filled in (name, fingerprint, type)
- [ ] Device is registered and appears in "Verified Devices" list
- [ ] Device status is "Active"
- [ ] Device can access the attendance terminal

### Device Management Actions
- **Register Device**: Add a new device to the branch
- **Deactivate Device**: Mark device as inactive (cannot access terminal)
- **Delete Device**: Remove device from database (cannot be undone)
- **View Devices**: See all registered devices for a branch

### Device Registration Fields
- **Device Name**: Descriptive name for the device
- **Device Fingerprint**: Unique identifier (64 characters)
- **Device Type**: Kiosk, Desktop, Laptop, or Tablet

---

## Conclusion

Device registration is a crucial part of the attendance terminal security system. By following this guide, you can successfully register devices and manage them effectively. Remember to:

1. Register only authorized devices
2. Use descriptive device names
3. Keep the device list updated
4. Monitor device usage through activity logs
5. Deactivate or delete unused devices

For additional assistance, refer to the main user guide or contact your system administrator.

