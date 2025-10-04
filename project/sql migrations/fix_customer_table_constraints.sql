-- ============================================================================
-- FIX CUSTOMER TABLE CONSTRAINTS
-- ============================================================================
-- This script fixes the constraint issues preventing customer registration

-- Step 1: Fix the foreign key constraint
-- Drop the incorrect foreign key
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;

-- Add the correct foreign key to auth.users
ALTER TABLE public.customers 
ADD CONSTRAINT customers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Fix the customer_type constraint to include 'individual'
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS chk_customer_type;
ALTER TABLE public.customers 
ADD CONSTRAINT chk_customer_type 
CHECK (customer_type IN ('regular', 'vip', 'wholesale', 'individual', 'business'));

-- Step 3: Make customer_number and customer_code nullable or provide defaults
-- First, let's see what the current structure looks like
SELECT column_name, is_nullable, column_default, data_type
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Update the trigger function to handle the additional required fields
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
DECLARE
    new_customer_number INTEGER;
    new_customer_code TEXT;
BEGIN
    -- Only create customer record if user doesn't exist in public.users (staff)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        -- Generate customer number (get next available number)
        SELECT COALESCE(MAX(customer_number), 0) + 1 INTO new_customer_number
        FROM public.customers;
        
        -- Generate customer code
        new_customer_code := 'CUST-' || LPAD(new_customer_number::text, 6, '0');
        
        INSERT INTO public.customers (
            user_id,
            email,
            first_name,
            last_name,
            phone,
            address,
            city,
            province,
            customer_type,
            customer_number,
            customer_code,
            date_of_birth,
            registration_date,
            is_active,
            created_at,
            updated_at
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
            new_customer_number,
            new_customer_code,
            (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
            NOW(),
            true,
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Customer record created for user_id: % with customer_number: %', NEW.id, new_customer_number;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating customer record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Test the fix
SELECT 'Constraints fixed, testing manual insert...' as status;

-- Test manual insert with all required fields
INSERT INTO public.customers (
    user_id,
    email,
    first_name,
    last_name,
    phone,
    customer_type,
    customer_number,
    customer_code,
    is_active
) VALUES (
    gen_random_uuid(),
    'test-fixed@example.com',
    'Test',
    'Fixed',
    '+1234567890',
    'individual',
    999999,
    'CUST-999999',
    true
) ON CONFLICT (email) DO NOTHING;

-- Check if the manual insert worked
SELECT 
    'Fixed manual insert test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'test-fixed@example.com')
        THEN 'SUCCESS - Manual insert worked'
        ELSE 'FAILED - Manual insert still failing'
    END as result;

-- Clean up test data
DELETE FROM public.customers WHERE email = 'test-fixed@example.com';

SELECT 'Fix completed' as status;





