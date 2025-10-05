-- Ensure cash payment method exists
-- This script ensures that a cash payment method is available for the checkout system

-- Insert cash payment method if it doesn't exist
INSERT INTO payment_methods (
    id,
    name,
    type,
    description,
    is_active,
    requires_reference,
    processing_fee,
    min_amount,
    max_amount,
    icon_url,
    display_order,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Cash',
    'cash',
    'Pay with cash at pickup location',
    true,
    false,
    0.00,
    0.00,
    999999.99,
    null,
    1,
    now(),
    now()
) ON CONFLICT (type) WHERE type = 'cash' DO NOTHING;

-- Verify the cash payment method exists
SELECT 
    id,
    name,
    type,
    is_active,
    requires_reference,
    processing_fee
FROM payment_methods 
WHERE type = 'cash' 
AND is_active = true;

-- If you need to update an existing cash payment method
UPDATE payment_methods 
SET 
    name = 'Cash',
    description = 'Pay with cash at pickup location',
    is_active = true,
    requires_reference = false,
    processing_fee = 0.00,
    min_amount = 0.00,
    max_amount = 999999.99,
    display_order = 1,
    updated_at = now()
WHERE type = 'cash';
