-- Create function to get inventory with all details
CREATE OR REPLACE FUNCTION get_inventory_with_details(branch_filter UUID DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  description TEXT,
  category_id UUID,
  variant_id UUID,
  variant_name TEXT,
  variant_type TEXT,
  variant_value TEXT,
  price NUMERIC(10,2),
  inventory_id UUID,
  branch_id UUID,
  quantity_on_hand NUMERIC(10,2),
  quantity_reserved NUMERIC(10,2),
  quantity_available NUMERIC(10,2),
  reorder_level NUMERIC(10,2),
  max_stock_level NUMERIC(10,2),
  branch_name TEXT,
  branch_code TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id           AS product_id,
    p.name         AS product_name,
    p.description,
    p.category_id,
    pv.id          AS variant_id,
    pv.name        AS variant_name,
    pv.variant_type,
    pv.variant_value,
    pv.price,
    i.id           AS inventory_id,
    i.branch_id,
    i.quantity_on_hand,
    i.quantity_reserved,
    i.quantity_available,
    i.reorder_level,
    i.max_stock_level,
    b.name         AS branch_name,
    b.code         AS branch_code
  FROM inventory i
  JOIN product_variants pv ON i.product_variant_id = pv.id
  JOIN products p ON pv.product_id = p.id
  JOIN branches b ON i.branch_id = b.id
  WHERE p.is_active = true 
    AND pv.is_active = true
    AND (branch_filter IS NULL OR i.branch_id = branch_filter)
  ORDER BY p.name, pv.name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_inventory_with_details(UUID) TO authenticated;
