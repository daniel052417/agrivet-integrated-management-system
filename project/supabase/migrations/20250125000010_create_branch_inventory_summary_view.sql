-- Enhanced inventory summary view for multi-branch agrivet business
-- This view provides comprehensive branch-level inventory analytics

CREATE OR REPLACE VIEW inventory_summary_by_branch AS
SELECT 
    b.id as branch_id,
    b.name as branch_name,
    b.code as branch_code,
    b.branch_type,
    b.is_active as branch_active,
    
    -- Product counts
    COUNT(DISTINCT i.product_id) as total_products,
    COUNT(DISTINCT CASE WHEN i.quantity_available <= 0 THEN i.product_id END) as out_of_stock_count,
    COUNT(DISTINCT CASE WHEN i.quantity_available > 0 AND i.quantity_available <= i.reorder_level 
          THEN i.product_id END) as low_stock_count,
    COUNT(DISTINCT CASE WHEN i.quantity_available > i.reorder_level THEN i.product_id END) as in_stock_count,
    
    -- Financial metrics
    COALESCE(SUM(i.quantity_available * p.cost), 0) as total_inventory_value,
    COALESCE(SUM(i.quantity_available * pu.price_per_unit), 0) as total_selling_value,
    COALESCE(SUM(i.quantity_available * (pu.price_per_unit - p.cost)), 0) as potential_profit,
    
    -- Stock levels
    COALESCE(SUM(i.quantity_on_hand), 0) as total_quantity_on_hand,
    COALESCE(SUM(i.quantity_reserved), 0) as total_quantity_reserved,
    COALESCE(SUM(i.quantity_available), 0) as total_quantity_available,
    
    -- Health metrics
    CASE 
        WHEN COUNT(DISTINCT i.product_id) = 0 THEN 0
        ELSE ROUND(
            (COUNT(DISTINCT CASE WHEN i.quantity_available > i.reorder_level THEN i.product_id END)::float / 
             COUNT(DISTINCT i.product_id)) * 100, 2
        )
    END as stock_health_score,
    
    -- Category breakdown
    json_agg(
        DISTINCT jsonb_build_object(
            'category_id', c.id,
            'category_name', c.name,
            'product_count', (SELECT COUNT(*) FROM inventory i2 
                             JOIN products p2 ON i2.product_id = p2.id 
                             WHERE i2.branch_id = b.id AND p2.category_id = c.id),
            'total_value', (SELECT COALESCE(SUM(i2.quantity_available * pu2.price_per_unit), 0) 
                           FROM inventory i2 
                           JOIN products p2 ON i2.product_id = p2.id 
                           JOIN product_units pu2 ON p2.id = pu2.product_id AND pu2.is_base_unit = true
                           WHERE i2.branch_id = b.id AND p2.category_id = c.id)
        )
    ) FILTER (WHERE c.id IS NOT NULL) as category_breakdown

FROM branches b
LEFT JOIN inventory i ON b.id = i.branch_id
LEFT JOIN products p ON i.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_units pu ON p.id = pu.product_id AND pu.is_base_unit = true
WHERE b.is_active = true AND (p.is_active = true OR p.id IS NULL)
GROUP BY b.id, b.name, b.code, b.branch_type, b.is_active
ORDER BY b.branch_type DESC, b.name;

-- Grant access to the view
GRANT SELECT ON inventory_summary_by_branch TO authenticated;

-- Create view for critical alerts across branches
CREATE OR REPLACE VIEW critical_inventory_alerts AS
SELECT 
    'out_of_stock' as alert_type,
    b.name as branch_name,
    b.id as branch_id,
    p.name as product_name,
    p.sku,
    c.name as category_name,
    i.quantity_available,
    i.reorder_level,
    pu.unit_label,
    'Critical - Immediate restock needed' as message,
    'red' as severity
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN branches b ON i.branch_id = b.id
JOIN categories c ON p.category_id = c.id
JOIN product_units pu ON p.id = pu.product_id AND pu.is_base_unit = true
WHERE i.quantity_available <= 0
  AND p.is_active = true
  AND b.is_active = true

UNION ALL

SELECT 
    'low_stock' as alert_type,
    b.name as branch_name,
    b.id as branch_id,
    p.name as product_name,
    p.sku,
    c.name as category_name,
    i.quantity_available,
    i.reorder_level,
    pu.unit_label,
    'Low Stock - Reorder within 7 days' as message,
    'orange' as severity
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN branches b ON i.branch_id = b.id
JOIN categories c ON p.category_id = c.id
JOIN product_units pu ON p.id = pu.product_id AND pu.is_base_unit = true
WHERE i.quantity_available > 0 
  AND i.quantity_available <= i.reorder_level
  AND p.is_active = true
  AND b.is_active = true;

-- Grant access to the alerts view
GRANT SELECT ON critical_inventory_alerts TO authenticated;

-- Create view for transfer recommendations
CREATE OR REPLACE VIEW transfer_recommendations AS
WITH branch_stock AS (
    SELECT 
        i.product_id,
        p.name as product_name,
        p.sku,
        c.name as category_name,
        b.id as branch_id,
        b.name as branch_name,
        i.quantity_available,
        i.reorder_level,
        pu.unit_label,
        pu.price_per_unit,
        (i.quantity_available - i.reorder_level) as excess_quantity,
        (i.reorder_level - i.quantity_available) as shortage_quantity
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN branches b ON i.branch_id = b.id
    JOIN categories c ON p.category_id = c.id
    JOIN product_units pu ON p.id = pu.product_id AND pu.is_base_unit = true
    WHERE p.is_active = true AND b.is_active = true
),
excess_stock AS (
    SELECT * FROM branch_stock WHERE excess_quantity > 0
),
shortage_stock AS (
    SELECT * FROM branch_stock WHERE shortage_quantity > 0
)
SELECT 
    e.product_id,
    e.product_name,
    e.sku,
    e.category_name,
    e.branch_id as from_branch_id,
    e.branch_name as from_branch_name,
    s.branch_id as to_branch_id,
    s.branch_name as to_branch_name,
    LEAST(e.excess_quantity, s.shortage_quantity) as recommended_transfer_quantity,
    e.unit_label,
    e.price_per_unit,
    (LEAST(e.excess_quantity, s.shortage_quantity) * e.price_per_unit) as transfer_value,
    'Transfer opportunity detected' as recommendation_type
FROM excess_stock e
JOIN shortage_stock s ON e.product_id = s.product_id
WHERE e.branch_id != s.branch_id
ORDER BY transfer_value DESC;

-- Grant access to the transfer recommendations view
GRANT SELECT ON transfer_recommendations TO authenticated;
