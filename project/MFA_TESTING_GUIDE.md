# MFA (Multi-Factor Authentication) Testing Guide

## 📋 **Overview**

This guide explains how MFA works in the Security & Access settings and how to test it.

---

## 🔍 **Current Implementation Status**

### **✅ What's Implemented:**
- MFA **settings/configuration** in Security & Access tab
- Toggle to enable/disable MFA requirement
- Role selection (Super Admin, Cashier) for MFA enforcement
- Settings are saved to `system_settings` table

### **⚠️ What's NOT Yet Implemented:**
- **Actual MFA verification flow** during login
- **Email OTP generation and sending**
- **OTP verification step** in login process
- **Device/browser verification**

**Note**: Currently, MFA settings are **configuration only**. The actual MFA enforcement during login needs to be implemented in the authentication service.

---

## 🧪 **How to Test MFA Settings (Current Functionality)**

### **Test 1: Enable/Disable MFA Settings**

1. Navigate to **Settings** → **Security & Access** tab
2. Scroll to **"Require MFA (Email OTP)"** toggle
3. **Toggle it ON**
4. **Verify checkboxes appear**:
   - ☑ Super Admin (checked by default)
   - ☑ Cashier (checked by default)
5. **Uncheck "Cashier"** (leave only Super Admin checked)
6. Click **Save Settings**
7. **Verify success message** appears

### **Test 2: Verify Settings Persist**

1. **Refresh the browser page** (F5)
2. Navigate back to **Security & Access** tab
3. **Verify**:
   - Require MFA = ✓ (checked)
   - Super Admin = ✓ (checked)
   - Cashier = ✗ (unchecked)

### **Test 3: Verify in Database**

Run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  value->'security'->'requireMFA' as require_mfa,
  value->'security'->'mfaAppliesTo' as mfa_applies_to
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**:
```json
{
  "requireMFA": true,
  "mfaAppliesTo": {
    "superAdmin": true,
    "cashier": false
  }
}
```

---

## 🚀 **When Will MFA Actually Appear? (Future Implementation)**

### **Scenario 1: Login on New Device** (When Implemented)

When MFA is enabled and a user logs in from a new/unverified device:

1. **User enters email/password** → Login succeeds
2. **System checks**:
   - Is MFA required? (`requireMFA = true`)
   - Is user's role in `mfaAppliesTo`? (Super Admin or Cashier)
   - Is this a new/unverified device?
3. **If all conditions met**:
   - **Step 1**: System generates OTP code
   - **Step 2**: System sends OTP to user's email
   - **Step 3**: User sees **"Enter OTP Code"** screen
   - **Step 4**: User enters OTP from email
   - **Step 5**: System verifies OTP
   - **Step 6**: If valid, login completes
   - **Step 7**: If invalid, show error and allow retry

### **Scenario 2: Login on Verified Device** (When Implemented)

If the device is already verified:

1. **User enters email/password** → Login succeeds
2. **System checks**: Device is verified
3. **MFA is skipped** (trusted device)
4. **Login completes immediately**

### **Scenario 3: MFA Not Required** (Current Behavior)

If MFA is disabled or user's role is not in `mfaAppliesTo`:

1. **User enters email/password** → Login succeeds
2. **No MFA step** (normal login)
3. **Login completes immediately**

---

## 📝 **What Needs to Be Implemented for Full MFA**

### **1. OTP Generation Service**

```typescript
// Example structure (needs implementation)
class OTPService {
  generateOTP(userId: string): string {
    // Generate 6-digit code
    // Store in database with expiration (5 minutes)
    // Return OTP code
  }
  
  sendOTPEmail(email: string, otp: string): Promise<void> {
    // Send email with OTP code
  }
  
  verifyOTP(userId: string, otp: string): boolean {
    // Verify OTP code
    // Check expiration
    // Return true/false
  }
}
```

### **2. Update Login Flow**

In `customAuth.ts` or your authentication service:

