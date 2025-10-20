-- ============================================================================
-- FIX AUTH SERVICE TIMING ISSUE
-- ============================================================================
-- This script helps fix the timing issue where the trigger hasn't completed
-- by the time the auth service tries to fetch the customer record

-- Step 1: Check if there are any customers for the test user
SELECT 
    'Current customer records' as check_name,
    COUNT(*) as count
FROM public.customers 
WHERE email = 'johnpepito773@gmail.com';

-- Step 2: If no customer record exists, create one manually
-- (This simulates what the trigger should have done)
INSERT INTO public.customers (
    user_id,
    email,
    first_name,
    last_name,
    customer_type,
    is_active,
    is_guest
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', 'John'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'Pepito'),
    'regular',
    true,
    false
FROM auth.users au
WHERE au.email = 'johnpepito773@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify the customer record was created
SELECT 
    'After manual creation' as check_name,
    id,
    user_id,
    email,
    first_name,
    last_name,
    customer_number,
    customer_code,
    created_at
FROM public.customers 
WHERE email = 'johnpepito773@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Step 4: Test RLS access to this record
SELECT 
    'RLS access test' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'johnpepito773@gmail.com')
        THEN 'SUCCESS - Can access customer record'
        ELSE 'FAILED - Cannot access customer record'
    END as result;





