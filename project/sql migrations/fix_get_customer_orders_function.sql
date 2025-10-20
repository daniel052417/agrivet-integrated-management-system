-- Fix get_customer_orders function to remove non-existent column references
-- The function was trying to reference actual_ready_time which doesn't exist in the orders table

-- Drop and recreate the function with correct column references
DROP FUNCTION IF EXISTS get_customer_orders(uuid, text, uuid, text, integer, integer);

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
    is_guest_order boolean,
    customer_name character varying,
    customer_email character varying,
    customer_phone character varying,
    special_instructions text,
    notes text,
    confirmed_at timestamp without time zone,
    completed_at timestamp without time zone,
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
        CONCAT(b.address, ', ', b.city, ', ', b.province) as branch_address,
        b.phone as branch_phone,
        COALESCE(oi_counts.item_count, 0) as item_count,
        COALESCE(oi_counts.total_quantity, 0) as total_quantity
    FROM public.orders o
    LEFT JOIN public.branches b ON o.branch_id = b.id
    LEFT JOIN (
        SELECT 
            order_id,
            COUNT(*) as item_count,
            SUM(quantity) as total_quantity
        FROM public.order_items
        GROUP BY order_id
    ) oi_counts ON o.id = oi_counts.order_id
    WHERE 
        (p_customer_id IS NULL OR o.customer_id = p_customer_id)
        AND (p_customer_email IS NULL OR o.customer_email = p_customer_email)
        AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
        AND (p_status IS NULL OR o.status = p_status)
        AND (
            -- Allow access if customer_id matches authenticated user
            (o.customer_id IS NOT NULL AND o.customer_id = auth.uid())
            OR 
            -- Allow access if customer_email matches authenticated user's email
            (o.customer_email IS NOT NULL AND o.customer_email = auth.jwt() ->> 'email')
            OR
            -- Allow access for guest orders (no customer_id)
            (o.customer_id IS NULL AND o.is_guest_order = true)
        )
    ORDER BY o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_customer_orders TO authenticated;

-- Also fix the get_order_with_items function to ensure it works correctly
DROP FUNCTION IF EXISTS get_order_with_items(uuid);

CREATE OR REPLACE FUNCTION get_order_with_items(p_order_id uuid)
RETURNS TABLE (
    order_data jsonb,
    order_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record jsonb;
    items_record jsonb;
BEGIN
    -- Get order data
    SELECT to_jsonb(o.*) INTO order_record
    FROM public.orders o
    WHERE o.id = p_order_id
    AND (
        -- Allow access if customer_id matches authenticated user
        (o.customer_id IS NOT NULL AND o.customer_id = auth.uid())
        OR 
        -- Allow access if customer_email matches authenticated user's email
        (o.customer_email IS NOT NULL AND o.customer_email = auth.jwt() ->> 'email')
        OR
        -- Allow access for guest orders (no customer_id)
        (o.customer_id IS NULL AND o.is_guest_order = true)
    );
    
    -- Get order items
    SELECT jsonb_agg(to_jsonb(oi.*)) INTO items_record
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id;
    
    RETURN QUERY
    SELECT 
        COALESCE(order_record, '{}'::jsonb) as order_data,
        COALESCE(items_record, '[]'::jsonb) as order_items;
END;
$$;

GRANT EXECUTE ON FUNCTION get_order_with_items TO authenticated;

COMMENT ON FUNCTION get_customer_orders IS 'Fixed function to retrieve customer orders without non-existent column references';
COMMENT ON FUNCTION get_order_with_items IS 'Fixed function to get order with all items for order details modal';
