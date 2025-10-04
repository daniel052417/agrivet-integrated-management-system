-- ============================================================================
-- USER PREFERENCES RLS POLICIES
-- ============================================================================
-- Add Row Level Security policies to the existing user_preferences table

-- Enable RLS on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for customers to access their own preferences
CREATE POLICY IF NOT EXISTS "Customers can access their own preferences" ON public.user_preferences
    FOR ALL USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
    );

-- Grant permissions to authenticated users
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_preferences' 
AND schemaname = 'public';

-- Verify policies exist
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'user_preferences' 
AND schemaname = 'public';

