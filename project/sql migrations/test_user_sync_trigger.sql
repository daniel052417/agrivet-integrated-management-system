-- Safe testing script for the user sync trigger
-- This simulates creating a new auth.users record without actually inserting

-- Step 1: Check current state
SELECT 
    'Current auth.users count' as description,
    COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
    'Current public.users count' as description,
    COUNT(*) as count
FROM public.users;

-- Step 2: Test the trigger function (simulation)
-- This shows what would happen without actually inserting
DO $$
DECLARE
    test_record RECORD;
    result_count INTEGER;
BEGIN
    -- Create a test record structure (simulating what auth.users would have)
    test_record.id := gen_random_uuid();
    test_record.email := 'test@example.com';
    test_record.raw_user_meta_data := '{"first_name": "Test", "last_name": "User"}'::jsonb;
    
    RAISE NOTICE '=== TRIGGER SIMULATION ===';
    RAISE NOTICE 'Would create user with ID: %', test_record.id;
    RAISE NOTICE 'Email: %', test_record.email;
    RAISE NOTICE 'First Name: %', COALESCE(test_record.raw_user_meta_data->>'first_name', '');
    RAISE NOTICE 'Last Name: %', COALESCE(test_record.raw_user_meta_data->>'last_name', '');
    RAISE NOTICE 'User Type: customer';
    RAISE NOTICE 'Is Active: true';
    RAISE NOTICE 'Timestamps: NOW()';
    RAISE NOTICE '========================';
END $$;

-- Step 3: Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- Step 4: Check if function exists
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_auth_user';

-- Step 5: Test with a real insert (SAFE - will be cleaned up)
-- Only run this if you want to test with a real insert
/*
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test-trigger@example.com',
    '{"first_name": "Trigger", "last_name": "Test"}'::jsonb,
    NOW(),
    NOW()
);

-- Check if the trigger worked
SELECT 
    'New user created in public.users' as status,
    COUNT(*) as count
FROM public.users 
WHERE email = 'test-trigger@example.com';

-- Clean up the test record
DELETE FROM public.users WHERE email = 'test-trigger@example.com';
DELETE FROM auth.users WHERE email = 'test-trigger@example.com';
*/

