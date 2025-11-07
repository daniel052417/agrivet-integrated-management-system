# 📧 Supabase Edge Function Setup Guide

## Quick Fix for MFA Email Issue

### Problem
MFA emails are not sending after deployment to Vercel.

### Root Causes
1. ❌ **CORS** - Hardcoded to `localhost:5173` (blocks Vercel requests)
2. ❌ **Environment Variables** - Not set in Supabase Edge Function secrets
3. ⚠️ **Authentication** - JWT verification enabled (should work with anon key)

---

## Step 1: Update Edge Function Code

The code in `supabase/functions/mfa-email/index.ts` has been updated with:
- ✅ Dynamic CORS that allows Vercel domains
- ✅ Better error handling
- ✅ Support for both SendGrid and Gmail SMTP

**You need to redeploy this function to Supabase.**

### How to Redeploy

**Option A: Using Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Click on "mfa-email" function
3. Click "Edit" or "Deploy"
4. Copy the updated code from `supabase/functions/mfa-email/index.ts`
5. Paste it into the editor
6. Click "Deploy" or "Save"

**Option B: Using Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref prhxgpbqkpdnjpmxndyp

# Deploy the function
supabase functions deploy mfa-email
```

---

## Step 2: Set Environment Variables (CRITICAL!)

### Required Secrets

Go to **Supabase Dashboard → Edge Functions → Secrets** and add:

#### 1. SENDGRID_API_KEY
- **Name**: `SENDGRID_API_KEY`
- **Value**: Your SendGrid API key
- **How to get**:
  1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier available)
  2. Go to Settings → API Keys
  3. Click "Create API Key"
  4. Name it (e.g., "MFA Email Service")
  5. Select "Mail Send" permissions
  6. Copy the key (you'll only see it once!)

#### 2. FROM_EMAIL
- **Name**: `FROM_EMAIL`
- **Value**: Your verified sender email (e.g., `noreply@yourdomain.com`)
- **Important**: This email must be verified in SendGrid
  - Go to SendGrid → Settings → Sender Authentication
  - Verify your sender email address
  - Use this verified email as `FROM_EMAIL`

#### 3. (Optional) Gmail SMTP Alternative
If you prefer Gmail instead of SendGrid:

- **Name**: `GMAIL_USER`
- **Value**: Your Gmail address

- **Name**: `GMAIL_APP_PASSWORD`
- **Value**: Gmail App Password (16 characters)
  - Go to Google Account → Security
  - Enable 2-Step Verification
  - Generate App Password for "Mail"

---

## Step 3: Verify Function Configuration

### Check These Settings:

1. **Function Name**: `mfa-email`
2. **Slug**: `swift-processor` (this is what's used in the URL)
3. **Endpoint URL**: `https://prhxgpbqkpdnjpmxndyp.supabase.co/functions/v1/swift-processor`
4. **Verify JWT with legacy secret**: ✅ Enabled (this is correct)
5. **Secrets**: ✅ `SENDGRID_API_KEY` and `FROM_EMAIL` are set

---

## Step 4: Test the Function

### Test via Browser Console (on your Vercel app):

```javascript
// Replace with your actual values
const SUPABASE_URL = 'https://prhxgpbqkpdnjpmxndyp.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

fetch(`${SUPABASE_URL}/functions/v1/swift-processor`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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
.then(result => {
  console.log('✅ Result:', result);
  if (result.success) {
    console.log('Email sent! Check your inbox.');
  } else {
    console.error('❌ Error:', result.error);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error);
});
```

### Expected Responses:

**Success (SendGrid configured)**:
```json
{
  "success": true,
  "messageId": "sg_...",
  "message": "Email sent successfully via SendGrid"
}
```

**Development Mode (No email service)**:
```json
{
  "success": true,
  "messageId": "dev_...",
  "message": "Email prepared (No email service configured - development mode)",
  "otpCode": "123456"
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Step 5: Check Function Logs

1. Go to Supabase Dashboard → Edge Functions → mfa-email
2. Click on "Logs" tab
3. Look for:
   - `📧 [MFA-EMAIL] Email prepared:` - Function received request
   - `✅ [MFA-EMAIL] Email sent successfully` - Email sent
   - `❌ [MFA-EMAIL]` - Errors

---

## Common Issues & Solutions

### Issue 1: CORS Error
**Error**: `Access to fetch... has been blocked by CORS policy`

**Solution**:
- ✅ Redeploy the function with updated CORS code
- ✅ The new code allows `*.vercel.app` domains automatically

### Issue 2: 401 Unauthorized
**Error**: `401 Unauthorized` or `JWT verification failed`

**Solution**:
- ✅ Verify `Authorization: Bearer YOUR_SUPABASE_ANON_KEY` header is sent
- ✅ Check `VITE_SUPABASE_ANON_KEY` is correct in Vercel environment variables
- ✅ "Verify JWT with legacy secret" should be enabled (it is)

### Issue 3: Email Not Sending
**Symptoms**: Function returns success but no email received

**Check**:
1. ✅ `SENDGRID_API_KEY` is set in Supabase Edge Function secrets
2. ✅ `FROM_EMAIL` is set and verified in SendGrid
3. ✅ Check SendGrid Activity logs for delivery status
4. ✅ Check spam/junk folder
5. ✅ Verify recipient email address is correct

### Issue 4: SendGrid API Error
**Error**: `SendGrid API error: 403` or `401`

**Solutions**:
1. ✅ Verify SendGrid API key is correct
2. ✅ Check API key has "Mail Send" permissions
3. ✅ Verify sender email is authenticated in SendGrid
4. ✅ Check SendGrid account is not suspended

### Issue 5: Function Returns Development Mode
**Response**: `"Email prepared (No email service configured - development mode)"`

**Solution**:
1. ✅ Set `SENDGRID_API_KEY` in Supabase Edge Function secrets
2. ✅ Set `FROM_EMAIL` in Supabase Edge Function secrets
3. ✅ Redeploy the function after setting secrets

---

## Quick Checklist

Before testing MFA:

- [ ] Edge Function code is updated (CORS fixed)
- [ ] Function is redeployed to Supabase
- [ ] `SENDGRID_API_KEY` is set in Supabase Edge Function secrets
- [ ] `FROM_EMAIL` is set in Supabase Edge Function secrets
- [ ] Sender email is verified in SendGrid
- [ ] `VITE_SUPABASE_ANON_KEY` is set in Vercel environment variables
- [ ] Test the function via browser console
- [ ] Check function logs for errors

---

## Alternative: Use Gmail Instead of SendGrid

If you don't want to use SendGrid:

1. **Set up Gmail App Password**:
   - Google Account → Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"

2. **Set Secrets in Supabase**:
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_APP_PASSWORD`: The 16-character app password

3. **The function will automatically use Gmail if SendGrid is not configured**

---

## Testing Checklist

After setup:

1. ✅ Test from browser console (see Step 4)
2. ✅ Check function logs in Supabase dashboard
3. ✅ Verify email is received (check spam folder)
4. ✅ Test MFA login flow in your app
5. ✅ Check SendGrid activity logs (if using SendGrid)

---

## Summary

**Main Issues**:
1. ✅ CORS - Fixed in code (needs redeployment)
2. ✅ Environment Variables - Need to be set in Supabase
3. ✅ Authentication - Should work with anon key

**Next Steps**:
1. Redeploy the Edge Function with updated code
2. Set `SENDGRID_API_KEY` and `FROM_EMAIL` in Supabase secrets
3. Test the function
4. Verify emails are being sent

---

**Status**: Ready to fix - Follow steps above to resolve MFA email issues!

