-- ============================================================================
-- CREATE ORDERS TABLE FOR PWA
-- ============================================================================
-- This migration creates the orders table that the PWA checkout system expects.
-- The original schema only had sales_orders, but the PWA code references 'orders'.

-- Step 1: Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL,
    order_type VARCHAR(20) DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery')),
    status VARCHAR(50) DEFAULT 'pending_confirmation',
    payment_status VARCHAR(50) DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    payment_notes TEXT,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    is_guest_order BOOLEAN DEFAULT false,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    special_instructions TEXT,
    notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Delivery fields (will be added by the delivery support migration)
    delivery_method VARCHAR(20) DEFAULT NULL,
    delivery_status VARCHAR(20) DEFAULT 'pending',
    delivery_address TEXT DEFAULT NULL,
    delivery_contact_number VARCHAR(20) DEFAULT NULL,
    delivery_landmark TEXT DEFAULT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT NULL,
    delivery_tracking_number VARCHAR(100) DEFAULT NULL,
    delivery_latitude DECIMAL(10,8) DEFAULT NULL,
    delivery_longitude DECIMAL(11,8) DEFAULT NULL
);

-- Step 2: Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_unit_id UUID,
    quantity INTEGER NOT NULL,
    base_unit_quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    product_name TEXT NOT NULL,
    product_sku VARCHAR(100),
    unit_name VARCHAR(50),
    unit_label VARCHAR(50),
    weight DECIMAL(10,3),
    expiry_date DATE,
    batch_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Step 4: Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for orders
-- Allow authenticated users to view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
    );

-- Allow anyone to insert orders (for guest checkout)
CREATE POLICY "Anyone can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own orders
CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
    );

-- Step 6: Create RLS policies for order_items
-- Allow users to view order items for their orders
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE customer_id IN (
                SELECT id FROM public.customers WHERE user_id = auth.uid()
            )
        )
    );

-- Allow anyone to insert order items (for order creation)
CREATE POLICY "Anyone can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.orders TO authenticated, anon;
GRANT ALL ON public.order_items TO authenticated, anon;

-- Step 8: Add comments for documentation
COMMENT ON TABLE public.orders IS 'PWA orders table for customer orders';
COMMENT ON TABLE public.order_items IS 'Items within each order';
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: pickup or delivery';
COMMENT ON COLUMN public.orders.status IS 'Order status: pending_confirmation, confirmed, preparing, ready, completed, cancelled';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN public.orders.is_guest_order IS 'Whether this is a guest order (no customer account)';




