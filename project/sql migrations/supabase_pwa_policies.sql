-- More permissive RLS policies for PWA functionality
-- Run this in your Supabase SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "PWA customers can read their own data" ON public.users;
DROP POLICY IF EXISTS "PWA customers can insert their own data" ON public.users;
DROP POLICY IF EXISTS "PWA customers can update their own data" ON public.users;
DROP POLICY IF EXISTS "PWA customers can read their own social auth" ON public.social_auth_providers;
DROP POLICY IF EXISTS "PWA customers can insert their own social auth" ON public.social_auth_providers;
DROP POLICY IF EXISTS "PWA customers can read their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "PWA customers can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "PWA customers can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "PWA customers can read their own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "PWA customers can insert their own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "PWA customers can update their own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Anyone can read pwa sessions" ON public.pwa_sessions;
DROP POLICY IF EXISTS "Anyone can insert pwa sessions" ON public.pwa_sessions;
DROP POLICY IF EXISTS "Anyone can update pwa sessions" ON public.pwa_sessions;

-- Create more permissive policies for PWA
CREATE POLICY "Allow all operations on users for PWA" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on social_auth_providers for PWA" ON public.social_auth_providers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_sessions for PWA" ON public.user_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_verifications for PWA" ON public.email_verifications
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on pwa_sessions for PWA" ON public.pwa_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Grant all necessary permissions
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.social_auth_providers TO anon;
GRANT ALL ON public.user_sessions TO anon;
GRANT ALL ON public.email_verifications TO anon;
GRANT ALL ON public.pwa_sessions TO anon;

-- Also grant to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.social_auth_providers TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.email_verifications TO authenticated;
GRANT ALL ON public.pwa_sessions TO authenticated;


