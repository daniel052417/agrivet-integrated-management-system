-- Fix customer order access to allow email-based matching
-- This addresses the issue where orders have different customer_id than auth.uid()
-- but the same email address

-- First, let's check what customer records exist for this user
-- This will help us understand the data mismatch

-- Check if there's a customer record for the authenticated user
SELECT 
    'Customer records for user_id: 50cda2bc-1f08-43c0-8a0f-611bb199204e' as check_type,
    id, 
    customer_number,
    first_name, 
    last_name, 
    email,
    user_id
FROM public.customers 
WHERE user_id = '50cda2bc-1f08-43c0-8a0f-611bb199204e';

-- Check if there's a customer record for the email
SELECT 
    'Customer records for email: cursora.001@gmail.com' as check_type,
    id, 
    customer_number,
    first_name, 
    last_name, 
    email,
    user_id
FROM public.customers 
WHERE email = 'cursora.001@gmail.com';

-- Check the order details
SELECT 
    'Order details' as check_type,
    id,
    order_number,
    customer_id,
    customer_email,
    customer_name,
    is_guest_order
FROM public.orders 
WHERE customer_email = 'cursora.001@gmail.com';

-- Update the customer record to link it to the correct user_id
-- This will fix the mismatch between customer_id and auth.uid()
UPDATE public.customers 
SET user_id = '50cda2bc-1f08-43c0-8a0f-611bb199204e'
WHERE email = 'cursora.001@gmail.com'
AND user_id IS NULL;

-- If no customer record exists for this email, create one
INSERT INTO public.customers (
    id,
    customer_number,
    first_name,
    last_name,
    email,
    phone,
    customer_type,
    is_active,
    user_id,
    created_at,
    updated_at
)
SELECT 
    '533122d6-26bb-44b3-ba7e-ac060342e9cf'::uuid,
    'CUST-' || EXTRACT(EPOCH FROM NOW())::bigint,
    'Cursor',
    'Dummy',
    'cursora.001@gmail.com',
    '09616633203',
    'regular',
    true,
    '50cda2bc-1f08-43c0-8a0f-611bb199204e'::uuid,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.customers 
    WHERE email = 'cursora.001@gmail.com'
);

-- Update the order to use the correct customer_id
UPDATE public.orders 
SET customer_id = '533122d6-26bb-44b3-ba7e-ac060342e9cf'
WHERE customer_email = 'cursora.001@gmail.com'
AND customer_id IS NULL;

-- Verify the fix
SELECT 
    'After fix - Customer record' as check_type,
    id, 
    customer_number,
    first_name, 
    last_name, 
    email,
    user_id
FROM public.customers 
WHERE email = 'cursora.001@gmail.com';

SELECT 
    'After fix - Order record' as check_type,
    id,
    order_number,
    customer_id,
    customer_email,
    customer_name,
    is_guest_order
FROM public.orders 
WHERE customer_email = 'cursora.001@gmail.com';
