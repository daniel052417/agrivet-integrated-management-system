-- Fix order items RLS policies and ensure proper counting
-- This addresses the issue where orders show 0 items

-- 1. Check current RLS policies on order_items
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'order_items';

-- 2. Enable RLS on order_items if not already enabled
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies on order_items
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

-- 4. Create new RLS policies for order_items
CREATE POLICY "Users can view order items for their orders" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (
                (o.user_id IS NOT NULL AND o.user_id = auth.uid())
                OR
                (o.user_id IS NULL AND o.is_guest_order = true)
            )
        )
    );

CREATE POLICY "Users can insert order items" ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 5. Grant necessary permissions
GRANT SELECT ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO authenticated;

-- 6. Test if we can see order items for the specific order
SELECT 
    'Testing order items access' as test_type,
    oi.id,
    oi.order_id,
    oi.quantity,
    oi.product_name,
    oi.unit_name,
    oi.line_total
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.order_number = 'ORD-303504-IG81';

-- 7. Update the get_customer_orders function to ensure proper item counting
DROP FUNCTION IF EXISTS get_customer_orders(uuid, uuid, text, integer, integer);

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
            oi.order_id,
            COUNT(*) as item_count,
            SUM(oi.quantity) as total_quantity
        FROM public.order_items oi
        WHERE EXISTS (
            SELECT 1 FROM public.orders o2
            WHERE o2.id = oi.order_id
            AND (
                (o2.user_id IS NOT NULL AND o2.user_id = auth.uid())
                OR
                (o2.user_id IS NULL AND o2.is_guest_order = true)
            )
        )
        GROUP BY oi.order_id
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

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION get_customer_orders TO authenticated;

-- 9. Test the function
SELECT 
    'Testing updated function' as test_type,
    order_number,
    item_count,
    total_quantity,
    total_amount
FROM get_customer_orders(
    p_user_id := '50cda2bc-1f08-43c0-8a0f-611bb199204e'::uuid,
    p_branch_id := NULL,
    p_status := NULL,
    p_limit := 10,
    p_offset := 0
);

COMMENT ON FUNCTION get_customer_orders IS 'Updated function with proper RLS-aware item counting';
