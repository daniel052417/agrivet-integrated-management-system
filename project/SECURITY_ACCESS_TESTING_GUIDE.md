# Security & Access Tab - Testing Guide

## 🧪 **Complete Testing Guide**

This guide provides step-by-step instructions to verify that all Security & Access features are working correctly.

---

## 📋 **Prerequisites**

Before testing, ensure:
- [ ] You have access to the Settings page
- [ ] You have database access (Supabase dashboard or SQL client)
- [ ] You have at least 2 active user sessions (for logout testing)
- [ ] You have admin/super-admin privileges

---

## 🧪 **Test 1: Settings Persistence (Save & Load)**

### **Step 1.1: Save Settings**
1. Navigate to **Settings** → **Security & Access** tab
2. Change the following values:
   - **Session Timeout**: Change from `30` to `45` minutes
   - **Max Login Attempts**: Change from `5` to `7`
   - **Lockout Duration**: Change from `15` to `20` minutes
   - **Require Email Verification**: Toggle **ON**
   - **Require MFA**: Toggle **ON**
   - **MFA Applies To**: Check **Super Admin** and **Cashier**
   - **Minimum Password Length**: Change from `8` to `10`
   - **Require Special Characters**: Toggle **OFF**
   - **Require Mixed Case**: Toggle **ON**
3. Click **Save Settings** button
4. Wait for success message: "Settings saved successfully!"

### **Step 1.2: Verify in Database**
Run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  key,
  value->'security' as security_settings,
  updated_by,
  updated_at
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**:
- `key` = `'app_settings'`
- `security_settings` should contain:
  ```json
  {
    "sessionTimeout": 45,
    "loginAttempts": 7,
    "lockoutDuration": 20,
    "requireEmailVerification": true,
    "requireMFA": true,
    "mfaAppliesTo": {
      "superAdmin": true,
      "cashier": true
    },
    "passwordMinLength": 10,
    "passwordRequireSpecial": false,
    "passwordRequireMixedCase": true,
    ...
  }
  ```
- `updated_by` should be your user ID
- `updated_at` should be recent timestamp

### **Step 1.3: Reload Page and Verify**
1. **Refresh the browser page** (F5 or Ctrl+R)
2. Navigate back to **Settings** → **Security & Access**
3. **Verify all values match** what you set:
   - Session Timeout = 45
   - Max Login Attempts = 7
   - Lockout Duration = 20
   - Require Email Verification = ✓ (checked)
   - Require MFA = ✓ (checked)
   - Super Admin = ✓ (checked)
   - Cashier = ✓ (checked)
   - Minimum Password Length = 10
   - Require Special Characters = ✗ (unchecked)
   - Require Mixed Case = ✓ (checked)

**✅ Test Passes if**: All values persist after page reload

---

## 🧪 **Test 2: Logout All Sessions**

### **Step 2.1: Create Multiple Active Sessions**
1. **Open 2-3 different browser windows/tabs** (or use incognito mode)
2. **Log in** with different users or the same user in each window
3. **Verify sessions exist** in database:

```sql
SELECT 
  id,
  user_id,
  is_active,
  status,
  logout_time,
  created_at
FROM user_sessions
WHERE is_active = true
ORDER BY created_at DESC;
```

**Expected Result**: At least 2-3 active sessions visible

### **Step 2.2: Verify Users Status**
Check that users are online:

```sql
SELECT 
  id,
  email,
  status,
  current_session_id
FROM users
WHERE status != 'offline'
ORDER BY last_activity DESC;
```

**Expected Result**: At least 1 user with `status = 'online'` or `'away'`

### **Step 2.3: Execute Logout All Sessions**
1. Navigate to **Settings** → **Security & Access** tab
2. Scroll to **Account & Login Security** section
3. Click **"Logout All Sessions"** button
4. **Confirm** the action in the popup dialog
5. Wait for success message: "All sessions have been logged out successfully!"

### **Step 2.4: Verify Sessions Terminated**
Run this query:

```sql
SELECT 
  id,
  user_id,
  is_active,
  status,
  logout_time,
  updated_at
FROM user_sessions
WHERE is_active = true;
```

**Expected Result**: **0 rows** (all sessions should be inactive)

### **Step 2.4.1: Verify Active POS Sessions Closed**
Run this query to check if active POS sessions were closed:

```sql
SELECT 
  id,
  cashier_id,
  session_number,
  status,
  closed_at,
  opened_at,
  updated_at
FROM pos_sessions
WHERE closed_at IS NULL 
  AND status = 'open';
```

**Expected Result**: **0 rows** (all active POS sessions should be closed)

### **Step 2.4.2: Verify Recently Closed POS Sessions**
Check recently closed POS sessions:

```sql
SELECT 
  ps.id,
  ps.session_number,
  u.email as cashier_email,
  ps.status,
  ps.closed_at,
  ps.opened_at,
  ps.closed_at - ps.opened_at as session_duration
FROM pos_sessions ps
JOIN users u ON ps.cashier_id = u.id
WHERE ps.closed_at IS NOT NULL
  AND ps.status = 'closed'
ORDER BY ps.closed_at DESC
LIMIT 10;
```

**Expected Result**: 
- `status` = `'closed'`
- `closed_at` = recent timestamp (just set)
- `session_duration` = positive interval

### **Step 2.5: Verify Logout Time Set**
Check that `logout_time` was set:

```sql
SELECT 
  id,
  user_id,
  is_active,
  status,
  logout_time,
  created_at,
  logout_time - created_at as session_duration
FROM user_sessions
WHERE logout_time IS NOT NULL
ORDER BY logout_time DESC
LIMIT 5;
```

**Expected Result**: 
- `is_active` = `false`
- `status` = `'inactive'`
- `logout_time` = recent timestamp (just set)
- `session_duration` = positive interval

### **Step 2.6: Verify Users Status Updated**
Check users table:

```sql
SELECT 
  id,
  email,
  status,
  current_session_id
FROM users
WHERE status != 'offline';
```

**Expected Result**: **0 rows** (all users should be offline)

### **Step 2.7: Verify Other Browser Windows**
1. **Go to other browser windows/tabs** where you were logged in
2. Try to **navigate to any page** or **refresh the page**
3. **Expected Result**: You should be **redirected to login page** or see **"Session expired"** message

**✅ Test Passes if**: 
- All sessions are terminated in database
- All users are offline
- Other browser windows force logout

---

## 🧪 **Test 3: MFA Settings (Super Admin & Cashier)**

### **Step 3.1: Enable MFA**
1. Navigate to **Settings** → **Security & Access**
2. Toggle **"Require MFA (Email OTP)"** to **ON**
3. **Verify checkboxes appear**:
   - ✓ Super Admin (should be checked by default)
   - ✓ Cashier (should be checked by default)
4. **Uncheck "Cashier"**
5. Click **Save Settings**

### **Step 3.2: Verify MFA Settings in Database**
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

### **Step 3.3: Reload and Verify**
1. **Refresh the page**
2. Navigate to **Security & Access** tab
3. **Verify**:
   - Require MFA = ✓ (checked)
   - Super Admin = ✓ (checked)
   - Cashier = ✗ (unchecked)

**✅ Test Passes if**: MFA settings persist correctly

---

## 🧪 **Test 4: Password Policy Settings**

### **Step 4.1: Test Password Min Length**
1. Set **Minimum Password Length** to `12`
2. Click **Save Settings**
3. Verify in database:

```sql
SELECT 
  value->'security'->'passwordMinLength' as min_length
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**: `12`

### **Step 4.2: Test Password Requirements**
1. Toggle **"Require Special Characters"** to **ON**
2. Toggle **"Require Mixed Case"** to **ON**
3. Click **Save Settings**
4. Verify in database:

```sql
SELECT 
  value->'security'->'passwordRequireSpecial' as require_special,
  value->'security'->'passwordRequireMixedCase' as require_mixed_case
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**:
- `require_special` = `true`
- `require_mixed_case` = `true`

**✅ Test Passes if**: Password policy settings save correctly

---

## 🧪 **Test 5: Session Timeout & Login Attempts**

### **Step 5.1: Test Session Timeout**
1. Set **Session Timeout** to `60` minutes
2. Click **Save Settings**
3. Verify in database:

```sql
SELECT 
  value->'security'->'sessionTimeout' as session_timeout
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**: `60`

### **Step 5.2: Test Login Attempts**
1. Set **Max Login Attempts** to `3`
2. Set **Lockout Duration** to `30` minutes
3. Click **Save Settings**
4. Verify in database:

```sql
SELECT 
  value->'security'->'loginAttempts' as login_attempts,
  value->'security'->'lockoutDuration' as lockout_duration
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**:
- `login_attempts` = `3`
- `lockout_duration` = `30`

**✅ Test Passes if**: All session settings persist correctly

---

## 🧪 **Test 6: Optional Access Restrictions**

### **Step 6.1: Test Browser Verification**
1. Toggle **"Allow Login Only on Verified Browsers"** to **ON**
2. Click **Save Settings**
3. Verify in database:

```sql
SELECT 
  value->'security'->'allowLoginOnlyVerifiedBrowsers' as allow_only_verified
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**: `true`

### **Step 6.2: Test New Device Notification**
1. Toggle **"Notify Owner on New Device Login"** to **ON**
2. Click **Save Settings**
3. Verify in database:

```sql
SELECT 
  value->'security'->'notifyOwnerOnNewDevice' as notify_on_new_device
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**: `true`

**✅ Test Passes if**: Optional restrictions save correctly

---

