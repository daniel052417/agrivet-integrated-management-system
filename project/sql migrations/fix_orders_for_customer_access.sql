-- Fix Orders Table for Customer Access and Orders.tsx Functionality
-- This script addresses the issues with the current orders table schema

-- 1. Make customer_id nullable to support guest orders
ALTER TABLE public.orders 
ALTER COLUMN customer_id DROP NOT NULL;

-- 2. Add missing fields that Orders.tsx expects
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS notes text;

-- 3. Update customer_name and customer_email to allow longer values
ALTER TABLE public.orders 
ALTER COLUMN customer_name TYPE character varying(200);

ALTER TABLE public.orders 
ALTER COLUMN customer_email TYPE character varying(255);

-- 4. Add missing constraint for order status (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_order_status' 
        AND conrelid = 'orders'::regclass
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT chk_order_status CHECK (
            status IN (
                'pending_confirmation',
                'confirmed', 
                'preparing',
                'ready_for_pickup',
                'completed',
                'cancelled',
                'abandoned'
            )
        );
    END IF;
END $$;

-- 5. Add missing constraint for payment status (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_payment_status' 
        AND conrelid = 'orders'::regclass
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT chk_payment_status CHECK (
            payment_status IN (
                'pending',
                'paid',
                'failed',
                'refunded'
            )
        );
    END IF;
END $$;

-- 6. Add missing constraint for order type (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_order_type' 
        AND conrelid = 'orders'::regclass
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT chk_order_type CHECK (
            order_type IN (
                'pickup',
                'delivery'
            )
        );
    END IF;
END $$;

-- 7. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_guest_branch_email ON public.orders (is_guest_order, branch_id, customer_email, created_at DESC);

-- 8. Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies for customer order access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view inventory reservations for their orders" ON public.inventory_reservations;
DROP POLICY IF EXISTS "Users can view order tracking for their orders" ON public.order_tracking;

-- Orders policies
CREATE POLICY "Customers can view their own orders" ON public.orders
    FOR SELECT USING (
        -- Registered customers can see their orders
        (customer_id IS NOT NULL AND customer_id = auth.uid()) OR
        -- Guest customers can see orders by email
        (is_guest_order = true AND customer_email = auth.jwt() ->> 'email') OR
        -- Allow anonymous access for demo purposes (remove in production)
        (auth.role() = 'anon')
    );

CREATE POLICY "Authenticated users can insert orders" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "System can update orders" ON public.orders
    FOR UPDATE USING (auth.role() = 'service_role');

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (
                (orders.customer_id IS NOT NULL AND orders.customer_id = auth.uid()) OR
                (orders.is_guest_order = true AND orders.customer_email = auth.jwt() ->> 'email') OR
                (auth.role() = 'anon')
            )
        )
    );

CREATE POLICY "System can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Inventory reservations policies
CREATE POLICY "Users can view inventory reservations for their orders" ON public.inventory_reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = inventory_reservations.order_id 
            AND (
                (orders.customer_id IS NOT NULL AND orders.customer_id = auth.uid()) OR
                (orders.is_guest_order = true AND orders.customer_email = auth.jwt() ->> 'email') OR
                (auth.role() = 'anon')
            )
        )
    );

CREATE POLICY "System can manage inventory reservations" ON public.inventory_reservations
    FOR ALL USING (auth.role() = 'service_role');

-- Order tracking policies
CREATE POLICY "Users can view order tracking for their orders" ON public.order_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_tracking.order_id 
            AND (
                (orders.customer_id IS NOT NULL AND orders.customer_id = auth.uid()) OR
                (orders.is_guest_order = true AND orders.customer_email = auth.jwt() ->> 'email') OR
                (auth.role() = 'anon')
            )
        )
    );

CREATE POLICY "System can manage order tracking" ON public.order_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- 10. Create helpful views for Orders.tsx

-- Customer orders view with all necessary data
CREATE OR REPLACE VIEW customer_orders_view AS
SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    o.branch_id,
    o.status,
    o.payment_status,
    o.subtotal,
    o.tax_amount,
    o.discount_amount,
    o.total_amount,
    o.payment_method,
    o.payment_reference,
    o.payment_notes,
    o.estimated_ready_time,
    o.actual_ready_time,
    o.is_guest_order,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.special_instructions,
    o.notes,
    o.confirmed_at,
    o.completed_at,
    o.confirmed_by,
    o.order_type,
    o.created_at,
    o.updated_at,
    b.name as branch_name,
    b.address as branch_address,
    b.phone as branch_phone,
    c.first_name,
    c.last_name,
    c.customer_number,
    c.customer_type,
    c.loyalty_tier,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity
FROM public.orders o
LEFT JOIN public.branches b ON o.branch_id = b.id
LEFT JOIN public.customers c ON o.customer_id = c.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, b.id, c.id;

