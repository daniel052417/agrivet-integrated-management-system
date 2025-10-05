-- Fix Order Creation Issues
-- This script addresses the 409 conflict, RLS policy, and audit log issues

-- 1. Fix audit_logs table to allow NULL user_id for customer creation
ALTER TABLE audit_logs 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Update audit_logs foreign key constraint to allow NULL
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE SET NULL;

-- 3. Fix customers table to handle existing users properly
-- Update the customers table to use ON CONFLICT for email
-- First, let's check if we need to update the unique constraint

-- 4. Create a function to handle customer creation with conflict resolution
CREATE OR REPLACE FUNCTION create_or_get_customer(
    p_first_name varchar(100),
    p_last_name varchar(100),
    p_email varchar(255),
    p_phone varchar(20),
    p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_id uuid;
BEGIN
    -- Try to find existing customer by email
    SELECT id INTO customer_id
    FROM customers
    WHERE email = p_email;
    
    -- If customer exists, return the ID
    IF customer_id IS NOT NULL THEN
        RETURN customer_id;
    END IF;
    
    -- If not found, create new customer
    INSERT INTO customers (
        first_name,
        last_name,
        email,
        phone,
        user_id,
        customer_type,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        p_user_id,
        'regular',
        true,
        now(),
        now()
    ) RETURNING id INTO customer_id;
    
    RETURN customer_id;
END;
$$;

-- 5. Fix RLS policies for orders table
-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "System can update orders" ON public.orders;

-- Create new policies that work with authenticated users
CREATE POLICY "Authenticated users can insert orders" ON public.orders
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        (
            -- User can create orders for themselves
            customer_id = auth.uid() OR
            -- User can create guest orders
            (customer_id IS NULL AND is_guest_order = true)
        )
    );

CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (
        -- User can see their own orders
        customer_id = auth.uid() OR
        -- User can see guest orders by email
        (is_guest_order = true AND customer_email = auth.jwt() ->> 'email') OR
        -- Allow anonymous access for demo
        auth.role() = 'anon'
    );

CREATE POLICY "System can update orders" ON public.orders
    FOR UPDATE USING (auth.role() = 'service_role');

-- 6. Fix RLS policies for customers table
DROP POLICY IF EXISTS "Public can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;

CREATE POLICY "Users can view their own customer record" ON public.customers
    FOR SELECT USING (
        user_id = auth.uid() OR
        email = auth.jwt() ->> 'email' OR
        auth.role() = 'anon'
    );

CREATE POLICY "Authenticated users can insert customers" ON public.customers
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        (
            user_id = auth.uid() OR
            user_id IS NULL
        )
    );

