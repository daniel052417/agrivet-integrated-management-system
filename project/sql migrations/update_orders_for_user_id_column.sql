-- Update orders table and functions to use the new user_id column
-- This provides a direct link between orders and authenticated users

-- 1. Update the get_customer_orders function to use user_id instead of customer_id/email matching
DROP FUNCTION IF EXISTS get_customer_orders(uuid, text, uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION get_customer_orders(
    p_user_id uuid DEFAULT NULL,
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
    user_id uuid,
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
        o.user_id,
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
        (p_user_id IS NULL OR o.user_id = p_user_id)
        AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
        AND (p_status IS NULL OR o.status = p_status)
        AND (
            -- Allow access if user_id matches authenticated user
            (o.user_id IS NOT NULL AND o.user_id = auth.uid())
            OR
            -- Allow access for guest orders (no user_id)
            (o.user_id IS NULL AND o.is_guest_order = true)
        )
    ORDER BY o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 2. Update RLS policies to use user_id
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        -- Allow access if user_id matches authenticated user
        (user_id IS NOT NULL AND user_id = auth.uid())
        OR
        -- Allow access for guest orders (no user_id)
        (user_id IS NULL AND is_guest_order = true)
    );

CREATE POLICY "Authenticated users can insert orders" ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_customer_orders TO authenticated;

-- 4. Update existing orders to have the correct user_id
-- This will link the existing order to the correct user
UPDATE public.orders 
SET user_id = '50cda2bc-1f08-43c0-8a0f-611bb199204e'::uuid
WHERE customer_email = 'cursora.001@gmail.com'
AND user_id IS NULL;

-- 5. Test the function
SELECT 'Testing updated get_customer_orders function' as test_type;
SELECT * FROM get_customer_orders(
    p_user_id := '50cda2bc-1f08-43c0-8a0f-611bb199204e'::uuid,
    p_branch_id := NULL,
    p_status := NULL,
    p_limit := 10,
    p_offset := 0
);

COMMENT ON FUNCTION get_customer_orders IS 'Updated function to use user_id column for direct user-order linking';