## 🧪 **Test 7: Error Handling**

### **Step 7.1: Test Invalid Values**
1. Try to set **Session Timeout** to `200` (over max of 120)
2. Try to set **Max Login Attempts** to `20` (over max of 10)
3. **Expected Result**: Browser should prevent invalid input or show validation error

### **Step 7.2: Test Database Connection Loss**
1. **Disable network** (or block Supabase requests in browser DevTools)
2. Try to **Save Settings**
3. **Expected Result**: Should show error message like "Failed to save settings"

### **Step 7.3: Test Logout All Sessions with No Active Sessions**
1. Ensure no active sessions exist (run Test 2 first)
2. Click **"Logout All Sessions"**
3. **Expected Result**: Should show success message (even if no sessions were active)

**✅ Test Passes if**: Error handling works gracefully

---

## 🧪 **Test 8: Backward Compatibility**

### **Step 8.1: Test Old Format Migration**
If you have old settings with `owner`/`admin`/`manager` format:

1. **Manually set old format** in database:

```sql
UPDATE system_settings
SET value = jsonb_set(
  value,
  '{security,mfaAppliesTo}',
  '{"owner": true, "admin": true, "manager": false}'::jsonb
)
WHERE key = 'app_settings';
```

2. **Refresh Settings page**
3. Navigate to **Security & Access** tab
4. **Verify**:
   - Old format is detected
   - Migrated to new format
   - Super Admin should be checked (since old roles were enabled)
   - Cashier should be checked (default)

5. **Check database** after page load:

```sql
SELECT 
  value->'security'->'mfaAppliesTo' as mfa_applies_to
FROM system_settings
WHERE key = 'app_settings';
```

**Expected Result**: Should show new format:
```json
{
  "superAdmin": true,
  "cashier": true
}
```

**✅ Test Passes if**: Old format automatically migrates to new format

---

## 📊 **Quick Test Checklist**

Use this checklist for quick verification:

- [ ] Settings save successfully
- [ ] Settings persist after page reload
- [ ] Settings stored correctly in `system_settings` table
- [ ] Logout All Sessions terminates all active sessions
- [ ] Logout All Sessions sets `logout_time` in `user_sessions`
- [ ] Logout All Sessions updates `users.status` to 'offline'
- [ ] Logout All Sessions sets `current_session_id` to NULL
- [ ] MFA settings save correctly (superAdmin, cashier)
- [ ] MFA checkboxes appear/disappear based on MFA toggle
- [ ] Password policy settings save correctly
- [ ] Session timeout settings save correctly
- [ ] Login attempts settings save correctly
- [ ] Optional restrictions save correctly
- [ ] Error messages display properly
- [ ] Backward compatibility works (if applicable)

---

## 🔍 **Debugging Tips**

### **If Settings Don't Save:**
1. Check browser console for errors (F12 → Console)
2. Verify `system_settings` table has RLS policies enabled
3. Check `updated_by` field is getting a valid user ID
4. Verify network tab shows successful POST request

### **If Logout All Sessions Doesn't Work:**
1. Check browser console for errors
2. Verify `user_sessions` table has UPDATE permissions
3. Verify `users` table has UPDATE permissions
4. Check RLS policies allow authenticated users to update

### **If Settings Don't Load:**
1. Check browser console for errors
2. Verify `system_settings` table has SELECT permissions
3. Check if `key = 'app_settings'` exists in database
4. Verify JSONB structure is valid

### **Useful SQL Queries for Debugging:**

```sql
-- Check all security settings
SELECT 
  value->'security' as security_settings
FROM system_settings
WHERE key = 'app_settings';

-- Check active sessions
SELECT COUNT(*) as active_sessions
FROM user_sessions
WHERE is_active = true;

-- Check online users
SELECT COUNT(*) as online_users
FROM users
WHERE status != 'offline';

-- Check recent settings updates
SELECT 
  updated_by,
  updated_at,
  value->'security'->'sessionTimeout' as session_timeout
FROM system_settings
WHERE key = 'app_settings'
ORDER BY updated_at DESC;
```

---

## ✅ **Success Criteria**

All tests pass if:
1. ✅ All settings save and load correctly
2. ✅ Database reflects changes accurately
3. ✅ Logout All Sessions works as expected
4. ✅ UI updates reflect database changes
5. ✅ Error handling works gracefully
6. ✅ Backward compatibility maintained

---

## 🚀 **Next Steps**

After testing:
1. Document any issues found
2. Verify all features work in production environment
3. Test with multiple user roles
4. Test with different browsers
5. Test with concurrent users

---

## 📝 **Notes**

- Settings are cached for 5 minutes (configurable in `settingsService.ts`)
- Logout All Sessions affects **all users**, not just current user
- MFA settings are stored as JSONB object in database
- All settings support both nested and flat key formats for backward compatibility

