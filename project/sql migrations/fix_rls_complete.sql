-- Complete RLS fix for PWA authentication
-- This script will fix all RLS issues

-- Step 1: Drop all existing policies first (to avoid conflicts)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
    
    -- Drop policies on other tables
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('social_auth_providers', 'user_sessions', 'email_verifications', 'pwa_sessions'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Step 2: Enable RLS on all tables
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_auth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
-- users table already has RLS enabled

-- Step 3: Create permissive policies for PWA operations
-- Users table - allow all operations for PWA
CREATE POLICY "pwa_users_all" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

-- Social auth providers table
CREATE POLICY "pwa_social_auth_all" ON public.social_auth_providers
    FOR ALL USING (true) WITH CHECK (true);

-- User sessions table
CREATE POLICY "pwa_user_sessions_all" ON public.user_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Email verifications table
CREATE POLICY "pwa_email_verifications_all" ON public.email_verifications
    FOR ALL USING (true) WITH CHECK (true);

-- PWA sessions table
CREATE POLICY "pwa_sessions_all" ON public.pwa_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Grant permissions to anonymous and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.social_auth_providers TO anon, authenticated;
GRANT ALL ON public.user_sessions TO anon, authenticated;
GRANT ALL ON public.email_verifications TO anon, authenticated;
GRANT ALL ON public.pwa_sessions TO anon, authenticated;

-- Step 5: Grant sequence permissions (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 6: Verify the setup
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN ('users', 'social_auth_providers', 'user_sessions', 'email_verifications', 'pwa_sessions')
ORDER BY tablename;

