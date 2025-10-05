-- Debug order items for the specific order
-- This will help us understand why the order shows 0 items

-- 1. Check if there are order items for this order
SELECT 
    'Order Items for ORD-303504-IG81' as check_type,
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.product_unit_id,
    oi.quantity,
    oi.unit_price,
    oi.line_total,
    oi.product_name,
    oi.unit_name,
    oi.created_at
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.order_number = 'ORD-303504-IG81';

-- 2. Check the order details
SELECT 
    'Order Details' as check_type,
    id,
    order_number,
    user_id,
    customer_id,
    customer_email,
    total_amount,
    created_at
FROM public.orders 
WHERE order_number = 'ORD-303504-IG81';

-- 3. Test the item count query that the function uses
SELECT 
    'Item Count Test' as check_type,
    oi.order_id,
    COUNT(*) as item_count,
    SUM(oi.quantity) as total_quantity
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.order_number = 'ORD-303504-IG81'
GROUP BY oi.order_id;

-- 4. Check if there are any order items at all
SELECT 
    'All Order Items Count' as check_type,
    COUNT(*) as total_order_items
FROM public.order_items;

-- 5. Check if there are any orders at all
SELECT 
    'All Orders Count' as check_type,
    COUNT(*) as total_orders
FROM public.orders;

-- 6. Test the get_customer_orders function directly
SELECT 
    'Function Test' as check_type,
    *
FROM get_customer_orders(
    p_user_id := '50cda2bc-1f08-43c0-8a0f-611bb199204e'::uuid,
    p_branch_id := NULL,
    p_status := NULL,
    p_limit := 10,
    p_offset := 0
);
