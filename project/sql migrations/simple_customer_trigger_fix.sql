-- ============================================================================
-- SIMPLE CUSTOMER TRIGGER FIX
-- ============================================================================
-- This script creates a simple trigger that works with your existing table structure

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_customer();

-- Step 2: Create a simple trigger function that works with your table structure
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
        
        -- Insert with all required fields
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
            is_guest,
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
            'regular', -- Use 'regular' instead of 'individual' to match your constraint
            new_customer_number,
            new_customer_code,
            (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
            NOW(),
            true,
            false, -- is_guest
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Customer record created for user_id: % with customer_number: %', NEW.id, new_customer_number;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating customer record: %', SQLERRM;
        -- Don't fail the auth signup if customer creation fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created_customer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_customer();

-- Step 4: Test the trigger
SELECT 'Simple trigger created, testing...' as status;

-- Test manual insert to verify it works
INSERT INTO public.customers (
    user_id,
    email,
    first_name,
    last_name,
    phone,
    customer_type,
    customer_number,
    customer_code,
    is_active,
    is_guest
) VALUES (
    gen_random_uuid(),
    'test-simple@example.com',
    'Test',
    'Simple',
    '+1234567890',
    'regular',
    999998,
    'CUST-999998',
    true,
    false
) ON CONFLICT (email) DO NOTHING;

-- Check if it worked
SELECT 
    'Simple trigger test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'test-simple@example.com')
        THEN 'SUCCESS - Simple trigger works'
        ELSE 'FAILED - Simple trigger still failing'
    END as result;

-- Clean up
DELETE FROM public.customers WHERE email = 'test-simple@example.com';

SELECT 'Simple trigger fix completed' as status;





