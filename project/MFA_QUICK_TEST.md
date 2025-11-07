# MFA Quick Test Guide (No Setup Required)

## 🎯 **Test MFA Right Now - No Email Setup Needed!**

The MFA system works in **simulation mode** - you can test it immediately without setting up email services.

---

## ✅ **Step 1: Run Database Migration**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `MFA_DATABASE_SCHEMA.sql`
3. Click **"Run"**

This creates the required tables (`mfa_otp_codes` and `verified_devices`).

---

## ✅ **Step 2: Enable MFA in Settings**

1. Log in to your application
2. Go to **Settings** → **Security & Access**
3. Toggle **"Require MFA (Email OTP)"** to **ON**
4. Check **"Super Admin"** (and/or **"Cashier"**)
5. Click **"Save Settings"**

---

## ✅ **Step 3: Test MFA Login**

1. **Open Browser Developer Console** (Press F12)
2. Go to the **Console** tab
3. **Log out** (if logged in)
4. **Log in** with a user that has **Super Admin** or **Cashier** role

### **What You'll See:**

1. After entering password, the **MFA Verification screen** appears
2. In the browser console, you'll see:
   ```
   🔐 [DEV MODE] OTP Code for user@example.com : 123456
   📧 Email not sent. Check Edge Function setup or use console OTP for testing.
   ```

3. **Copy the OTP code** from the console (e.g., `123456`)
4. **Paste it** into the MFA verification screen
5. **Click "Verify Code"** or wait for auto-submit
6. **Login completes** ✅

---

## 🎯 **Quick Test Checklist**

- [ ] Database migration run successfully
- [ ] MFA enabled in Settings
- [ ] Role selected (Super Admin/Cashier)
- [ ] Browser console open (F12)
- [ ] Logged in with MFA-required user
- [ ] MFA screen appeared
- [ ] OTP code visible in console
- [ ] OTP entered successfully
- [ ] Login completed

---

## 📝 **Expected Console Output**

When MFA is triggered, you should see:

```
🔐 MFA required for user: user@example.com
📧 [SIMULATION MODE] Sending OTP email: {to: "user@example.com", otpCode: "123456"}
🔐 [DEV MODE] OTP Code for user@example.com : 123456
📧 Email not sent. Check Edge Function setup or use console OTP for testing.
```

**Use the OTP code shown** (e.g., `123456`) to complete login.

---

## 🔍 **Troubleshooting**

### **MFA Screen Doesn't Appear**
- ✅ Check MFA is enabled in Settings
- ✅ Check user's role is in `mfaAppliesTo` (Super Admin or Cashier)
- ✅ Check device is not already verified (try incognito mode)

### **No OTP Code in Console**
- ✅ Check browser console is open (F12)
- ✅ Check console filter is not hiding logs
- ✅ Look for `🔐 [DEV MODE] OTP Code` message

### **OTP Code Doesn't Work**
- ✅ Check OTP is not expired (5 minutes)
- ✅ Check you copied the correct code
- ✅ Try resending OTP (click "Resend Code")

### **Database Errors**
- ✅ Check `mfa_otp_codes` table exists
- ✅ Check `verified_devices` table exists
- ✅ Check RLS policies are enabled

---

## 🚀 **Next Steps**

Once MFA is working in simulation mode:

1. **Test device verification**: Log in twice from same device (second time should skip MFA)
2. **Test on new device**: Use incognito mode (MFA should appear again)
3. **Set up email** (optional): Follow `MFA_SUPABASE_SETUP.md` for real emails

---

## 💡 **Pro Tips**

1. **Keep console open** while testing MFA
2. **OTP codes expire in 5 minutes** - use them quickly
3. **Resend OTP** if you need a new code (60-second cooldown)
4. **Device verification** works immediately after first successful MFA

---

## ✅ **You're All Set!**

MFA is now working in simulation mode. You can test all features:
- ✅ OTP generation
- ✅ OTP verification
- ✅ Device verification
- ✅ Role-based MFA
- ✅ Resend functionality

**Email setup is optional** - only needed if you want real emails sent instead of console logs.







