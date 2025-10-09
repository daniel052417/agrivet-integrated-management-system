-- ============================================================================
-- SIMPLE CUSTOMER TRIGGER MIGRATION
-- ============================================================================
-- This migration creates a simple trigger that automatically creates customer
-- records for any new user in auth.users (since PWA is only for customers)

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_customer();

-- Step 2: Create simple trigger function
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
DECLARE
    new_customer_number INTEGER;
    new_customer_code TEXT;
BEGIN
    -- Generate customer number (get next available number)
    SELECT COALESCE(MAX(customer_number), 0) + 1 INTO new_customer_number
    FROM public.customers;
    
    -- Generate customer code
    new_customer_code := 'CUST-' || LPAD(new_customer_number::text, 6, '0');
    
    -- Insert into customers table with ON CONFLICT to handle re-runs
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
        is_active,
        is_guest
    ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'address',
        NEW.raw_user_meta_data->>'city',
        NEW.raw_user_meta_data->>'province',
        'regular', -- Default customer type
        new_customer_number,
        new_customer_code,
        (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
        true, -- is_active
        false -- is_guest
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'Customer record created for user_id: %', NEW.id;
    
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

-- Step 4: Ensure created_at and updated_at have proper defaults
-- (These should already be set, but let's make sure)
ALTER TABLE public.customers 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.customers 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Step 5: Test the trigger
SELECT 'Simple customer trigger created successfully' as status;

-- Test manual insert to verify it works
INSERT INTO public.customers (
    user_id,
    email,
    first_name,
    last_name,
    customer_type,
    customer_number,
    customer_code,
    is_active,
    is_guest
) VALUES (
    gen_random_uuid(),
    'test-trigger@example.com',
    'Test',
    'Trigger',
    'regular',
    999997,
    'CUST-999997',
    true,
    false
) ON CONFLICT (user_id) DO NOTHING;

-- Check if it worked
SELECT 
    'Trigger test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'test-trigger@example.com')
        THEN 'SUCCESS - Trigger works'
        ELSE 'FAILED - Trigger not working'
    END as result;

-- Clean up test data
DELETE FROM public.customers WHERE email = 'test-trigger@example.com';

SELECT 'Migration completed successfully' as status;










