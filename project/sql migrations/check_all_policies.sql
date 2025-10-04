-- Check all existing RLS policies
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
AND tablename IN ('users', 'social_auth_providers', 'user_sessions', 'email_verifications', 'pwa_sessions')
ORDER BY tablename, policyname;

-- Also check if RLS is enabled on each table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'social_auth_providers', 'user_sessions', 'email_verifications', 'pwa_sessions');

