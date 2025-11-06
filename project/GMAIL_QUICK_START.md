# 🚀 Quick Start: Gmail SMTP for MFA Emails

## ✅ Your Credentials (Already Configured)

- **Gmail:** `d31430525@gmail.com`
- **App Password:** `uamz wmxb wgzs zpyx`

## 📋 Setup Steps (2 minutes)

### Step 1: Deploy Edge Function

```bash
cd agrivet-integrated-management-system/project
supabase functions deploy mfa-email
```

### Step 2: Add Environment Variables

1. Go to **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Click **"Add new secret"**
3. Add these two secrets:

   **Secret 1:**
   - Name: `GMAIL_USER`
   - Value: `d31430525@gmail.com`

   **Secret 2:**
   - Name: `GMAIL_APP_PASSWORD`
   - Value: `uamzwmxbwgzszpyx` (remove spaces!)

### Step 3: Test!

1. Try logging in with MFA
2. Check your Gmail inbox (`d31430525@gmail.com`)
3. You should receive the OTP code via email! 📧

---

## 🎯 That's It!

The Edge Function will automatically:
- ✅ Use Gmail SMTP when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- ✅ Send real emails to your Gmail account
- ✅ Work immediately after deployment

---

## 🔍 Troubleshooting

**No emails received?**
1. Check **Spam folder** in Gmail
2. Check **Edge Function logs** in Supabase Dashboard
3. Verify environment variables are set correctly (no spaces in app password)

**CORS errors?**
- Make sure you deployed the function: `supabase functions deploy mfa-email`

**Still not working?**
- Check the Edge Function logs in Supabase Dashboard for detailed error messages

---

## 💡 Next Steps

Once it's working, you can:
- Test MFA login flow
- Verify emails are being sent
- Check email delivery times
- Monitor Edge Function logs

---

**Ready to deploy?** Run the command above and add the secrets! 🚀



