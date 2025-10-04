-- ============================================================================
-- FIX CUSTOMER RLS POLICIES
-- ============================================================================
-- This script fixes RLS policies that might be blocking customer creation

-- Step 1: Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'customers';

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can insert own profile" ON public.customers;
DROP POLICY IF EXISTS "Staff can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can update customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can read own data" ON public.customers;

-- Step 3: Create simple, permissive policies for PWA customers
-- Allow anyone to insert (for the trigger)
CREATE POLICY "Allow customer creation" ON public.customers
    FOR INSERT WITH CHECK (true);

-- Allow customers to view their own data
CREATE POLICY "Customers can view own data" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

-- Allow customers to update their own data
CREATE POLICY "Customers can update own data" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow staff to view all customers (if you have staff system)
CREATE POLICY "Staff can view customers" ON public.customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.staff 
            JOIN public.staff_user_links ON staff.id = staff_user_links.staff_id 
            WHERE staff_user_links.user_id = auth.uid() 
            AND staff_user_links.link_status = 'active'
        )
    );

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.customers TO authenticated, anon;

-- Step 5: Test the policies
SELECT 'RLS policies updated' as status;

-- Test if we can insert a customer record
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
    'test-rls@example.com',
    'Test',
    'RLS',
    'regular',
    true,
    false
) ON CONFLICT (user_id) DO NOTHING;

-- Check if it worked
SELECT 
    'RLS test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.customers WHERE email = 'test-rls@example.com')
        THEN 'SUCCESS - RLS allows insert'
        ELSE 'FAILED - RLS still blocking'
    END as result;

-- Clean up test data
DELETE FROM public.customers WHERE email = 'test-rls@example.com';

SELECT 'RLS fix completed' as status;





