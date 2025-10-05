-- Check if there are order items for the specific order
-- Run this to see what data exists

-- 1. Check the specific order
SELECT 
    'Order Details' as info_type,
    id,
    order_number,
    user_id,
    customer_id,
    customer_email,
    total_amount,
    created_at
FROM public.orders 
WHERE order_number = 'ORD-303504-IG81';

-- 2. Check order items for this order
SELECT 
    'Order Items' as info_type,
    id,
    order_id,
    product_id,
    product_unit_id,
    quantity,
    unit_price,
    line_total,
    product_name,
    unit_name,
    created_at
FROM public.order_items 
WHERE order_id = (
    SELECT id FROM public.orders WHERE order_number = 'ORD-303504-IG81'
);

-- 3. Check all order items (to see if any exist at all)
SELECT 
    'All Order Items' as info_type,
    COUNT(*) as total_count,
    MIN(created_at) as earliest_item,
    MAX(created_at) as latest_item
FROM public.order_items;

-- 4. Check all orders (to see if any exist at all)
SELECT 
    'All Orders' as info_type,
    COUNT(*) as total_count,
    MIN(created_at) as earliest_order,
    MAX(created_at) as latest_order
FROM public.orders;

-- 5. If no order items exist, let's create a test one
-- (Only run this if you want to create test data)
/*
INSERT INTO public.order_items (
    order_id,
    product_id,
    product_unit_id,
    quantity,
    unit_price,
    line_total,
    product_name,
    product_sku,
    unit_name,
    unit_label,
    base_unit_quantity
) VALUES (
    (SELECT id FROM public.orders WHERE order_number = 'ORD-303504-IG81'),
    'test-product-id',
    'test-unit-id',
    2.000,
    1450.00,
    2900.00,
    'Test Product',
    'TEST-001',
    'kg',
    'Kilogram',
    2.000
);
*/
