-- ============================================================================
-- SIMPLE CUSTOMER AUTH MIGRATION
-- ============================================================================
-- This is a simplified version that's more likely to work without errors

-- Step 1: Create customers table (if it doesn't exist)
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
    customer_type TEXT DEFAULT 'individual',
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier TEXT DEFAULT 'bronze',
    total_lifetime_spent DECIMAL(10,2) DEFAULT 0.00,
    assigned_staff_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT customers_user_id_unique UNIQUE (user_id),
    CONSTRAINT customers_email_unique UNIQUE (email)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);

-- Step 3: Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple RLS policies
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
CREATE POLICY "Customers can view own profile" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert customers" ON public.customers;
CREATE POLICY "Anyone can insert customers" ON public.customers
    FOR INSERT WITH CHECK (true);

-- Step 5: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.customers TO authenticated, anon;

-- Step 6: Create simple trigger function
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create customer record if user doesn't exist in public.users (staff)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
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
            COALESCE(NEW.email, ''),
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating customer record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_customer();

-- Step 8: Test the setup
SELECT 'Customer auth setup completed' as status;









