-- Auto-sync trigger for auth.users -> public.users
-- This eliminates the need for manual frontend inserts

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert into public.users with automatic values
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
        NEW.id,                    -- Copy ID from auth.users
        NEW.email,                 -- Copy email from auth.users
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),  -- Extract first_name from metadata
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),   -- Extract last_name from metadata
        'customer',                -- Set default user_type
        true,                      -- Set is_active to true
        NOW(),                     -- Set created_at to current timestamp
        NOW()                      -- Set updated_at to current timestamp
    )
    ON CONFLICT (id) DO NOTHING;   -- Avoid duplicate key errors
    
    -- Return the new record
    RETURN NEW;
END;
$$;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT, INSERT ON public.users TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- Step 4: Sync existing auth.users records (one-time operation)
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
    NOW(),
    NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify the setup
SELECT 
    'Trigger created successfully' as status,
    'Function: public.handle_new_auth_user()' as function_name,
    'Trigger: on_auth_user_created' as trigger_name;

