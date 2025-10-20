-- Sync existing auth.users to public.users and fix RLS policies
-- Run this after creating the trigger function

-- Step 1: Sync existing auth.users to public.users
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    user_type,
    is_active,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    'customer',
    true,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Fix RLS policies for PWA operations
-- Drop existing restrictive policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop policies on public.users
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

-- Step 3: Enable RLS on all tables
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_auth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive policies for PWA operations
CREATE POLICY "pwa_users_all" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pwa_social_auth_all" ON public.social_auth_providers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pwa_user_sessions_all" ON public.user_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pwa_email_verifications_all" ON public.email_verifications
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pwa_sessions_all" ON public.pwa_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.social_auth_providers TO anon, authenticated;
GRANT ALL ON public.user_sessions TO anon, authenticated;
GRANT ALL ON public.email_verifications TO anon, authenticated;
GRANT ALL ON public.pwa_sessions TO anon, authenticated;

-- Step 6: Add unique constraints to prevent duplicates
ALTER TABLE public.users 
ADD CONSTRAINT unique_customer_email 
UNIQUE (email, user_type);

ALTER TABLE public.social_auth_providers 
ADD CONSTRAINT unique_provider_user 
UNIQUE (provider, provider_user_id);

-- Step 7: Verify the setup
SELECT 
    'Users synced' as status,
    COUNT(*) as count
FROM public.users
WHERE user_type = 'customer'

UNION ALL

SELECT 
    'Auth users' as status,
    COUNT(*) as count
FROM auth.users;

