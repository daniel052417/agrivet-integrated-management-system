-- ============================================================================
-- FIX TRIGGER FUNCTIONS
-- ============================================================================
-- This script fixes the trigger function by removing references to non-existent functions
-- and letting the existing BEFORE INSERT triggers handle customer_number and customer_code

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_customer();

-- Step 2: Create the fixed trigger function
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
        'regular', -- Use 'regular' instead of 'individual' to match your constraint
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

-- Step 4: Test the trigger with the existing user
-- First, manually create a customer record for the existing user
INSERT INTO public.customers (
    user_id,
    email,
    first_name,
    last_name,
    phone,
    customer_type,
    is_active,
    is_guest
) VALUES (
    '69e78c78-52a3-4aef-adce-3cbc395ff2a1',
    'johnpepito773@gmail.com',
    'John',
    'Mathew',
    '09616633203',
    'regular',
    true,
    false
) ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Verify the customer record was created
SELECT 
    'Customer record created' as status,
    id,
    user_id,
    email,
    first_name,
    last_name,
    customer_number,
    customer_code,
    created_at
FROM public.customers 
WHERE user_id = '69e78c78-52a3-4aef-adce-3cbc395ff2a1';

-- Step 6: Test the trigger with a new user (simulation)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test-trigger-fix@example.com';
    mock_new RECORD;
BEGIN
    -- Create a mock NEW record
    mock_new.id := test_user_id;
    mock_new.email := test_email;
    mock_new.raw_user_meta_data := '{"first_name": "Test", "last_name": "Trigger", "phone": "+1234567890"}'::jsonb;
    mock_new.raw_app_meta_data := '{}'::jsonb;
    mock_new.created_at := NOW();
    mock_new.updated_at := NOW();
    
    -- Call the trigger function
    PERFORM public.handle_new_customer();
    
    RAISE NOTICE 'Trigger function test completed successfully';
    
    -- Check if customer record was created
    IF EXISTS (SELECT 1 FROM public.customers WHERE user_id = test_user_id) THEN
        RAISE NOTICE 'SUCCESS: Customer record was created by trigger';
    ELSE
        RAISE NOTICE 'FAILED: Customer record was not created by trigger';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.customers WHERE user_id = test_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing trigger function: %', SQLERRM;
END $$;

SELECT 'Trigger fix completed' as status;




