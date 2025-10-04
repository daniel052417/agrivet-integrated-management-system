-- Check existing RLS policies on users table
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
WHERE schemaname = 'public' 
AND tablename = 'users';

-- If there are restrictive policies, we might need to drop them first
-- Uncomment the lines below if you need to drop existing policies:

-- DROP POLICY IF EXISTS "policy_name_here" ON public.users;


