# Email Debug Guide

## Current Issue
✅ **No errors** - System shows "sent successfully"  
❌ **No real emails** - Emails are not actually being sent

## Why This Happens

The system is currently running in **simulation mode** because:

1. **Supabase Edge Function not deployed** - The system tries to use `/functions/v1/send-email` but it's not available
2. **Falls back to simulation** - When the Edge Function fails, it shows simulation messages
3. **Shows "success"** - But it's just simulating, not actually sending

## Quick Solutions

### Option 1: Check Console Messages

Open your browser console (F12) and look for these messages:

**If you see this:**
```
📧 [SIMULATION] Sending activation email: {...}
⚠️  NOTE: This is a simulation. To send real emails, configure Gmail SMTP in .env file
```
**→ You're in simulation mode**

**If you see this:**
```
Backend email API not available, using simulation
```
**→ The Supabase Edge Function is not deployed**

### Option 2: Deploy Supabase Edge Function (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to your project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Deploy the email function:**
   ```bash
   supabase functions deploy send-email
   ```

5. **Test again** - Now it should use the Edge Function

### Option 3: Use Simple Gmail Setup (Easiest)

1. **Set up Gmail App Password:**
   - Go to Google Account → Security
   - Enable 2-Factor Authentication
   - Go to "App passwords"
   - Generate password for "Mail"

2. **Update the email service to use Gmail directly:**
   - Replace the simulation with real Gmail SMTP
   - Use a service like EmailJS or similar

### Option 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to send an email
4. Look for requests to `/functions/v1/send-email`
5. If you see 404 errors → Edge Function not deployed
6. If you see no requests → Using simulation mode

## What to Check Right Now

1. **Open browser console** and look for simulation messages
2. **Check if you see "Backend email API not available"**
3. **Look for any 404 errors** in Network tab
4. **Verify Supabase Edge Functions are enabled** in your project

## Expected Behavior

**With Edge Function deployed:**
- Console shows: `📧 [EDGE FUNCTION] Email prepared: {...}`
- Network tab shows successful POST to `/functions/v1/send-email`
- Real emails are sent

**In simulation mode:**
- Console shows: `📧 [SIMULATION] Sending activation email: {...}`
- No network requests to Edge Function
- No real emails sent

## Quick Test

Add this to your browser console to test:

```javascript
// Test if Edge Function is available
fetch('YOUR_SUPABASE_URL/functions/v1/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    to: 'test@example.com',
    name: 'Test User',
    activationToken: 'test-token',
    type: 'activation'
  })
}).then(r => r.json()).then(console.log)
```

If this returns an error, the Edge Function is not deployed.
