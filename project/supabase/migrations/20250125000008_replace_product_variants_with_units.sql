-- Migration to replace product_variants with product_units
-- This migration handles the transition from product_variants to product_units table

-- First, create the new product_units table
CREATE TABLE IF NOT EXISTS public.product_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  unit_name character varying(50) NOT NULL,
  unit_label character varying(20) NOT NULL,
  conversion_factor numeric(10, 4) NOT NULL,
  is_base_unit boolean NULL DEFAULT false,
  is_sellable boolean NULL DEFAULT true,
  price_per_unit numeric(10, 2) NOT NULL,
  min_sellable_quantity numeric(10, 3) NULL DEFAULT 1,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT product_units_pkey PRIMARY KEY (id),
  CONSTRAINT product_units_product_id_unit_name_key UNIQUE (product_id, unit_name),
  CONSTRAINT unique_base_unit_per_product UNIQUE (product_id, is_base_unit) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT product_units_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for product_units
CREATE INDEX IF NOT EXISTS idx_product_units_product_id ON public.product_units USING btree (product_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_product_units_sellable ON public.product_units USING btree (product_id, is_sellable) TABLESPACE pg_default;

-- Update inventory table to reference product_units instead of product_variants
-- First, add the new column
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS product_unit_id uuid;

-- Add foreign key constraint for the new column
ALTER TABLE inventory ADD CONSTRAINT inventory_product_unit_id_fkey 
  FOREIGN KEY (product_unit_id) REFERENCES product_units (id) ON DELETE CASCADE;

-- Migrate data from product_variants to product_units
-- This assumes we want to create base units for each product
INSERT INTO product_units (
  product_id,
  unit_name,
  unit_label,
  conversion_factor,
  is_base_unit,
  is_sellable,
  price_per_unit,
  min_sellable_quantity,
  created_at
)
SELECT 
  pv.product_id,
  COALESCE(pv.name, 'Unit') as unit_name,
  COALESCE(pv.variant_type, 'pcs') as unit_label,
  1.0 as conversion_factor, -- Base unit has conversion factor of 1
  true as is_base_unit, -- Mark as base unit
  COALESCE(pv.is_active, true) as is_sellable,
  COALESCE(pv.price, 0) as price_per_unit,
  1 as min_sellable_quantity,
  COALESCE(pv.created_at, now()) as created_at
FROM product_variants pv
WHERE pv.is_active = true;

-- Update inventory table to use the new product_unit_id
UPDATE inventory 
SET product_unit_id = pu.id
FROM product_units pu
JOIN product_variants pv ON pu.product_id = pv.product_id
WHERE inventory.product_variant_id = pv.id
  AND pu.is_base_unit = true;

-- Verify the migration
-- Check if all inventory records have been updated
DO $$
DECLARE
  unmapped_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM inventory 
  WHERE product_unit_id IS NULL;
  
  IF unmapped_count > 0 THEN
    RAISE WARNING 'Found % inventory records without product_unit_id mapping', unmapped_count;
  ELSE
    RAISE NOTICE 'All inventory records successfully mapped to product_units';
  END IF;
END $$;

-- Drop the old foreign key constraint and column
-- Note: This should be done carefully in production
-- ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_product_variant_id_fkey;
-- ALTER TABLE inventory DROP COLUMN IF EXISTS product_variant_id;

-- Drop the product_variants table
-- Note: Uncomment this only after verifying the migration is successful
-- DROP TABLE IF EXISTS product_variants CASCADE;

-- Update the RPC function to use product_units
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











