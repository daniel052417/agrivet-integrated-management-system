-- ============================================================================
-- FIX CUSTOMER AUTHENTICATION FLOW
-- ============================================================================
-- This migration fixes the customer table structure and creates proper triggers
-- for automatic customer creation when users sign up via Supabase Auth

-- ============================================================================
-- STEP 1: UPDATE CUSTOMERS TABLE STRUCTURE
-- ============================================================================

-- Add missing columns to customers table if they don't exist
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN user_id UUID;
    END IF;

    -- Add customer_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'customer_number' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN customer_number VARCHAR(20);
    END IF;

    -- Add is_guest column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'is_guest' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN is_guest BOOLEAN DEFAULT false;
    END IF;

    -- Add province column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'province' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN province VARCHAR(50);
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE BEFORE INSERT TRIGGER FUNCTIONS
-- ============================================================================

-- Function to generate customer number
CREATE OR REPLACE FUNCTION public.set_customer_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Only set if not already provided
    IF NEW.customer_number IS NULL THEN
        -- Get the next available customer number
        SELECT COALESCE(MAX(customer_number::INTEGER), 0) + 1 
        INTO next_number
        FROM public.customers
        WHERE customer_number ~ '^[0-9]+$'; -- Only numeric customer numbers
        
        -- Set the customer number
        NEW.customer_number := next_number::VARCHAR;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate customer code
CREATE OR REPLACE FUNCTION public.set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if not already provided
    IF NEW.customer_code IS NULL THEN
        -- Generate customer code based on customer number
        NEW.customer_code := 'CUST-' || LPAD(NEW.customer_number, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: CREATE BEFORE INSERT TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_customer_number_trigger ON public.customers;
DROP TRIGGER IF EXISTS set_customer_code_trigger ON public.customers;

-- Create BEFORE INSERT triggers
CREATE TRIGGER set_customer_number_trigger
    BEFORE INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_customer_number();

CREATE TRIGGER set_customer_code_trigger
    BEFORE INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_customer_code();

-- ============================================================================
-- STEP 4: CREATE AUTH USER TO CUSTOMER TRIGGER
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_customer();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create customer record if user doesn't exist in public.users (staff)
    -- and if this is a customer signup (not staff)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        -- Insert into customers table - let the BEFORE INSERT triggers handle
        -- customer_number and customer_code generation
        INSERT INTO public.customers (
            user_id,
            email,
            first_name,
            last_name,
            phone,
            address,
            city,
            province,
            customer_type,
            date_of_birth,
            is_active,
            is_guest
        ) VALUES (
            NEW.id,
            COALESCE(NEW.email, ''),
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'address',
            NEW.raw_user_meta_data->>'city',
            NEW.raw_user_meta_data->>'province',
            COALESCE(NEW.raw_user_meta_data->>'customer_type', 'individual'),
            (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
            true, -- is_active
            false -- is_guest
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE LOG 'Customer record created for user_id: %', NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating customer record: %', SQLERRM;
        -- Don't fail the auth signup if customer creation fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_customer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_customer();

-- ============================================================================
-- STEP 5: ADD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Add foreign key constraint for user_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_user_id_fkey' 
        AND table_name = 'customers' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraints
DO $$ 
BEGIN
    -- Add unique constraint for user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_user_id_unique' 
        AND table_name = 'customers' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_user_id_unique UNIQUE (user_id);
    END IF;

    -- Add unique constraint for customer_number if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_customer_number_unique' 
        AND table_name = 'customers' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_customer_number_unique UNIQUE (customer_number);
    END IF;

    -- Add unique constraint for customer_code if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_customer_code_unique' 
        AND table_name = 'customers' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_customer_code_unique UNIQUE (customer_code);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON public.customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_is_guest ON public.customers(is_guest);

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
DROP POLICY IF EXISTS "Staff can view all customers" ON public.customers;

-- Create RLS policies
CREATE POLICY "Customers can view own profile" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Customers can update own profile" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all customers" ON public.customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.staff_user_links sul ON u.id = sul.user_id
            WHERE u.id = auth.uid() AND sul.link_status = 'active'
        )
    );

-- ============================================================================
-- STEP 7: CREATE GUEST USER UPGRADE FUNCTION
-- ============================================================================

-- Function to upgrade guest user to full account
CREATE OR REPLACE FUNCTION public.upgrade_guest_to_customer(
    guest_user_id UUID,
    customer_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_customer_id UUID;
BEGIN
    -- Check if customer already exists
    SELECT id INTO existing_customer_id
    FROM public.customers
    WHERE user_id = guest_user_id;
    
    -- If customer exists, update it
    IF existing_customer_id IS NOT NULL THEN
        UPDATE public.customers SET
            first_name = COALESCE(customer_data->>'first_name', first_name),
            last_name = COALESCE(customer_data->>'last_name', last_name),
            email = COALESCE(customer_data->>'email', email),
            phone = COALESCE(customer_data->>'phone', phone),
            address = COALESCE(customer_data->>'address', address),
            city = COALESCE(customer_data->>'city', city),
            province = COALESCE(customer_data->>'province', province),
            date_of_birth = COALESCE((customer_data->>'date_of_birth')::DATE, date_of_birth),
            customer_type = COALESCE(customer_data->>'customer_type', customer_type),
            is_guest = false,
            updated_at = NOW()
        WHERE user_id = guest_user_id;
        
        RAISE LOG 'Guest customer upgraded for user_id: %', guest_user_id;
        RETURN true;
    ELSE
        -- Create new customer record
        INSERT INTO public.customers (
            user_id,
            email,
            first_name,
            last_name,
            phone,
            address,
            city,
            province,
            customer_type,
            date_of_birth,
            is_active,
            is_guest
        ) VALUES (
            guest_user_id,
            COALESCE(customer_data->>'email', ''),
            COALESCE(customer_data->>'first_name', ''),
            COALESCE(customer_data->>'last_name', ''),
            customer_data->>'phone',
            customer_data->>'address',
            customer_data->>'city',
            customer_data->>'province',
            COALESCE(customer_data->>'customer_type', 'individual'),
            (customer_data->>'date_of_birth')::DATE,
            true,
            false
        );
        
        RAISE LOG 'New customer created for guest user_id: %', guest_user_id;
        RETURN true;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error upgrading guest to customer: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: TEST THE IMPLEMENTATION
-- ============================================================================

-- Test the trigger by creating a test user (this will be cleaned up)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_customer_id UUID;
BEGIN
    -- Insert a test user into auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
    ) VALUES (
        test_user_id,
        'test-trigger@example.com',
        crypt('testpassword', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"first_name": "Test", "last_name": "User", "phone": "+1234567890"}'::jsonb
    );
    
    -- Check if customer was created
    SELECT id INTO test_customer_id
    FROM public.customers
    WHERE user_id = test_user_id;
    
    IF test_customer_id IS NOT NULL THEN
        RAISE LOG 'SUCCESS: Customer record created for test user';
    ELSE
        RAISE LOG 'FAILED: Customer record not created for test user';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.customers WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
END $$;

SELECT 'Customer authentication flow migration completed successfully' as status;
















