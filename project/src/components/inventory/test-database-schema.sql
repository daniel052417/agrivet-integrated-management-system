-- Test database schema for image_url column
-- Run this in your Supabase SQL Editor to verify the column exists

-- Check if image_url column exists in product_variants table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
AND column_name = 'image_url';

-- If the above returns no results, add the column:
-- ALTER TABLE product_variants ADD COLUMN image_url TEXT;

-- Test the RPC function with a simple query
SELECT 
  pv.id,
  pv.name,
  pv.image_url,
  p.name as product_name
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE pv.image_url IS NOT NULL
LIMIT 5;

-- Check if the RPC function includes image_url
SELECT * FROM get_inventory_with_details() LIMIT 1;
