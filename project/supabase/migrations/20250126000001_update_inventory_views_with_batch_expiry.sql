-- Update inventory views to include batch_no and expiration_date from inventory table
-- These fields were moved from products table to inventory table

-- Update inventory_with_units view to include batch and expiry from inventory
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
    i.batch_no,
    i.expiration_date,
    
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
    base_pu.min_sellable_quantity,
    
    -- Calculate inventory value
    COALESCE(i.quantity_available * base_pu.price_per_unit, 0) as inventory_value,
    
    -- Timestamps
    i.updated_at as last_updated,
    i.last_counted,
    p.created_at as product_created_at,
    p.updated_at,
    p.description,
    p.supplier_id,
    s.name as supplier_name,
    
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
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN product_units pu ON p.id = pu.product_id AND pu.is_sellable = true
LEFT JOIN product_units base_pu ON p.id = base_pu.product_id AND base_pu.is_base_unit = true
WHERE p.is_active = true
GROUP BY 
    p.id, p.sku, p.name, p.image_url, p.cost, p.is_active, p.barcode, p.brand, p.description, p.supplier_id, p.created_at, p.updated_at,
    c.name, c.id, 
    b.name, b.id, b.code,
    i.id, i.quantity_on_hand, i.quantity_available, i.quantity_reserved, i.reorder_level, i.max_stock_level, i.batch_no, i.expiration_date,
    base_pu.id, base_pu.unit_name, base_pu.unit_label, base_pu.price_per_unit, base_pu.conversion_factor, base_pu.is_base_unit, base_pu.min_sellable_quantity,
    i.updated_at, i.last_counted,
    s.name;

-- Update inventory_management_view to include batch and expiry fields
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
    batch_no,
    expiration_date,
    stock_status,
    primary_unit_id,
    unit_name,
    unit_label,
    price_per_unit,
    conversion_factor,
    is_base_unit,
    base_unit,
    min_sellable_quantity,
    inventory_value,
    last_updated,
    last_counted,
    product_created_at,
    updated_at,
    description,
    supplier_id,
    supplier_name,
    units
FROM inventory_with_units;

-- Create/Update the aggregated inventory_management view (one row per product)
-- This view aggregates inventory data across all branches
CREATE OR REPLACE VIEW inventory_management AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.barcode,
    p.category_id,
    c.name AS category_name,
    p.unit_of_measure,
    COALESCE((
        SELECT pu.price_per_unit
        FROM product_units pu
        WHERE pu.product_id = p.id AND pu.is_base_unit = true
        LIMIT 1
    ), p.cost, 0::numeric) AS price_per_unit,
    p.cost,
    COALESCE(AVG(i.reorder_level), 0::numeric) AS reorder_level,
    COALESCE(SUM(i.quantity_on_hand), 0::numeric) AS quantity_on_hand,
    COALESCE(SUM(i.quantity_reserved), 0::numeric) AS quantity_reserved,
    COALESCE(SUM(i.quantity_available), 0::numeric) AS quantity_available,
    COALESCE(SUM(i.quantity_available), 0::numeric) AS stock_quantity,
    COALESCE(SUM(i.quantity_on_hand), 0::numeric) AS quantity_in_base_unit,
    COALESCE(
        SUM(i.quantity_available) * COALESCE((
            SELECT AVG(pu.price_per_unit / NULLIF(pu.conversion_factor, 0::numeric)) AS avg
            FROM product_units pu
            WHERE pu.product_id = p.id AND pu.is_sellable = true
        ), p.cost, 0::numeric), 
        0::numeric
    ) AS total_value,
    COALESCE(SUM(i.quantity_available * p.cost), 0::numeric) AS total_cost,
    CASE
        WHEN COALESCE(SUM(i.quantity_available), 0::numeric) = 0::numeric THEN 'out_of_stock'::text
        WHEN COALESCE(SUM(i.quantity_available), 0::numeric) <= COALESCE(AVG(i.reorder_level), 0::numeric) THEN 'low_stock'::text
        WHEN COALESCE(SUM(i.quantity_on_hand), 0::numeric) >= COALESCE(AVG(i.max_stock_level), 0::numeric) 
            AND COALESCE(AVG(i.max_stock_level), 0::numeric) > 0::numeric THEN 'overstock'::text
        ELSE 'in_stock'::text
    END AS stock_status,
    p.is_active,
    -- Get earliest expiration_date from inventory (most urgent)
    MIN(i.expiration_date) AS expiration_date,
    p.supplier_id,
    s.name AS supplier_name,
    p.brand,
    p.description,
    p.image_url,
    -- Get batch_no from inventory (first non-null batch_no)
    (SELECT i2.batch_no FROM inventory i2 WHERE i2.product_id = p.id AND i2.batch_no IS NOT NULL LIMIT 1) AS batch_no,
    (SELECT COUNT(*) FROM product_units pu WHERE pu.product_id = p.id AND pu.is_sellable = true) AS sellable_unit_count,
    COUNT(DISTINCT i.branch_id) AS branch_count,
    COALESCE(AVG(i.max_stock_level), 0::numeric) AS max_stock_level,
    p.created_at,
    p.updated_at,
    MAX(i.last_counted) AS last_counted,
    MAX(i.updated_at) AS last_inventory_update,
    -- Include inventory_id for editing (first inventory record)
    MIN(i.id) AS inventory_id,
    -- Include branch_id for editing (first branch)
    MIN(i.branch_id) AS branch_id,
    -- Include branch_name for display
    (SELECT b.name FROM branches b INNER JOIN inventory i3 ON b.id = i3.branch_id WHERE i3.product_id = p.id LIMIT 1) AS branch_name,
    -- Include primary unit information
    (SELECT pu.id FROM product_units pu WHERE pu.product_id = p.id AND pu.is_base_unit = true LIMIT 1) AS primary_unit_id,
    (SELECT pu.unit_name FROM product_units pu WHERE pu.product_id = p.id AND pu.is_base_unit = true LIMIT 1) AS unit_name,
    (SELECT pu.unit_label FROM product_units pu WHERE pu.product_id = p.id AND pu.is_base_unit = true LIMIT 1) AS unit_label,
    (SELECT pu.conversion_factor FROM product_units pu WHERE pu.product_id = p.id AND pu.is_base_unit = true LIMIT 1) AS conversion_factor,
    (SELECT pu.min_sellable_quantity FROM product_units pu WHERE pu.product_id = p.id AND pu.is_base_unit = true LIMIT 1) AS min_sellable_quantity
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
GROUP BY 
    p.id, p.name, p.sku, p.barcode, p.category_id, c.name, p.unit_of_measure, p.cost, 
    p.is_active, p.supplier_id, s.name, p.brand, p.description, p.image_url, 
    p.created_at, p.updated_at;

-- Grant access to the views
GRANT SELECT ON inventory_management TO authenticated;
GRANT SELECT ON inventory_management_view TO authenticated;
GRANT SELECT ON inventory_with_units TO authenticated;