-- Order details view with items
CREATE OR REPLACE VIEW order_details_view AS
SELECT 
    o.*,
    b.name as branch_name,
    b.address as branch_address,
    b.phone as branch_phone,
    b.email as branch_email,
    c.first_name,
    c.last_name,
    c.customer_number,
    c.customer_type,
    c.loyalty_tier,
    c.loyalty_points,
    c.total_spent,
    c.last_purchase_date
FROM public.orders o
LEFT JOIN public.branches b ON o.branch_id = b.id
LEFT JOIN public.customers c ON o.customer_id = c.id;

-- 11. Create function to get customer orders (for CustomerOrderService)
CREATE OR REPLACE FUNCTION get_customer_orders(
    p_customer_id uuid DEFAULT NULL,
    p_customer_email text DEFAULT NULL,
    p_branch_id uuid DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    order_number character varying,
    customer_id uuid,
    branch_id uuid,
    status character varying,
    payment_status character varying,
    subtotal numeric,
    tax_amount numeric,
    discount_amount numeric,
    total_amount numeric,
    payment_method character varying,
    payment_reference character varying,
    payment_notes text,
    estimated_ready_time timestamp without time zone,
    actual_ready_time timestamp without time zone,
    is_guest_order boolean,
    customer_name character varying,
    customer_email character varying,
    customer_phone character varying,
    special_instructions text,
    notes text,
    confirmed_at timestamp with time zone,
    completed_at timestamp with time zone,
    confirmed_by uuid,
    order_type character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    branch_name character varying,
    branch_address text,
    branch_phone character varying,
    item_count bigint,
    total_quantity numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cov.id,
        cov.order_number,
        cov.customer_id,
        cov.branch_id,
        cov.status,
        cov.payment_status,
        cov.subtotal,
        cov.tax_amount,
        cov.discount_amount,
        cov.total_amount,
        cov.payment_method,
        cov.payment_reference,
        cov.payment_notes,
        cov.estimated_ready_time,
        cov.actual_ready_time,
        cov.is_guest_order,
        cov.customer_name,
        cov.customer_email,
        cov.customer_phone,
        cov.special_instructions,
        cov.notes,
        cov.confirmed_at,
        cov.completed_at,
        cov.confirmed_by,
        cov.order_type,
        cov.created_at,
        cov.updated_at,
        cov.branch_name,
        cov.branch_address,
        cov.branch_phone,
        cov.item_count,
        cov.total_quantity
    FROM customer_orders_view cov
    WHERE 
        (p_customer_id IS NULL OR cov.customer_id = p_customer_id)
        AND (p_customer_email IS NULL OR cov.customer_email = p_customer_email)
        AND (p_branch_id IS NULL OR cov.branch_id = p_branch_id)
        AND (p_status IS NULL OR cov.status = p_status)
    ORDER BY cov.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 12. Grant necessary permissions
GRANT SELECT ON customer_orders_view TO authenticated;
GRANT SELECT ON order_details_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_orders TO authenticated;

-- 13. Create function to get order with items
CREATE OR REPLACE FUNCTION get_order_with_items(p_order_id uuid)
RETURNS TABLE (
    order_data jsonb,
    order_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record record;
    items_record record;
BEGIN
    -- Get order data
    SELECT to_jsonb(o.*) INTO order_record
    FROM public.orders o
    WHERE o.id = p_order_id;
    
    -- Get order items
    SELECT jsonb_agg(to_jsonb(oi.*)) INTO items_record
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id;
    
    RETURN QUERY
    SELECT 
        COALESCE(order_record.to_jsonb, '{}'::jsonb) as order_data,
        COALESCE(items_record.jsonb_agg, '[]'::jsonb) as order_items;
END;
$$;

GRANT EXECUTE ON FUNCTION get_order_with_items TO authenticated;

-- 14. Add some sample data for testing (optional)
-- Insert a sample branch if it doesn't exist
INSERT INTO public.branches (id, name, code, address, city, province, phone, email, is_active)
VALUES (
    '79ec90b9-d2a4-4d20-b971-53b8baf16f63',
    'Tiongson Agrivet Main Branch',
    'TAB001',
    '123 Main Street, Downtown',
    'Manila',
    'Metro Manila',
    '+63-2-1234-5678',
    'main@tiongsonagrivet.com',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert a sample customer if it doesn't exist
INSERT INTO public.customers (id, customer_number, first_name, last_name, email, phone, customer_type, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'CUST-001',
    'John',
    'Doe',
    'john.doe@example.com',
    '+63-912-345-6789',
    'regular',
    true
) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.orders IS 'Orders table with support for both registered and guest customers';
COMMENT ON VIEW customer_orders_view IS 'View for customer orders with aggregated data for Orders.tsx';
COMMENT ON FUNCTION get_customer_orders IS 'Function to retrieve customer orders with filtering for Orders.tsx';
COMMENT ON FUNCTION get_order_with_items IS 'Function to get order with all items for order details modal';
