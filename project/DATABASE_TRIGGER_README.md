# Database Trigger for Customer Creation

## Overview
This solution uses a PostgreSQL database trigger to automatically create customer records whenever a new user is created in `auth.users` (Supabase's built-in authentication table). This eliminates the need for manual customer creation in the application code and makes the process more reliable.

## How It Works

### 1. **Trigger Function** (`handle_new_user()`)
- Runs automatically after a new user is inserted into `auth.users`
- Extracts user data from OAuth metadata or regular signup data
- Creates a corresponding customer record in the `customers` table
- Handles both regular signup and OAuth (Google/Facebook) users

### 2. **Data Extraction**
The trigger intelligently extracts user information from different sources:
- **Regular Signup**: Uses `raw_user_meta_data` (from signup form)
- **OAuth Users**: Uses `user_metadata` (from OAuth provider)
- **Fallback**: Uses email as last resort for name extraction

### 3. **Automatic Customer Creation**
For each new user, the trigger creates a customer record with:
- Unique customer number (`CUST-{timestamp}`)
- Unique customer code (`C{timestamp}`)
- Extracted name, email, phone
- Default values (bronze tier, 0 loyalty points, etc.)

## Benefits

### ✅ **Reliability**
- No dependency on application code execution
- Works even if the application crashes during signup
- Consistent customer record creation

### ✅ **Simplicity**
- No manual customer creation logic in the app
- Automatic handling of both regular and OAuth signups
- Reduced application complexity

### ✅ **Performance**
- Database-level operation (faster than application code)
- No additional API calls needed
- Atomic transaction (user + customer created together)

### ✅ **Maintainability**
- Single point of customer creation logic
- Easy to modify customer creation rules
- No scattered customer creation code

## Setup Instructions

### Option 1: Using Supabase CLI (Recommended)
```bash
# Run the setup script
chmod +x setup-trigger.sh
./setup-trigger.sh
```

### Option 2: Manual Setup
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20241220_create_customer_trigger.sql`
4. Run the SQL script

### Option 3: Using Migration Files
```bash
# If you have Supabase CLI configured
supabase db push
```

## Testing the Trigger

### 1. **Test Regular Registration**
- Sign up with email/password
- Check `customers` table for new record
- Verify customer data matches signup form

### 2. **Test Google OAuth**
- Click Google login button
- Complete OAuth flow
- Check `customers` table for new record
- Verify customer data extracted from Google profile

### 3. **Verify Data Quality**
- Check that customer numbers are unique
- Verify email addresses are correct
- Confirm names are properly extracted

## Troubleshooting

### **Trigger Not Working**
- Check if the trigger function exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Verify permissions: The trigger needs INSERT access on `customers` table
- Check Supabase logs for trigger execution errors

### **Missing Customer Data**
- Verify OAuth provider is sending user metadata
- Check if `user_metadata` contains expected fields
- Review trigger function logic for data extraction

### **Permission Errors**
- Ensure the trigger function has `SECURITY DEFINER`
- Grant necessary permissions to the function
- Check RLS policies on `customers` table

## Code Changes Made

### **authService.ts Updates**
- Removed manual customer creation logic
- Added trigger verification (waits for trigger to complete)
- Enhanced error handling for trigger failures
- Simplified OAuth callback flow

### **Database Schema**
- Added trigger function `handle_new_user()`
- Added trigger `on_auth_user_created`
- Added index on `customers.user_id` for performance
- Added proper permissions and comments

## Monitoring

### **Check Trigger Status**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check recent customer creations
SELECT * FROM customers ORDER BY created_at DESC LIMIT 10;

-- Verify user-customer relationships
SELECT u.id, u.email, c.customer_number, c.first_name 
FROM auth.users u 
JOIN customers c ON u.id = c.user_id 
ORDER BY u.created_at DESC LIMIT 10;
```

### **Logs to Watch**
- Supabase function logs (if trigger fails)
- Application console logs (trigger verification)
- Database query logs (performance monitoring)

## Future Enhancements

### **Potential Improvements**
- Add email notifications on customer creation
- Implement customer data validation
- Add audit logging for customer creation
- Create customer onboarding workflows
- Add customer segmentation logic

### **Advanced Features**
- Customer data enrichment from external APIs
- Automatic customer categorization
- Integration with CRM systems
- Customer lifecycle management

This trigger-based approach provides a robust, scalable solution for customer creation that works seamlessly with both regular signup and OAuth flows.