```typescript
// After successful password verification
if (requireMFA && userRole in mfaAppliesTo) {
  // Check if device is verified
  if (!isDeviceVerified) {
    // Generate and send OTP
    const otp = await otpService.generateOTP(userId);
    await otpService.sendOTPEmail(user.email, otp);
    
    // Return intermediate state (not fully logged in)
    return { 
      requiresMFA: true,
      userId: userId,
      message: 'Please check your email for OTP code'
    };
  }
}
```

### **3. OTP Verification Endpoint**

```typescript
async verifyMFA(userId: string, otp: string): Promise<boolean> {
  const isValid = await otpService.verifyOTP(userId, otp);
  
  if (isValid) {
    // Mark device as verified
    // Complete login
    // Create session
    return true;
  }
  
  return false;
}
```

### **4. Database Tables Needed**

```sql
-- OTP codes table
CREATE TABLE mfa_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verified devices table
CREATE TABLE verified_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser_info JSONB,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);
```

---

## 🧪 **Testing MFA Settings (Current State)**

### **Quick Test Checklist:**

- [ ] MFA toggle can be enabled/disabled
- [ ] MFA checkboxes appear when toggle is ON
- [ ] Super Admin checkbox works
- [ ] Cashier checkbox works
- [ ] Settings save successfully
- [ ] Settings persist after page reload
- [ ] Settings appear correctly in database

### **Database Verification:**

```sql
-- Check MFA settings
SELECT 
  value->'security'->'requireMFA' as mfa_enabled,
  value->'security'->'mfaAppliesTo' as mfa_roles
FROM system_settings
WHERE key = 'app_settings';
```

---

## 🔮 **Future: Full MFA Testing (When Implemented)**

### **Test Flow 1: New Device Login**

1. **Enable MFA** in settings
2. **Check "Super Admin"** in MFA applies to
3. **Log in as Super Admin** from new browser/device
4. **Expected**: 
   - After password, see "Enter OTP Code" screen
   - Email received with 6-digit code
   - Enter OTP → Login completes
   - Device marked as verified

### **Test Flow 2: Verified Device Login**

1. **Same device** as Test Flow 1
2. **Log out**
3. **Log in again** with same user
4. **Expected**:
   - No OTP screen (device already verified)
   - Login completes immediately

### **Test Flow 3: MFA Not Required**

1. **Enable MFA** but uncheck user's role
2. **Log in** with that user
3. **Expected**:
   - No OTP screen
   - Normal login flow

---

## 📊 **Current vs. Future State**

| Feature | Current State | Future State (When Implemented) |
|---------|---------------|--------------------------------|
| MFA Settings | ✅ Working | ✅ Working |
| Enable/Disable Toggle | ✅ Working | ✅ Working |
| Role Selection | ✅ Working | ✅ Working |
| Settings Persistence | ✅ Working | ✅ Working |
| OTP Generation | ❌ Not Implemented | ⏳ Needs Implementation |
| OTP Email Sending | ❌ Not Implemented | ⏳ Needs Implementation |
| OTP Verification | ❌ Not Implemented | ⏳ Needs Implementation |
| Device Verification | ❌ Not Implemented | ⏳ Needs Implementation |
| MFA Enforcement | ❌ Not Implemented | ⏳ Needs Implementation |

---

## 🎯 **Summary**

**Current Status**: 
- ✅ MFA **configuration** is fully functional
- ✅ Settings can be saved and loaded correctly
- ❌ MFA **enforcement** during login is **not yet implemented**

**What You Can Test Now**:
- Enabling/disabling MFA requirement
- Selecting which roles require MFA
- Verifying settings persist in database

**What You Cannot Test Yet**:
- Actual MFA flow during login
- OTP code generation/receipt
- Device verification
- MFA enforcement

**Next Steps for Full MFA**:
1. Implement OTP generation service
2. Implement email sending for OTP
3. Update login flow to check MFA settings
4. Add OTP verification step
5. Implement device verification system

---

## 💡 **Notes**

- MFA settings are stored in `system_settings.value.security.requireMFA`
- MFA role selection is stored in `system_settings.value.security.mfaAppliesTo`
- Settings support both nested and flat key formats for backward compatibility
- When MFA is implemented, the login flow should check these settings before allowing login






