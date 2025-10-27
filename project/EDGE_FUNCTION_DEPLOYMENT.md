# Supabase Edge Function Deployment Guide

## Overview
This guide shows you how to deploy the Edge Function that automatically creates customer records when users sign up. This is the recommended approach for Supabase SaaS since you can't create triggers directly on `auth.users`.

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Your Supabase project configured
- Service role key available

## Step 1: Deploy the Edge Function

### Using Supabase CLI (Recommended)
```bash
# Navigate to your project directory
cd project

# Deploy the Edge Function
supabase functions deploy create-customer

# Set environment variables (if not already set)
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Manual Deployment via Dashboard
1. Go to your Supabase dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `create-customer`
5. Copy the code from `supabase/functions/create-customer/index.ts`
6. Deploy the function

## Step 2: Test the Edge Function

### Test via Dashboard
1. Go to **Edge Functions** in your Supabase dashboard
2. Click on `create-customer`
3. Use the **Test** tab with this payload:
```json
{
  "user_id": "test-user-id",
  "email": "test@example.com",
  "user_metadata": {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  },
  "raw_user_meta_data": {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }
}
```

### Test via Application
1. Try registering a new user
2. Check the console logs for Edge Function calls
3. Verify customer record is created in the `customers` table

## Step 3: Verify Setup

### Check Function Status
```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs create-customer
```

### Verify Customer Creation
```sql
-- Check recent customer creations
SELECT * FROM customers ORDER BY created_at DESC LIMIT 10;

-- Verify user-customer relationships
SELECT u.id, u.email, c.customer_number, c.first_name 
FROM auth.users u 
JOIN customers c ON u.id = c.user_id 
ORDER BY u.created_at DESC LIMIT 10;
```

## Step 4: Environment Variables

Make sure these are set in your Supabase project:

### Required Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (not anon key)

### Setting via CLI
```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Setting via Dashboard
1. Go to **Settings** → **Edge Functions**
2. Add the environment variables
3. Save changes

## Troubleshooting

### Function Not Deploying
- Check Supabase CLI version: `supabase --version`
- Verify you're logged in: `supabase login`
- Check project link: `supabase status`

### Function Errors
- Check function logs: `supabase functions logs create-customer`
- Verify environment variables are set
- Check database permissions on `customers` table

### Customer Not Created
- Verify Edge Function is being called (check console logs)
- Check function logs for errors
- Verify RLS policies allow INSERT on `customers` table

## Alternative: Database Webhook

If Edge Functions don't work for you, you can also use a database webhook:

1. Go to **Database** → **Webhooks** in Supabase dashboard
2. Create a new webhook
3. Set it to trigger on `auth.users` INSERT
4. Point it to your Edge Function URL

## Benefits of This Approach

### ✅ **Supabase SaaS Compatible**
- Works with hosted Supabase
- No need for database owner permissions
- Uses official Supabase features

### ✅ **Reliable**
- Edge Functions are serverless and scalable
- Automatic retries and error handling
- No dependency on application code execution

### ✅ **Maintainable**
- Single function handles all customer creation
- Easy to modify customer creation logic
- Centralized error handling and logging

### ✅ **Secure**
- Uses service role key for database access
- Proper CORS handling
- Input validation and sanitization

## Next Steps

1. **Deploy the Edge Function** using the steps above
2. **Test customer creation** with both regular signup and OAuth
3. **Monitor function logs** for any issues
4. **Update your application** to use the new customer creation flow

The Edge Function approach is the most reliable way to handle automatic customer creation in Supabase SaaS!

