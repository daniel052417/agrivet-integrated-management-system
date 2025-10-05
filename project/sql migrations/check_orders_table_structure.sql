-- Check the actual structure of the orders table to fix type mismatches
-- Run this to see what the actual column types are

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the function exists and what it returns
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_customer_orders' 
AND routine_schema = 'public';
