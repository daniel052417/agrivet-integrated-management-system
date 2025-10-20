-- ============================================================================
-- FIX GUEST UPGRADE RLS POLICIES
-- ============================================================================
-- This script adds the necessary RLS policies for guest account upgrades

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'customers';

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can upgrade their own guest accounts" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to update own guest account" ON public.customers;

-- Create policy for guest account upgrades
CREATE POLICY "Allow authenticated users to update own guest account" 
ON public.customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND is_guest = true)
WITH CHECK (auth.uid() = user_id);

-- Also allow users to read their own customer record
CREATE POLICY "Users can view own customer record" 
ON public.customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow anonymous users to insert guest customers (for initial guest creation)
CREATE POLICY "Allow anonymous users to insert guest customers" 
ON public.customers
FOR INSERT
TO anon
WITH CHECK (is_guest = true);

-- Allow authenticated users to insert non-guest customers (for new registrations)
CREATE POLICY "Allow authenticated users to insert customer records" 
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND is_guest = false);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY policyname;



