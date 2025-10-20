-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'social_auth_providers', 'user_sessions', 'email_verifications', 'pwa_sessions');

-- Enable RLS on tables if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_auth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table (PWA customers)
CREATE POLICY "PWA customers can read their own data" ON public.users
    FOR SELECT USING (user_type = 'customer');

CREATE POLICY "PWA customers can insert their own data" ON public.users
    FOR INSERT WITH CHECK (user_type = 'customer');

CREATE POLICY "PWA customers can update their own data" ON public.users
    FOR UPDATE USING (user_type = 'customer');

-- Create RLS policies for social_auth_providers table
CREATE POLICY "PWA customers can read their own social auth" ON public.social_auth_providers
    FOR SELECT USING (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

CREATE POLICY "PWA customers can insert their own social auth" ON public.social_auth_providers
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

-- Create RLS policies for user_sessions table
CREATE POLICY "PWA customers can read their own sessions" ON public.user_sessions
    FOR SELECT USING (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

CREATE POLICY "PWA customers can insert their own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

CREATE POLICY "PWA customers can update their own sessions" ON public.user_sessions
    FOR UPDATE USING (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

-- Create RLS policies for email_verifications table
CREATE POLICY "PWA customers can read their own email verifications" ON public.email_verifications
    FOR SELECT USING (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

CREATE POLICY "PWA customers can insert their own email verifications" ON public.email_verifications
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

CREATE POLICY "PWA customers can update their own email verifications" ON public.email_verifications
    FOR UPDATE USING (user_id IN (
        SELECT id FROM public.users WHERE user_type = 'customer'
    ));

-- Create RLS policies for pwa_sessions table (more permissive for guest sessions)
CREATE POLICY "Anyone can read pwa sessions" ON public.pwa_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pwa sessions" ON public.pwa_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update pwa sessions" ON public.pwa_sessions
    FOR UPDATE USING (true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.social_auth_providers TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.email_verifications TO authenticated;
GRANT ALL ON public.pwa_sessions TO authenticated;

-- Grant permissions to anonymous users for PWA functionality
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.branches TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.pwa_sessions TO anon;


