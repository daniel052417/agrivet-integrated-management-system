# Quick Email Fix

## Current Status
✅ **Edge Function is working** - You see "Email sent via Supabase Edge Function"  
❌ **But it's in simulation mode** - No real emails are being sent

## The Problem
The Supabase Edge Function is currently set to simulation mode. It prepares the email but doesn't actually send it.

## Quick Fix Options

### Option 1: Deploy Updated Edge Function (Recommended)

1. **The Edge Function has been updated** with Gmail SMTP support
2. **Deploy it to Supabase:**
   ```bash
   # Install Supabase CLI if you haven't
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Deploy the updated function
   supabase functions deploy send-email
   ```

3. **Set environment variables in Supabase:**
   - Go to your Supabase project dashboard
   - Go to Settings → Edge Functions
   - Add these environment variables:
     - `GMAIL_USER` = `d31430525@gmail.com`
     - `GMAIL_APP_PASSWORD` = `uamz wmxb wgzs zpyx`
     - `FRONTEND_URL` = `http://localhost:3000` (or your domain)

### Option 2: Test the Updated Edge Function Locally

1. **Install Deno** (if not already installed)
2. **Run the function locally:**
   ```bash
   cd project/supabase/functions/send-email
   deno run --allow-net --allow-env index.ts
   ```

### Option 3: Use a Different Email Service

If Gmail SMTP doesn't work, you can use:
- **SendGrid** (free tier: 100 emails/day)
- **AWS SES** (very cheap)
- **Mailgun** (free tier: 5,000 emails/month)

## What Changed

The Edge Function now:
1. ✅ **Uses Gmail SMTP** instead of simulation
2. ✅ **Has your Gmail credentials** hardcoded (for testing)
3. ✅ **Sends real emails** via Gmail SMTP
4. ✅ **Returns proper success/error messages**

## Test It

After deploying, try sending an email again. You should see:
- Console: `✅ Email sent successfully via Gmail SMTP`
- Real email in your Gmail inbox

## If It Still Doesn't Work

Check the Supabase Edge Function logs:
1. Go to your Supabase dashboard
2. Go to Edge Functions → send-email
3. Check the logs for any SMTP errors

Common issues:
- Gmail App Password not working
- 2FA not enabled on Gmail
- Gmail "Less secure app access" disabled
- Network/firewall blocking SMTP

## Next Steps

1. **Deploy the updated Edge Function**
2. **Test sending an email**
3. **Check your Gmail inbox**
4. **Let me know if you see any errors in the logs**
