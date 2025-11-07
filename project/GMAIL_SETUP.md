# Gmail SMTP Setup for MFA Emails

## ✅ Quick Setup

Your Gmail credentials are already configured in the Edge Function. You just need to:

### Step 1: Deploy the Edge Function

```bash
cd agrivet-integrated-management-system/project
supabase functions deploy mfa-email
```

### Step 2: Set Environment Variables in Supabase

1. Go to **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Add these two secrets:

```
GMAIL_USER=d31430525@gmail.com
GMAIL_APP_PASSWORD=uamz wmxb wgzs zpyx
```

**Important:** Remove spaces from the app password when adding it:
```
GMAIL_APP_PASSWORD=uamzwmxbwgzszpyx
```

### Step 3: Test

Try logging in with MFA - emails should now be sent via Gmail!

---

## 🔧 How It Works

The Edge Function will:
1. **First try SendGrid** (if `SENDGRID_API_KEY` is set)
2. **Then try Gmail SMTP** (if `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set)
3. **Fallback to development mode** (shows OTP in console)

Since you've provided Gmail credentials, it will use Gmail SMTP automatically once you set the environment variables.

---

## ⚠️ Note About Gmail SMTP

Gmail SMTP requires:
- ✅ App Password (you have this: `uamz wmxb wgzs zpyx`)
- ✅ 2-Step Verification enabled (required for App Passwords)

The current implementation uses Gmail's SMTP server. If you encounter issues, we can:
1. Use Gmail API (requires OAuth2 setup - more complex)
2. Use a service like Resend or Mailgun
3. Keep using SendGrid

---

## 🚀 Alternative: Use EmailJS (Browser-Based)

If you prefer not to use the Edge Function, you can use EmailJS which works directly from the browser:

1. Sign up at https://www.emailjs.com
2. Connect your Gmail account
3. Update `gmailEmailService.ts` with your EmailJS credentials

This doesn't require deploying an Edge Function, but EmailJS has rate limits on the free plan.

---

## 📝 Current Status

- ✅ Edge Function code updated to support Gmail SMTP
- ✅ Gmail credentials provided
- ⏳ **Next:** Deploy function and set environment variables
- ⏳ **Then:** Test MFA login

---

## 🔍 Troubleshooting

If emails don't send:

1. **Check Edge Function logs** in Supabase Dashboard
2. **Verify environment variables** are set correctly (no spaces in app password)
3. **Check Gmail account** - make sure 2-Step Verification is enabled
4. **Check spam folder** - Gmail might mark automated emails as spam initially

---

## 💡 Recommendation

For production, consider:
- **SendGrid** (more reliable, better deliverability)
- **Resend** (modern, developer-friendly)
- **AWS SES** (cost-effective at scale)

Gmail SMTP works great for development and small-scale production, but has rate limits and may be marked as spam by some email providers.




