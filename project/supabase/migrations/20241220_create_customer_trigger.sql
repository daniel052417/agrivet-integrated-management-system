-- Database Trigger to Automatically Create Customer Records
-- This trigger runs whenever a new user is inserted into auth.users
-- and automatically creates a corresponding customer record

-- First, let's create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    customer_number TEXT;
    customer_code TEXT;
    timestamp_str TEXT;
BEGIN
    -- Generate unique customer identifiers
    timestamp_str := EXTRACT(EPOCH FROM NOW())::TEXT;
    customer_number := 'CUST-' || RIGHT(timestamp_str, 8);
    customer_code := 'C' || RIGHT(timestamp_str, 8);
    
    -- Extract user data from auth.users metadata
    -- For OAuth users, data comes from user_metadata
    -- For regular signup, data comes from raw_user_meta_data
    
    INSERT INTO public.customers (
        user_id,
        customer_number,
        customer_code,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        is_active,
        is_guest,
        registration_date,
        total_spent,
        total_lifetime_spent,
        loyalty_points,
        loyalty_tier,
        created_at,
        updated_at
    ) VALUES (
        NEW.id, -- auth.users.id
        customer_number,
        customer_code,
        COALESCE(
            NEW.raw_user_meta_data->>'first_name',
            NEW.user_metadata->>'first_name',
            NEW.user_metadata->>'given_name',
            SPLIT_PART(COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.user_metadata->>'full_name',
                NEW.user_metadata->>'name',
                NEW.email
            ), ' ', 1),
            SPLIT_PART(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'last_name',
            NEW.user_metadata->>'last_name',
            NEW.user_metadata->>'family_name',
            SPLIT_PART(COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.user_metadata->>'full_name',
                NEW.user_metadata->>'name',
                ''
            ), ' ', 2),
            ''
        ),
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'phone',
            NEW.user_metadata->>'phone',
            NEW.user_metadata->>'phone_number',
            NULL
        ),
        'individual',
        true,
        false,
        NOW(),
        0.00,
        0.00,
        0,
        'bronze',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create the trigger that calls the function
-- This trigger fires AFTER a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
-- The trigger function needs to be able to insert into the customers table
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.customers TO postgres, anon, authenticated, service_role;

-- Optional: Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Optional: Add a comment to document the trigger
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a customer record when a new user is created in auth.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers customer creation after user signup';

