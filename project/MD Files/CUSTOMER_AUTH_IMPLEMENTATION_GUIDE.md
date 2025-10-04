# Customer Authentication Implementation Guide

## Overview

This guide provides a complete solution for automatically creating customer records when users sign up via Supabase Auth, with support for guest users and seamless upgrades.

## Problem Solved

- **Issue**: New user signups create records in `auth.users` but don't automatically create corresponding `public.customers` records
- **Solution**: Database triggers that automatically create customer records with proper `customer_number` and `customer_code` generation
- **Bonus**: Support for guest users and seamless upgrade to full accounts

## Implementation Steps

### 1. Database Migration

Run the migration file to update your database schema:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20250125000008_fix_customer_auth_flow.sql
```

This migration will:
- ✅ Add missing columns (`user_id`, `customer_number`, `is_guest`, `province`)
- ✅ Create BEFORE INSERT triggers for `customer_number` and `customer_code` generation
- ✅ Create AFTER INSERT trigger on `auth.users` to auto-create customer records
- ✅ Add proper constraints and indexes
- ✅ Enable Row Level Security (RLS)
- ✅ Create guest upgrade function

### 2. Update Your Authentication Service

Replace your current auth service with the enhanced version:

```typescript
// Replace your current authService.ts with enhancedAuthService.ts
import { enhancedAuthService } from './services/enhancedAuthService'

// Use in your components
const handleRegister = async (data) => {
  const result = await enhancedAuthService.register(data)
  if (result.user) {
    // Registration successful
    setUser(result.user)
  } else {
    // Handle error
    setError(result.error)
  }
}
```

### 3. Key Features

#### Automatic Customer Creation
- When a user signs up via Supabase Auth, a trigger automatically creates a `public.customers` record
- Customer numbers and codes are auto-generated using BEFORE INSERT triggers
- No manual intervention required

#### Guest User Support
```typescript
// Create a guest user
const guestResult = await enhancedAuthService.createGuestUser()

// Upgrade guest to full account
const upgradeResult = await enhancedAuthService.upgradeGuestToCustomer(
  guestUserId, 
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  }
)
```

#### Robust Error Handling
- Retry logic for trigger delays
- Comprehensive error messages
- Graceful fallbacks

### 4. Database Schema Changes

#### Before (Current Schema)
```sql
CREATE TABLE public.customers (
    id UUID PRIMARY KEY,
    customer_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT DEFAULT '',
    -- Missing user_id, customer_number, is_guest columns
);
```

#### After (Enhanced Schema)
```sql
CREATE TABLE public.customers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_number VARCHAR(20) UNIQUE,
    customer_code TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT DEFAULT '',
    is_guest BOOLEAN DEFAULT false,
    -- ... other columns
);
```

### 5. Trigger Functions

#### Customer Number Generation
```sql
CREATE OR REPLACE FUNCTION public.set_customer_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    IF NEW.customer_number IS NULL THEN
        SELECT COALESCE(MAX(customer_number::INTEGER), 0) + 1 
        INTO next_number
        FROM public.customers
        WHERE customer_number ~ '^[0-9]+$';
        
        NEW.customer_number := next_number::VARCHAR;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Customer Code Generation
```sql
CREATE OR REPLACE FUNCTION public.set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_code IS NULL THEN
        NEW.customer_code := 'CUST-' || LPAD(NEW.customer_number, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Auto-Create Customer on User Signup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create customer if not a staff user
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        INSERT INTO public.customers (
            user_id, email, first_name, last_name, phone,
            address, city, province, customer_type, date_of_birth,
            is_active, is_guest
        ) VALUES (
            NEW.id,
            COALESCE(NEW.email, ''),
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'address',
            NEW.raw_user_meta_data->>'city',
            NEW.raw_user_meta_data->>'province',
            COALESCE(NEW.raw_user_meta_data->>'customer_type', 'individual'),
            (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
            true, false
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. Row Level Security (RLS)

The migration includes proper RLS policies:

```sql
-- Customers can view their own profile
CREATE POLICY "Customers can view own profile" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

-- Customers can update their own profile
CREATE POLICY "Customers can update own profile" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

-- Staff can view all customers
CREATE POLICY "Staff can view all customers" ON public.customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.staff_user_links sul ON u.id = sul.user_id
            WHERE u.id = auth.uid() AND sul.link_status = 'active'
        )
    );
```

### 7. Testing the Implementation

#### Test User Registration
```typescript
const testRegistration = async () => {
  const result = await enhancedAuthService.register({
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890'
  })
  
  console.log('Registration result:', result)
  // Should show customer_number and customer_code
}
```

#### Test Guest User Flow
```typescript
const testGuestFlow = async () => {
  // Create guest
  const guest = await enhancedAuthService.createGuestUser()
  console.log('Guest created:', guest.user?.customer_code)
  
  // Upgrade guest
  const upgrade = await enhancedAuthService.upgradeGuestToCustomer(
    guest.user!.id,
    {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com'
    }
  )
  console.log('Guest upgraded:', upgrade.user?.is_guest) // Should be false
}
```

### 8. Migration Checklist

- [ ] Run the database migration
- [ ] Replace auth service with enhanced version
- [ ] Update your components to use the new service
- [ ] Test user registration flow
- [ ] Test guest user creation and upgrade
- [ ] Verify customer numbers and codes are generated
- [ ] Test RLS policies work correctly

### 9. Troubleshooting

#### Common Issues

1. **Customer record not created after signup**
   - Check if trigger is installed: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_customer'`
   - Check trigger function: `SELECT * FROM pg_proc WHERE proname = 'handle_new_customer'`

2. **Customer number not generated**
   - Check BEFORE INSERT triggers: `SELECT * FROM pg_trigger WHERE tgname LIKE '%customer_number%'`
   - Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'set_customer_number'`

3. **RLS blocking access**
   - Check policies: `SELECT * FROM pg_policies WHERE tablename = 'customers'`
   - Verify user is authenticated: `SELECT auth.uid()`

#### Debug Queries

```sql
-- Check if triggers exist
SELECT tgname, tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'public.customers'::regclass;

-- Check customer records
SELECT user_id, customer_number, customer_code, is_guest
FROM public.customers
ORDER BY created_at DESC
LIMIT 10;

-- Check recent auth users
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

### 10. Benefits

✅ **Automatic Customer Creation**: No manual intervention required  
✅ **Proper Numbering**: Sequential customer numbers and codes  
✅ **Guest Support**: Seamless guest user experience  
✅ **Data Integrity**: Proper constraints and relationships  
✅ **Security**: Row Level Security policies  
✅ **Error Handling**: Robust error handling and retry logic  
✅ **Backward Compatible**: Works with existing code  

This implementation provides a complete, production-ready solution for your customer authentication flow.



