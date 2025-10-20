-- ============================================================================
-- CUSTOMER AUTH SETUP DIAGNOSTIC SCRIPT
-- ============================================================================
-- Run this in your Supabase SQL editor to check if everything is set up correctly

-- 1. Check if customers table exists
SELECT 
    'customers table exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- 2. Check if trigger function exists
SELECT 
    'handle_new_customer function exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_customer' AND routine_schema = 'public') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- 3. Check if trigger exists
SELECT 
    'on_auth_user_created_customer trigger exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_customer') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- 4. Check customers table structure
SELECT 
    'customers table columns' as check_name,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as result
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public';

-- 5. Check RLS policies on customers table
SELECT 
    'customers RLS policies' as check_name,
    string_agg(policyname, ', ') as result
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'customers';

-- 6. Check if there are any existing customers
SELECT 
    'existing customers count' as check_name,
    COUNT(*)::text as result
FROM public.customers;

-- 7. Check if there are any existing users in public.users
SELECT 
    'existing users count' as check_name,
    COUNT(*)::text as result
FROM public.users;

-- 8. Test the trigger function (simulation)
-- This will show what the trigger would do without actually inserting
SELECT 
    'trigger simulation' as check_name,
    'Run the test below to simulate trigger' as result;

-- 9. Check for any constraint violations that might cause the error
SELECT 
    'constraint check' as check_name,
    'Check the constraints below' as result;

-- Show constraints on customers table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.customers'::regclass;





