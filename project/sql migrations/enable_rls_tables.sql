-- Enable RLS on all authentication tables
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_auth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'social_auth_providers', 'user_sessions', 'email_verifications', 'pwa_sessions');


