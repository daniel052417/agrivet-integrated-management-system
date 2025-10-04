-- Create trigger function to sync auth.users to public.users
-- This will automatically create a public.users record when a new user signs up

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
    user_email TEXT;
    user_created_at TIMESTAMP WITH TIME ZONE;
    user_updated_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Extract data from the new auth.users record
    new_user_id := NEW.id;
    user_email := NEW.email;
    user_created_at := NEW.created_at;
    user_updated_at := NEW.updated_at;
    
    -- Insert into public.users with PWA-specific defaults
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        user_type,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'customer', -- Default to customer for PWA users
        true, -- Active by default
        user_created_at,
        user_updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        updated_at = EXCLUDED.updated_at;
    
    -- Return the new record
    RETURN NEW;
END;
$$;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.users TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- Step 4: Test the function (optional - you can run this to test)
-- This will show you what the function would do with a sample record
DO $$
DECLARE
    test_record RECORD;
BEGIN
    -- Create a test record structure
    test_record.id := gen_random_uuid();
    test_record.email := 'test@example.com';
    test_record.created_at := NOW();
    test_record.updated_at := NOW();
    test_record.raw_user_meta_data := '{"first_name": "Test", "last_name": "User"}'::jsonb;
    
    RAISE NOTICE 'Test record would create user with ID: %', test_record.id;
    RAISE NOTICE 'Email: %', test_record.email;
    RAISE NOTICE 'First Name: %', COALESCE(test_record.raw_user_meta_data->>'first_name', '');
    RAISE NOTICE 'Last Name: %', COALESCE(test_record.raw_user_meta_data->>'last_name', '');
END $$;

