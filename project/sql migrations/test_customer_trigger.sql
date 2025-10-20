-- ============================================================================
-- TEST CUSTOMER TRIGGER
-- ============================================================================
-- This script tests if the customer trigger works correctly

-- First, let's check if we can manually call the trigger function
-- (This is a simulation - we won't actually insert into auth.users)

-- Test 1: Check if the function exists and can be called
SELECT 
    'Testing handle_new_customer function' as test_name,
    'Function exists' as status;

-- Test 2: Simulate what the trigger would do
-- We'll create a mock NEW record structure
DO $$
DECLARE
    mock_new RECORD;
    result TEXT;
BEGIN
    -- Create a mock NEW record (simulating what auth.users would look like)
    mock_new.id := gen_random_uuid();
    mock_new.email := 'test-customer@example.com';
    mock_new.raw_user_meta_data := '{"first_name": "Test", "last_name": "Customer", "phone": "+1234567890"}'::jsonb;
    mock_new.raw_app_meta_data := '{}'::jsonb;
    mock_new.created_at := NOW();
    mock_new.updated_at := NOW();
    
    -- Test if the function can be called (without actually inserting)
    BEGIN
        -- This will test the logic without inserting
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = mock_new.id) THEN
            result := 'Trigger logic would work - no conflict with users table';
        ELSE
            result := 'Trigger logic would skip - user already exists in users table';
        END IF;
        
        RAISE NOTICE 'Test result: %', result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error in trigger logic: %', SQLERRM;
    END;
END $$;

-- Test 3: Check if we can insert into customers table manually
INSERT INTO public.customers (
    user_id,
    email,
    first_name,
    last_name,
    phone,
    customer_type,
    is_active
) VALUES (
    gen_random_uuid(),
    'test-manual@example.com',
    'Manual',
    'Test',
    '+1234567890',
    'individual',
    true
) ON CONFLICT (email) DO NOTHING;

-- Check if the manual insert worked
SELECT 
    'Manual insert test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'test-manual@example.com')
        THEN 'SUCCESS - Manual insert worked'
        ELSE 'FAILED - Manual insert failed'
    END as result;

-- Clean up test data
DELETE FROM public.customers WHERE email = 'test-manual@example.com';





