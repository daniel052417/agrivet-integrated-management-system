-- ============================================================================
-- DEBUG CUSTOMER TRIGGER
-- ============================================================================
-- This script helps debug why the trigger isn't creating customer records

-- Step 1: Check if the user exists in auth.users
SELECT 
    'User in auth.users' as check_name,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'johnpepito773@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: Check if customer record was created
SELECT 
    'Customer record exists' as check_name,
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

-- Step 3: Check RLS policies on customers table
SELECT 
    'RLS Policies' as check_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'customers';

-- Step 4: Test RLS access (this will show if RLS is blocking)
SELECT 
    'RLS Test' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'johnpepito773@gmail.com')
        THEN 'SUCCESS - RLS allows access'
        ELSE 'FAILED - RLS blocks access or no record exists'
    END as result;

-- Step 5: Check if trigger function exists and is working
SELECT 
    'Trigger function exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_customer')
        THEN 'YES'
        ELSE 'NO'
    END as result;

-- Step 6: Check if trigger exists
SELECT 
    'Trigger exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_customer')
        THEN 'YES'
        ELSE 'NO'
    END as result;

-- Step 7: Manually test the trigger function with the actual user ID
-- First get the user ID
DO $$
DECLARE
    user_id_to_test UUID;
    customer_count INTEGER;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id_to_test 
    FROM auth.users 
    WHERE email = 'johnpepito773@gmail.com'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF user_id_to_test IS NOT NULL THEN
        RAISE NOTICE 'Found user ID: %', user_id_to_test;
        
        -- Check if customer record exists
        SELECT COUNT(*) INTO customer_count
        FROM public.customers 
        WHERE user_id = user_id_to_test;
        
        RAISE NOTICE 'Customer records for this user: %', customer_count;
        
        -- Try to manually create customer record
        IF customer_count = 0 THEN
            INSERT INTO public.customers (
                user_id,
                email,
                first_name,
                last_name,
                customer_type,
                is_active,
                is_guest
            ) VALUES (
                user_id_to_test,
                'johnpepito773@gmail.com',
                'John',
                'Pepito',
                'regular',
                true,
                false
            )
            ON CONFLICT (user_id) DO NOTHING;
            
            RAISE NOTICE 'Manual customer record creation attempted';
        END IF;
    ELSE
        RAISE NOTICE 'User not found in auth.users';
    END IF;
END $$;

-- Step 8: Check again if customer record exists after manual creation
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





