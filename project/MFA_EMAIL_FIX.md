# 🔧 MFA Email Sending Fix

## Issues Identified

### 1. ❌ CORS Configuration Problem
**Problem**: Your deployed Edge Function has CORS hardcoded to `http://localhost:5173`, which will fail when accessing from Vercel.

**Your Current Code**:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173", // ❌ This blocks Vercel!
  ...
}
```

**Solution**: Use dynamic CORS that allows your Vercel domain.

### 2. ❌ Environment Variables Not Set
**Problem**: The function needs `SENDGRID_API_KEY` and `FROM_EMAIL` to be set in Supabase Edge Function secrets.

### 3. ⚠️ JWT Verification Enabled
**Problem**: "Verify JWT with legacy secret" is enabled, which requires proper authentication headers.

---

## Step-by-Step Fix

### Step 1: Update Edge Function Code

Replace your current Edge Function code with the fixed version that handles CORS properly:

**File**: `supabase/functions/mfa-email/index.ts`

The file in your repo already has the correct CORS configuration (`'*'`), but your deployed version has the localhost restriction. You need to redeploy the function.

### Step 2: Set Environment Variables in Supabase

1. Go to Supabase Dashboard → **Edge Functions** → **Secrets**
2. Add the following secrets:

   | Secret Name | Value | Description |
   |------------|-------|-------------|
   | `SENDGRID_API_KEY` | Your SendGrid API key | Required for sending emails |
   | `FROM_EMAIL` | Your verified sender email | e.g., `noreply@yourdomain.com` |

3. **How to get SendGrid API Key**:
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the key (you'll only see it once!)

4. **Verify Sender Email in SendGrid**:
   - Go to SendGrid → Settings → Sender Authentication
   - Verify your sender email address
   - Use this verified email as `FROM_EMAIL`

### Step 3: Redeploy Edge Function

**Option A: Using Supabase CLI** (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref prhxgpbqkpdnjpmxndyp

# Deploy the function
supabase functions deploy mfa-email
```

**Option B: Using Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Click on "mfa-email" function
3. Click "Deploy" or "Redeploy"
4. Make sure the code is updated with the fixed CORS

### Step 4: Update CORS in Deployed Function

If you can't redeploy, you can manually update the CORS in the Supabase dashboard:

1. Go to your function in Supabase Dashboard
2. Edit the code
3. Replace the CORS headers section with:

```typescript
// Get origin from request
const origin = req.headers.get('origin') || req.headers.get('Origin');

// Allow requests from Vercel and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://*.vercel.app', // Allow all Vercel domains
  // Add your specific Vercel domain here:
  // 'https://your-project.vercel.app',
];

const isAllowedOrigin = !origin || 
  allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      return origin.includes(allowed.replace('*.', ''));
    }
    return origin === allowed;
  });

const corsHeaders = {
  'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

### Step 5: Test the Function

**Test via cURL**:
```bash
curl -X POST 'https://prhxgpbqkpdnjpmxndyp.supabase.co/functions/v1/swift-processor' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "name": "Test User",
    "otpCode": "123456",
    "expiryMinutes": 5,
    "type": "otp"
  }'
```

**Expected Response** (if SendGrid is configured):
```json
{
  "success": true,
  "messageId": "sg_...",
  "message": "Email sent successfully via SendGrid"
}
```

**Expected Response** (if SendGrid is NOT configured):
```json
{
  "success": true,
  "messageId": "dev_...",
  "message": "Email prepared (No email service configured - development mode)",
  "otpCode": "123456"
}
```

---

## Troubleshooting

### Issue: CORS Error in Browser Console

**Error**: `Access to fetch at '...' from origin 'https://your-app.vercel.app' has been blocked by CORS policy`

**Solution**:
1. ✅ Update CORS to allow your Vercel domain (see Step 4)
2. ✅ Redeploy the function
3. ✅ Clear browser cache and try again

### Issue: 401 Unauthorized Error

**Error**: `401 Unauthorized` or `JWT verification failed`

**Solution**:
1. ✅ Verify you're sending the `Authorization` header with `Bearer YOUR_SUPABASE_ANON_KEY`
2. ✅ Check that "Verify JWT with legacy secret" is enabled (it should be)
3. ✅ Verify your `VITE_SUPABASE_ANON_KEY` is correct in Vercel environment variables

### Issue: Email Not Sending (No Error)

**Symptoms**: Function returns success but no email received

**Check**:
1. ✅ Verify `SENDGRID_API_KEY` is set in Supabase Edge Function secrets
2. ✅ Verify `FROM_EMAIL` is set and verified in SendGrid
3. ✅ Check SendGrid activity logs for delivery status
4. ✅ Check spam/junk folder
5. ✅ Verify email address is correct

### Issue: SendGrid API Error

**Error**: `SendGrid API error: 403` or `401`

**Solutions**:
1. ✅ Verify SendGrid API key is correct
2. ✅ Check API key has "Mail Send" permissions
3. ✅ Verify sender email is authenticated in SendGrid
4. ✅ Check SendGrid account status (not suspended)

### Issue: Function Returns Development Mode

**Response**: `"Email prepared (No email service configured - development mode)"`

**Solution**:
1. ✅ Set `SENDGRID_API_KEY` in Supabase Edge Function secrets
2. ✅ Set `FROM_EMAIL` in Supabase Edge Function secrets
3. ✅ Redeploy the function after setting secrets

---

## Quick Checklist

Before testing, verify:

- [ ] Edge Function code has correct CORS (allows Vercel domains)
- [ ] `SENDGRID_API_KEY` is set in Supabase Edge Function secrets
- [ ] `FROM_EMAIL` is set in Supabase Edge Function secrets
- [ ] Sender email is verified in SendGrid
- [ ] Function is redeployed with updated code
- [ ] `VITE_SUPABASE_ANON_KEY` is set in Vercel environment variables
- [ ] Client code is calling the correct endpoint (`/functions/v1/swift-processor`)

---

## Alternative: Use Gmail SMTP Instead of SendGrid

If you prefer Gmail SMTP:

1. **Set up Gmail App Password**:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password for "Mail"
   - Copy the 16-character password

2. **Set Secrets in Supabase**:
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_APP_PASSWORD`: The 16-character app password

3. **The function will automatically use Gmail if SendGrid is not configured**

---

## Testing After Fix

1. **Test from Browser Console** (on your Vercel-deployed app):
```javascript
fetch('https://prhxgpbqkpdnjpmxndyp.supabase.co/functions/v1/swift-processor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
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

2. **Check Function Logs**:
   - Go to Supabase Dashboard → Edge Functions → mfa-email → Logs
   - Look for error messages or success logs

3. **Check SendGrid Activity**:
   - Go to SendGrid Dashboard → Activity
   - Look for email delivery status

---

## Summary

The main issues are:
1. ✅ **CORS** - Fixed in the code (needs redeployment)
2. ✅ **Environment Variables** - Need to be set in Supabase
3. ✅ **Authentication** - Should work with anon key

After fixing these, MFA emails should send successfully!



