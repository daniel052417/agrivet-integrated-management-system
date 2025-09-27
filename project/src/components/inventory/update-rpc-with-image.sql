-- Update the get_inventory_with_details RPC function to include image_url
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_inventory_with_details(branch_filter UUID DEFAULT NULL)
RETURNS TABLE (
  inventory_id UUID,
  branch_id UUID,
  quantity_on_hand NUMERIC,
  quantity_available NUMERIC,
  reorder_level NUMERIC,
  max_stock_level NUMERIC,
  product_id UUID,
  product_name VARCHAR,
  category_id UUID,
  description TEXT,
  variant_id UUID,
  variant_name VARCHAR,
  variant_sku VARCHAR,
  price NUMERIC,
  cost NUMERIC,
  image_url TEXT,
  variant_type VARCHAR,
  variant_value VARCHAR,
  branch_name VARCHAR,
  branch_code VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as inventory_id,
    i.branch_id,
    i.quantity_on_hand,
    i.quantity_available,
    i.reorder_level,
    i.max_stock_level,
    p.id as product_id,
    p.name as product_name,
    p.category_id,
    p.description,
    pv.id as variant_id,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.price,
    pv.cost,
    pv.image_url,
    pv.variant_type,
    pv.variant_value,
    b.name as branch_name,
    b.code as branch_code
  FROM inventory i
  JOIN product_variants pv ON i.product_variant_id = pv.id
  JOIN products p ON pv.product_id = p.id
  JOIN branches b ON i.branch_id = b.id
  WHERE 
    (branch_filter IS NULL OR i.branch_id = branch_filter)
    AND pv.is_active = true
    AND p.is_active = true
    AND b.is_active = true
  ORDER BY p.name, pv.name;
END;
$$;
