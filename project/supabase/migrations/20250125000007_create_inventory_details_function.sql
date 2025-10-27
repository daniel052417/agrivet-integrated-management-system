-- Create function to get inventory with all details
CREATE OR REPLACE FUNCTION get_inventory_with_details(branch_filter UUID DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  description TEXT,
  category_id UUID,
  unit_id UUID,
  unit_name TEXT,
  unit_label TEXT,
  conversion_factor NUMERIC(10,4),
  is_base_unit BOOLEAN,
  is_sellable BOOLEAN,
  price_per_unit NUMERIC(10,2),
  min_sellable_quantity NUMERIC(10,3),
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
    pu.id          AS unit_id,
    pu.unit_name,
    pu.unit_label,
    pu.conversion_factor,
    pu.is_base_unit,
    pu.is_sellable,
    pu.price_per_unit,
    pu.min_sellable_quantity,
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
  JOIN product_units pu ON i.product_unit_id = pu.id
  JOIN products p ON pu.product_id = p.id
  JOIN branches b ON i.branch_id = b.id
  WHERE p.is_active = true 
    AND pu.is_sellable = true
    AND (branch_filter IS NULL OR i.branch_id = branch_filter)
  ORDER BY p.name, pu.unit_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_inventory_with_details(UUID) TO authenticated;
