-- Database Webhook Setup for Customer Creation
-- This creates a webhook that Supabase will call when a user is created

-- First, create a webhook function
CREATE OR REPLACE FUNCTION public.webhook_create_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    customer_number TEXT;
    customer_code TEXT;
    timestamp_str TEXT;
    first_name TEXT;
    last_name TEXT;
    phone TEXT;
BEGIN
    -- Generate unique customer identifiers
    timestamp_str := EXTRACT(EPOCH FROM NOW())::TEXT;
    customer_number := 'CUST-' || RIGHT(timestamp_str, 8);
    customer_code := 'C' || RIGHT(timestamp_str, 8);
    
    -- Extract user data from metadata
    first_name := COALESCE(
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
    );
    
    last_name := COALESCE(
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
    );
    
    phone := COALESCE(
        NEW.raw_user_meta_data->>'phone',
        NEW.user_metadata->>'phone',
        NEW.user_metadata->>'phone_number',
        NULL
    );
    
    -- Insert customer record
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
        NEW.id,
        customer_number,
        customer_code,
        first_name,
        last_name,
        NEW.email,
        phone,
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

-- Note: You cannot create a trigger on auth.users directly in Supabase SaaS
-- Instead, you need to use one of these approaches:
-- 1. Edge Function (recommended)
-- 2. Database webhook configured in Supabase dashboard
-- 3. Application-level customer creation

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.customers TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.webhook_create_customer() TO postgres, anon, authenticated, service_role;



