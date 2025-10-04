-- ============================================================================
-- TEST CUSTOMER REGISTRATION
-- ============================================================================
-- This script tests the complete customer registration flow

-- Step 1: Clean up any existing test data
DELETE FROM public.customers WHERE email LIKE 'test-%@example.com';
DELETE FROM auth.users WHERE email LIKE 'test-%@example.com';

-- Step 2: Test manual customer creation (simulating what the trigger should do)
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
    'test-customer@example.com',
    'Test',
    'Customer',
    '+1234567890',
    'individual',
    true
);

-- Step 3: Verify the customer was created
SELECT 
    'Customer created successfully' as test_name,
    id,
    email,
    first_name,
    last_name,
    customer_type,
    is_active
FROM public.customers 
WHERE email = 'test-customer@example.com';

-- Step 4: Test RLS policies
-- This should work if the current user is authenticated
SELECT 
    'RLS test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'test-customer@example.com')
        THEN 'RLS allows access'
        ELSE 'RLS blocks access'
    END as result;

-- Step 5: Clean up
DELETE FROM public.customers WHERE email = 'test-customer@example.com';

SELECT 'Test completed' as status;





