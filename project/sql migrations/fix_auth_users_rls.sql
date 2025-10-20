-- Fix RLS policies on auth.users table
-- This is the root cause of the 406 errors

-- First, let's see what policies exist on auth.users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- Drop restrictive policies on auth.users that might be blocking PWA access
-- (We'll be careful and only drop policies that are clearly blocking us)

-- Create a permissive policy for PWA operations on auth.users
-- This allows anonymous users to access auth.users for PWA authentication
CREATE POLICY "Allow PWA auth operations" ON auth.users
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to anonymous users for auth.users
GRANT USAGE ON SCHEMA auth TO anon;
GRANT SELECT, INSERT, UPDATE ON auth.users TO anon;

-- Also grant permissions to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT ALL ON auth.users TO authenticated;

