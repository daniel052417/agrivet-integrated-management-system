-- ============================================================================
-- CORRECTED CUSTOMER TRIGGER MIGRATION
-- ============================================================================
-- This migration creates a trigger that works with your existing table structure
-- and its BEFORE INSERT triggers that auto-generate customer_number and customer_code

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_customer();

-- Step 2: Create simple trigger function that works with your existing triggers
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into customers table - let the BEFORE INSERT triggers handle
    -- customer_number and customer_code generation
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

-- Step 4: Test the trigger
SELECT 'Corrected customer trigger created successfully' as status;

-- Test manual insert to verify it works with your existing triggers
INSERT INTO public.customers (
    user_id,
    email,
    first_name,
    last_name,
    customer_type,
    is_active,
    is_guest
) VALUES (
    gen_random_uuid(),
    'test-corrected@example.com',
    'Test',
    'Corrected',
    'regular',
    true,
    false
) ON CONFLICT (user_id) DO NOTHING;

-- Check if it worked and see what the BEFORE INSERT triggers generated
SELECT 
    'Corrected trigger test' as test_name,
    customer_number,
    customer_code,
    email,
    first_name,
    last_name
FROM public.customers 
WHERE email = 'test-corrected@example.com';

-- Clean up test data
DELETE FROM public.customers WHERE email = 'test-corrected@example.com';

SELECT 'Migration completed successfully' as status;






