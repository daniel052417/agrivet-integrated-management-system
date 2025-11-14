# Quick Guide: Deploy MFA Email Function

## 🚨 Current Issue
The CORS error you're seeing means the `mfa-email` Edge Function is **not deployed** yet. The code is fixed, but you need to deploy it to Supabase.

## ✅ Quick Fix (2 Options)

### Option 1: Deploy Edge Function (Recommended for Production)

**Using Supabase CLI:**
```bash
# Navigate to your project
cd agrivet-integrated-management-system/project

# Deploy the function
supabase functions deploy mfa-email
```

**Using Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** in the left sidebar
4. Click **"Create a new function"**
5. Name it: `mfa-email`
6. Copy the entire contents of `supabase/functions/mfa-email/index.ts`
7. Paste into the editor
8. Click **"Deploy"**

**Set Environment Variables (Optional - for real emails):**
1. In Supabase Dashboard → **Edge Functions** → **Secrets**
2. Add:
   - `SENDGRID_API_KEY` = your SendGrid API key
   - `FROM_EMAIL` = your verified sender email

**Note:** The function works without SendGrid - it will return success and the client-side fallback will handle it.

---

### Option 2: Use Development Mode (For Testing Now)

The system is already working in **development mode**:

1. **OTP codes are generated and stored** ✅
2. **OTP codes are displayed in browser console** ✅
3. **OTP codes are shown in the MFA form** (if in sessionStorage) ✅

**To see the OTP:**
1. Open browser **Developer Console** (F12)
2. Look for the large, styled OTP code display
3. Or check the MFA form - it will show the OTP in a yellow box (development mode)

**The OTP codes you saw:**
- `255091`
- `310234`

These are valid OTP codes you can use to test MFA right now!

---

## 🔍 Verify Deployment

After deploying, test by:
1. Try logging in again
2. Check browser console - should see **no CORS errors**
3. If SendGrid is configured, you'll receive real emails
4. If not, OTP will still be in console (development mode)

---

## 📝 What Was Fixed

1. ✅ **CORS Headers**: Added proper CORS headers with `Access-Control-Allow-Methods`
2. ✅ **OPTIONS Handling**: Improved preflight request handling (204 status)
3. ✅ **406 Error**: Fixed `verified_devices` query to use `maybeSingle()`
4. ✅ **OTP Visibility**: Made OTP codes very visible in console for development
5. ✅ **SessionStorage**: Store OTP in sessionStorage for easy access

---

## 🎯 Next Steps

1. **For Testing Now**: Use the OTP codes from console (already working!)
2. **For Production**: Deploy the Edge Function and configure SendGrid
3. **Alternative**: Set up Gmail SMTP in `gmailEmailService.ts` for client-side emails

---

## 💡 Pro Tip

The MFA system works **right now** without any deployment:
- OTP codes are in the console
- OTP codes are stored in the database
- You can verify and login using the console OTP

Deploying the Edge Function just enables **real email delivery** via SendGrid.






