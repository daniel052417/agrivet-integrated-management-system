# Customer Authentication Solution

## Problem
The original error occurred because there were two conflicting authentication systems:
1. **Existing system**: Used `public.users` table for all users (staff and customers)
2. **New system**: Created `public.customers` table for customers only

The error `GET https://prhxgpbqkpdnjpmxndyp.supabase.co/rest/v1/users?select=*&id=eq.2e1768d4-8a8b-42bc-a1c4-369bb0e78489 406 (Not Acceptable)` happened because the existing auth service was trying to query `public.users` but the new trigger was putting customer data in `public.customers`.

## Solution
I've implemented a clean separation where:
- **`public.users`**: Reserved for staff/employees only
- **`public.customers`**: Dedicated table for customer authentication
- **Separate triggers**: Different triggers handle staff vs customer creation
- **Compatible services**: New customer auth service that works alongside existing system

## Files Created/Modified

### 1. Database Migration
**File**: `supabase/migrations/20250125000004_customer_auth_flow.sql`
- Creates `public.customers` table with all customer-specific fields
- Creates `handle_new_customer()` trigger function
- Sets up RLS policies for customer data security
- Ensures customers are created in `public.customers` when they sign up

### 2. Customer Authentication Service
**File**: `src/pwa/src/services/customerAuthService.ts`
- Complete service for customer authentication
- Handles sign up, sign in, profile management
- Uses `public.customers` table exclusively
- Includes Google OAuth support

### 3. Integration Service
**File**: `src/pwa/src/services/customerAuthIntegration.ts`
- Bridge between new customer system and existing auth system
- Provides compatible interface for existing code
- Converts between customer and auth user formats

### 4. Test Page
**File**: `src/pwa/src/pages/CustomerAuthTest.tsx`
- Simple test interface to verify customer authentication works
- Allows testing sign up, sign in, profile retrieval, and sign out

## How It Works

### 1. Customer Registration Flow
1. User fills out registration form
2. `customerAuthService.signUpWithEmail()` is called
3. Supabase Auth creates user in `auth.users`
4. `handle_new_customer()` trigger automatically creates record in `public.customers`
5. Customer profile is returned to the frontend

### 2. Customer Sign In Flow
1. User enters email/password
2. `customerAuthService.signInWithEmail()` authenticates with Supabase Auth
3. Service fetches customer profile from `public.customers`
4. Customer data is available in the app

### 3. Database Structure
```sql
-- Staff/Employees (existing)
public.users
- id, email, first_name, last_name, user_type, is_active, etc.

-- Customers (new)
public.customers  
- id, user_id, email, first_name, last_name, phone, address, city, province, postal_code, date_of_birth, customer_type, registration_date, is_active, total_spent, last_purchase_date, loyalty_points, loyalty_tier, total_lifetime_spent, assigned_staff_id, created_at, updated_at
```

## Usage

### Basic Customer Authentication
```typescript
import { customerAuthService } from './services/customerAuthService'

// Sign up
const result = await customerAuthService.signUpWithEmail({
  email: 'customer@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  customer_type: 'individual'
})

// Sign in
const result = await customerAuthService.signInWithEmail({
  email: 'customer@example.com',
  password: 'password123'
})

// Get current customer
const customer = await customerAuthService.getCurrentCustomer()
```

### Integration with Existing System
```typescript
import { customerAuthIntegration } from './services/customerAuthIntegration'

// Use the integration service for compatibility
const result = await customerAuthIntegration.register({
  email: 'customer@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890'
})
```

## Testing

1. **Run the migration**: Execute the SQL migration in your Supabase dashboard
2. **Test the flow**: Use the `CustomerAuthTest` page to test registration and login
3. **Verify data**: Check that customer records are created in `public.customers` table
4. **Check RLS**: Ensure customers can only access their own data

## Benefits

1. **Clean Separation**: Staff and customers have separate data structures
2. **No Conflicts**: Existing staff system remains unchanged
3. **Scalable**: Easy to add customer-specific features
4. **Secure**: Proper RLS policies protect customer data
5. **Compatible**: Works alongside existing authentication system

## Next Steps

1. **Run the migration** in your Supabase dashboard
2. **Test the customer authentication** using the test page
3. **Update your existing auth forms** to use the new customer service
4. **Add customer-specific features** like loyalty programs, order history, etc.
5. **Remove the old customer logic** from the existing auth service once everything is working

The solution maintains backward compatibility while providing a clean, separate system for customer authentication that won't interfere with your existing staff management system.





