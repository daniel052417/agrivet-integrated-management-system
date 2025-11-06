# MFA Supabase Setup Guide

## 🔧 **Required Setup for MFA Email Functionality**

The errors you're seeing (`406`, `500`) indicate that the Supabase Edge Function needs to be set up. Here's how to fix it:

---

## ✅ **Step 1: Deploy the Edge Function**

### **Option A: Using Supabase CLI (Recommended)**

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find your project ref in Supabase Dashboard → Settings → General → Reference ID)

4. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy mfa-email
   ```

### **Option B: Using Supabase Dashboard**

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. Name it: `mfa-email`
4. Copy the contents of `supabase/functions/send-email/index.ts` (or your `mfa-email` function file)
5. Paste into the function editor
6. Click **"Deploy"**

**Note**: If you renamed the function folder, make sure the Edge Function is deployed as `mfa-email` (not `send-email`).

---

## ✅ **Step 2: Set Environment Variables**

The Edge Function needs these environment variables:

### **In Supabase Dashboard:**

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add these secrets:

   ```
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=https://your-app-url.com
   ```

### **How to Get SendGrid API Key:**

1. **Sign up for SendGrid** (if you don't have an account):
   - Go to https://sendgrid.com
   - Create a free account (100 emails/day free)

2. **Create API Key**:
   - Go to SendGrid Dashboard → **Settings** → **API Keys**
   - Click **"Create API Key"**
   - Name it: "AgriVet MFA"
   - Select **"Full Access"** or **"Mail Send"** permissions
   - Copy the API key (you'll only see it once!)

3. **Verify Sender Email** (Required for production):
   - Go to **Settings** → **Sender Authentication**
   - Verify your sender email address

---

## ✅ **Step 3: Alternative - Use Gmail SMTP (No SendGrid)**

If you don't want to use SendGrid, you can use Gmail SMTP instead:

### **Update Edge Function to Support Gmail:**

The current Edge Function uses SendGrid. For Gmail, you have two options:

**Option 1: Modify Edge Function** (More complex)
- Update the Edge Function to use Gmail SMTP
- Requires additional dependencies

**Option 2: Use Client-Side Gmail Service** (Simpler)
- The code already has fallback to `gmailEmailService`
- This will work without Edge Function

### **For Client-Side Gmail (No Edge Function Needed):**

1. **Don't deploy the Edge Function** (or disable it)
2. **Configure Gmail credentials** in `src/lib/gmailEmailService.ts`:
   ```typescript
   const GMAIL_USER = 'your-email@gmail.com';
   const GMAIL_APP_PASSWORD = 'your-app-password';
   ```

3. **Get Gmail App Password**:
   - Go to Google Account → **Security**
   - Enable **2-Step Verification** (required)
   - Go to **App Passwords**
   - Generate a new app password for "Mail"
   - Copy the 16-character password

---

## ✅ **Step 4: Test the Edge Function**

### **Method 1: Using Supabase Dashboard**

1. Go to **Edge Functions** → **mfa-email**
2. Click **"Invoke"** tab
3. Use this test payload:

```json
{
  "to": "your-email@example.com",
  "name": "Test User",
  "otpCode": "123456",
  "expiryMinutes": 5,
  "companyName": "AgriVet Management System",
  "type": "otp"
}
```

4. Click **"Invoke"**
5. Check for errors in the logs

### **Method 2: Using Browser Console**

Open browser console and run:

```javascript
fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/mfa-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    to: 'your-email@example.com',
    name: 'Test User',
    otpCode: '123456',
    expiryMinutes: 5,
    type: 'otp'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 🔍 **Troubleshooting**

### **Error 406: Not Acceptable**
- **Cause**: Edge Function not deployed or wrong URL
- **Fix**: Deploy the function as `mfa-email` or check the URL in `emailApi.ts`

### **Error 500: Internal Server Error**
- **Cause**: Missing environment variables or SendGrid API error
- **Fix**: 
  1. Check Edge Function logs in Supabase Dashboard
  2. Verify `SENDGRID_API_KEY` is set
  3. Verify `FROM_EMAIL` is verified in SendGrid

### **Error: "SENDGRID_API_KEY environment variable is not set"**
- **Fix**: Set the secret in Supabase Dashboard → Edge Functions → Secrets

### **Error: "SendGrid API error"**
- **Fix**: 
  1. Verify your SendGrid API key is correct
  2. Check SendGrid account status
  3. Verify sender email is authenticated

---

## 📧 **Current Behavior (Fallback Mode)**

Right now, the system is working in **fallback simulation mode**:
- ✅ OTP codes are generated and stored
- ✅ OTP verification works
- ⚠️ Emails are NOT actually sent (simulation only)
- ✅ You can test MFA by checking the console logs for OTP codes

### **To See OTP Codes:**

1. Open browser **Developer Console** (F12)
2. Look for logs like:
   ```
   📧 [FALLBACK SIMULATION] Sending OTP email: {
     to: "user@example.com",
     otpCode: "123456"
   }
   ```
3. Use the OTP code shown in the console

---

## 🚀 **Quick Start (No Setup Required)**

If you want to test MFA **without setting up email**:

1. **The system already works in simulation mode**
2. **Check browser console** for OTP codes when logging in
3. **Enter the OTP code** from the console logs
4. **MFA will work** - you just need to manually check console for codes

---

## 📝 **Recommended Setup Order**

1. ✅ **Test MFA in simulation mode first** (check console for OTP)
2. ✅ **Deploy Edge Function** (without SendGrid - will use simulation)
3. ✅ **Set up SendGrid** (optional, for real emails)
4. ✅ **Configure environment variables**
5. ✅ **Test with real emails**

---

## 💡 **For Development/Testing**

**You can use MFA right now without any setup:**

1. Enable MFA in Settings
2. Try to log in
3. Open browser console (F12)
4. Look for the OTP code in the logs
5. Enter that code in the MFA screen

The OTP codes are being generated and stored correctly - you just need to get them from the console logs instead of email for now.

---

## ✅ **Summary**

**Minimum Setup (For Testing):**
- ✅ Nothing required - works in simulation mode
- ✅ Check console logs for OTP codes

**Full Setup (For Production):**
1. Deploy Edge Function as `mfa-email`
2. Set up SendGrid account
3. Add `SENDGRID_API_KEY` secret
4. Add `FROM_EMAIL` secret
5. Verify sender email in SendGrid

**Alternative (Gmail):**
- Configure `gmailEmailService.ts` with Gmail credentials
- No Edge Function needed
- Works client-side

---

## 🔗 **Useful Links**

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

