# SendGrid Setup Guide

## ✅ Edge Function Updated
The `send-email` Edge Function has been successfully updated with SendGrid integration and deployed.

## 🔧 Required Environment Variables

Set these in your Supabase project dashboard:

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard/project/prhxgpbqkpdnjpmxndyp/functions
- Go to **Settings → Edge Functions**

### 2. Add Environment Variables
Add these three environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `SENDGRID_API_KEY` | `SG.xxxxxxxxxxxxx` | Your SendGrid API key |
| `FROM_EMAIL` | `noreply@yourdomain.com` | Verified sender email |
| `FRONTEND_URL` | `http://localhost:3000` | Your frontend URL |

## 📧 SendGrid Account Setup

### 1. Create SendGrid Account
- Go to https://sendgrid.com
- Sign up for free account (100 emails/day)
- Verify your email address

### 2. Get API Key
- Go to **Settings → API Keys**
- Click **Create API Key**
- Choose **Restricted Access**
- Give it **Mail Send** permissions
- Copy the API key (starts with `SG.`)

### 3. Verify Sender Email
- Go to **Settings → Sender Authentication**
- Click **Verify a Single Sender**
- Add your email (e.g., `noreply@yourdomain.com`)
- Check your email and click verification link

## 🧪 Testing the Integration

### 1. Test from Application
- Try approving an account request
- Check browser console for: `✅ Email sent successfully via SendGrid`
- Check your email inbox

### 2. Check Edge Function Logs
- Go to Supabase Dashboard → Functions → send-email
- Look for logs showing SendGrid API calls
- Check for any error messages

## 📊 Expected Response Format

The Edge Function now returns:
```json
{
  "success": true,
  "messageId": "sg_1234567890_abcdef",
  "message": "Email sent successfully via SendGrid",
  "to": "user@example.com",
  "subject": "Activate Your Account - AgriVet Management System",
  "type": "activation"
}
```

## 🔍 Troubleshooting

### Common Issues:

1. **"SENDGRID_API_KEY environment variable is not set"**
   - Add the API key to Supabase environment variables

2. **"SendGrid API error: 401"**
   - Check if API key is correct
   - Ensure API key has Mail Send permissions

3. **"SendGrid API error: 403"**
   - Verify sender email in SendGrid
   - Check if sender email is verified

4. **"SendGrid API error: 400"**
   - Check email format
   - Ensure all required fields are present

### Debug Steps:
1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Test API key in SendGrid dashboard
4. Check sender email verification status

## 🎯 Next Steps

1. **Set up SendGrid account** (if not done)
2. **Add environment variables** in Supabase
3. **Test email sending** from your application
4. **Check email delivery** in SendGrid dashboard

## 📈 SendGrid Features

- **Free tier:** 100 emails/day
- **Email tracking:** Open rates, click rates
- **Email templates:** Reusable templates
- **Analytics:** Detailed email statistics
- **Webhooks:** Real-time delivery notifications

**The Edge Function is ready - just add your SendGrid credentials!**
