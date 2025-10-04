-- Create permissive RLS policies for PWA authentication
-- This allows anonymous users to perform authentication operations

-- Users table policies
CREATE POLICY "Allow PWA user operations" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

-- Social auth providers table policies  
CREATE POLICY "Allow PWA social auth operations" ON public.social_auth_providers
    FOR ALL USING (true) WITH CHECK (true);

-- User sessions table policies
CREATE POLICY "Allow PWA session operations" ON public.user_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Email verifications table policies
CREATE POLICY "Allow PWA email verification operations" ON public.email_verifications
    FOR ALL USING (true) WITH CHECK (true);

-- PWA sessions table policies
CREATE POLICY "Allow PWA session management" ON public.pwa_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.social_auth_providers TO anon;
GRANT ALL ON public.user_sessions TO anon;
GRANT ALL ON public.email_verifications TO anon;
GRANT ALL ON public.pwa_sessions TO anon;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.social_auth_providers TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.email_verifications TO authenticated;
GRANT ALL ON public.pwa_sessions TO authenticated;


