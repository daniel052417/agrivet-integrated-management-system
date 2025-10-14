-- Create multi-unit support view for inventory management
-- This view provides comprehensive inventory data with unit information

CREATE OR REPLACE VIEW inventory_with_units AS
SELECT 
    p.id as product_id,
    p.sku,
    p.name as product_name,
    p.image_url,
    p.cost,
    p.is_active,
    p.barcode,
    p.brand,
    
    c.name as category_name,
    c.id as category_id,
    
    b.name as branch_name,
    b.id as branch_id,
    b.code as branch_code,
    
    i.id as inventory_id,
    i.quantity_on_hand,
    i.quantity_available,
    i.quantity_reserved,
    i.reorder_level,
    i.max_stock_level,
    
    CASE 
        WHEN i.quantity_available <= 0 THEN 'Out of Stock'
        WHEN i.quantity_available <= i.reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    
    -- Base unit information (primary unit for display)
    base_pu.id as primary_unit_id,
    base_pu.unit_name,
    base_pu.unit_label,
    base_pu.price_per_unit,
    base_pu.conversion_factor,
    base_pu.is_base_unit,
    base_pu.unit_name as base_unit,
    
    -- Calculate inventory value
    COALESCE(i.quantity_available * base_pu.price_per_unit, 0) as inventory_value,
    
    -- Timestamps
    i.updated_at as last_updated,
    i.last_counted,
    p.created_at as product_created_at,
    
    -- Aggregate all units for this product
    json_agg(
        json_build_object(
            'unit_id', pu.id,
            'unit_name', pu.unit_name,
            'unit_label', pu.unit_label,
            'price', pu.price_per_unit,
            'conversion_factor', pu.conversion_factor,
            'is_base_unit', pu.is_base_unit,
            'is_sellable', pu.is_sellable,
            'quantity_in_unit', FLOOR(i.quantity_available / NULLIF(pu.conversion_factor, 0))
        ) 
        ORDER BY pu.conversion_factor DESC
    ) FILTER (WHERE pu.id IS NOT NULL) as units
    
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN branches b ON i.branch_id = b.id
LEFT JOIN product_units pu ON p.id = pu.product_id AND pu.is_sellable = true
LEFT JOIN product_units base_pu ON p.id = base_pu.product_id AND base_pu.is_base_unit = true
WHERE p.is_active = true
GROUP BY 
    p.id, p.sku, p.name, p.image_url, p.cost, p.is_active, p.barcode, p.brand,
    c.name, c.id, b.name, b.id, b.code,
    i.id, i.quantity_on_hand, i.quantity_available, i.quantity_reserved, i.reorder_level, i.max_stock_level,
    base_pu.id, base_pu.unit_name, base_pu.unit_label, base_pu.price_per_unit, base_pu.conversion_factor, base_pu.is_base_unit,
    i.updated_at, i.last_counted, p.created_at;

-- Grant access to the view
GRANT SELECT ON inventory_with_units TO authenticated;

-- Create performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_inventory_branch_product 
ON inventory(branch_id, product_id);

CREATE INDEX IF NOT EXISTS idx_product_units_base 
ON product_units(product_id, is_base_unit) 
WHERE is_base_unit = true;

CREATE INDEX IF NOT EXISTS idx_product_units_sellable 
ON product_units(product_id, is_sellable) 
WHERE is_sellable = true;

CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products(category_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_inventory_quantity_status 
ON inventory(quantity_available, reorder_level);

-- Create a simplified view for basic inventory management
CREATE OR REPLACE VIEW inventory_management_view AS
SELECT 
    product_id,
    sku,
    product_name,
    image_url,
    cost,
    is_active,
    barcode,
    brand,
    category_id,
    category_name,
    branch_id,
    branch_name,
    branch_code,
    inventory_id,
    quantity_on_hand,
    quantity_available,
    quantity_reserved,
    reorder_level,
    max_stock_level,
    stock_status,
    primary_unit_id,
    unit_name,
    unit_label,
    price_per_unit,
    conversion_factor,
    is_base_unit,
    base_unit,
    inventory_value,
    last_updated,
    last_counted,
    product_created_at
FROM inventory_with_units;

-- Grant access to the simplified view
GRANT SELECT ON inventory_management_view TO authenticated;




