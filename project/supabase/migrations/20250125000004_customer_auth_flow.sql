-- ============================================================================
-- CUSTOMER AUTHENTICATION FLOW
-- ============================================================================
-- This migration creates a separate public.customers table for customer
-- authentication flow where auth.users remains the single source of truth
-- and public.users is reserved for staff/employees only.

-- ============================================================================
-- CREATE PUBLIC.CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    date_of_birth DATE,
    customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_lifetime_spent DECIMAL(10,2) DEFAULT 0.00,
    assigned_staff_id UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT customers_user_id_unique UNIQUE (user_id),
    CONSTRAINT customers_email_unique UNIQUE (email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON public.customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_registration_date ON public.customers(registration_date);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON public.customers(total_spent);

-- ============================================================================
-- CREATE TRIGGER FUNCTION FOR CUSTOMERS
-- ============================================================================

-- Create a separate trigger function for customers
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Create customer record for all PWA users (since we can't set raw_app_meta_data from client)
    -- We'll check if they're not already in public.users (staff) to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        -- Insert into public.customers table
        INSERT INTO public.customers (
            user_id,
            email,
            first_name,
            last_name,
            phone,
            address,
            city,
            province,
            postal_code,
            date_of_birth,
            customer_type,
            registration_date,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'address',
            NEW.raw_user_meta_data->>'city',
            NEW.raw_user_meta_data->>'province',
            NEW.raw_user_meta_data->>'postal_code',
            (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
            COALESCE(NEW.raw_user_meta_data->>'customer_type', 'individual'),
            NOW(),
            true,
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Customer record created for user_id: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGER ON AUTH.USERS FOR CUSTOMERS
-- ============================================================================

-- Create a separate trigger for customers (don't interfere with existing users trigger)
CREATE TRIGGER on_auth_user_created_customer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_customer();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES (CUSTOMERS TABLE)
-- ============================================================================

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only view their own record
CREATE POLICY "Customers can view own profile" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Customers can update their own record
CREATE POLICY "Customers can update own profile" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Customers can insert their own record (for manual creation if needed)
CREATE POLICY "Customers can insert own profile" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Staff can view all customer records (for admin purposes)
CREATE POLICY "Staff can view all customers" ON public.customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.staff 
            JOIN public.staff_user_links ON staff.id = staff_user_links.staff_id 
            WHERE staff_user_links.user_id = auth.uid() 
            AND staff_user_links.link_status = 'active'
        )
    );

-- Policy: Staff can update customer records (for admin purposes)
CREATE POLICY "Staff can update customers" ON public.customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.staff 
            JOIN public.staff_user_links ON staff.id = staff_user_links.staff_id 
            WHERE staff_user_links.user_id = auth.uid() 
            AND staff_user_links.link_status = 'active'
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.customers TO authenticated;

-- Grant permissions to anonymous users for signup
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.customers TO anon;

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on customers table
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert a sample customer for testing (this will be created via auth flow in real usage)
-- This is just for reference - in production, customers will be created via the trigger
/*
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "customer"}'::jsonb,
    '{"first_name": "John", "last_name": "Doe", "phone": "+1234567890"}'::jsonb
);
*/