-- 7. Create a function to get or create customer for authenticated user
CREATE OR REPLACE FUNCTION get_or_create_customer_for_user(
    p_user_id uuid,
    p_email varchar(255),
    p_first_name varchar(100) DEFAULT NULL,
    p_last_name varchar(100) DEFAULT NULL,
    p_phone varchar(20) DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_id uuid;
BEGIN
    -- First try to find by user_id
    SELECT id INTO customer_id
    FROM customers
    WHERE user_id = p_user_id;
    
    IF customer_id IS NOT NULL THEN
        RETURN customer_id;
    END IF;
    
    -- If not found by user_id, try by email
    SELECT id INTO customer_id
    FROM customers
    WHERE email = p_email;
    
    IF customer_id IS NOT NULL THEN
        -- Update the customer record to link with user_id
        UPDATE customers
        SET user_id = p_user_id,
            updated_at = now()
        WHERE id = customer_id;
        RETURN customer_id;
    END IF;
    
    -- If still not found, create new customer
    INSERT INTO customers (
        first_name,
        last_name,
        email,
        phone,
        user_id,
        customer_type,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        COALESCE(p_first_name, 'User'),
        COALESCE(p_last_name, 'Customer'),
        p_email,
        p_phone,
        p_user_id,
        'regular',
        true,
        now(),
        now()
    ) RETURNING id INTO customer_id;
    
    RETURN customer_id;
END;
$$;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_or_get_customer TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_customer_for_user TO authenticated;

-- 9. Create a function to handle order creation with proper customer linking
CREATE OR REPLACE FUNCTION create_order_with_customer(
    p_order_data jsonb,
    p_customer_info jsonb DEFAULT NULL,
    p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record jsonb;
    customer_id uuid;
    final_customer_id uuid;
BEGIN
    -- Handle customer creation/linking
    IF p_user_id IS NOT NULL THEN
        -- For authenticated users, get or create customer
        SELECT get_or_create_customer_for_user(
            p_user_id,
            p_customer_info ->> 'email',
            p_customer_info ->> 'firstName',
            p_customer_info ->> 'lastName',
            p_customer_info ->> 'phone'
        ) INTO customer_id;
    ELSIF p_customer_info IS NOT NULL THEN
        -- For guest users, create customer record
        SELECT create_or_get_customer(
            p_customer_info ->> 'firstName',
            p_customer_info ->> 'lastName',
            p_customer_info ->> 'email',
            p_customer_info ->> 'phone'
        ) INTO customer_id;
    ELSE
        customer_id := NULL;
    END IF;
    
    -- Update order data with customer_id
    p_order_data := jsonb_set(p_order_data, '{customer_id}', to_jsonb(customer_id));
    
    -- Create the order
    INSERT INTO orders (
        order_number,
        customer_id,
        branch_id,
        order_type,
        status,
        payment_status,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        payment_reference,
        payment_notes,
        estimated_ready_time,
        is_guest_order,
        customer_name,
        customer_email,
        customer_phone,
        special_instructions,
        notes,
        confirmed_at,
        completed_at,
        created_at,
        updated_at
    ) VALUES (
        p_order_data ->> 'order_number',
        (p_order_data ->> 'customer_id')::uuid,
        (p_order_data ->> 'branch_id')::uuid,
        p_order_data ->> 'order_type',
        p_order_data ->> 'status',
        p_order_data ->> 'payment_status',
        (p_order_data ->> 'subtotal')::numeric,
        (p_order_data ->> 'tax_amount')::numeric,
        (p_order_data ->> 'discount_amount')::numeric,
        (p_order_data ->> 'total_amount')::numeric,
        p_order_data ->> 'payment_method',
        p_order_data ->> 'payment_reference',
        p_order_data ->> 'payment_notes',
        (p_order_data ->> 'estimated_ready_time')::timestamp,
        (p_order_data ->> 'is_guest_order')::boolean,
        p_order_data ->> 'customer_name',
        p_order_data ->> 'customer_email',
        p_order_data ->> 'customer_phone',
        p_order_data ->> 'special_instructions',
        p_order_data ->> 'notes',
        (p_order_data ->> 'confirmed_at')::timestamp,
        (p_order_data ->> 'completed_at')::timestamp,
        now(),
        now()
    ) RETURNING to_jsonb(orders.*) INTO order_record;
    
    RETURN order_record;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_with_customer TO authenticated;

-- 10. Add some debugging information
COMMENT ON FUNCTION create_or_get_customer IS 'Creates or gets customer with conflict resolution for email';
COMMENT ON FUNCTION get_or_create_customer_for_user IS 'Gets or creates customer for authenticated user';
COMMENT ON FUNCTION create_order_with_customer IS 'Creates order with proper customer linking';

-- 11. Test data cleanup (optional - remove in production)
-- This will help with testing by cleaning up any duplicate customers
DO $$
BEGIN
    -- Remove duplicate customers by email, keeping the one with user_id
    DELETE FROM customers c1
    USING customers c2
    WHERE c1.email = c2.email
    AND c1.id > c2.id
    AND c1.user_id IS NULL
    AND c2.user_id IS NOT NULL;
    
    -- Remove duplicate customers by email, keeping the most recent
    DELETE FROM customers c1
    USING customers c2
    WHERE c1.email = c2.email
    AND c1.id > c2.id
    AND c1.user_id IS NULL
    AND c2.user_id IS NULL;
END $$;
