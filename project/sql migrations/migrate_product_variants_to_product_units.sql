-- Migration: Replace product_variants with product_units
-- This migration updates the database schema to use product_units instead of product_variants

-- Step 1: Update inventory table to use product_id instead of product_variant_id
ALTER TABLE public.inventory 
DROP CONSTRAINT IF EXISTS inventory_product_variant_id_fkey;

ALTER TABLE public.inventory 
RENAME COLUMN product_variant_id TO product_id;

ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Step 2: Update order_items table to use product_unit_id instead of product_variant_id
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_product_variant_id_fkey;

ALTER TABLE public.order_items 
RENAME COLUMN product_variant_id TO product_unit_id;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_product_unit_id_fkey 
FOREIGN KEY (product_unit_id) REFERENCES product_units(id) ON DELETE SET NULL;

-- Step 3: Update any views that reference product_variants
-- Update pwa_product_catalog view if it exists
DROP VIEW IF EXISTS public.pwa_product_catalog;

CREATE VIEW public.pwa_product_catalog AS
SELECT 
    pu.id,
    pu.product_id,
    p.name,
    p.description,
    p.brand,
    p.barcode,
    p.is_active,
    p.created_at,
    p.updated_at,
    pu.unit_name,
    pu.unit_label,
    pu.conversion_factor,
    pu.is_base_unit,
    pu.is_sellable,
    pu.price_per_unit,
    pu.min_sellable_quantity,
    pu.sort_order,
    p.sku,
    p.category_id,
    p.supplier_id,
    c.name as category_name,
    s.name as supplier_name,
    i.quantity_available,
    i.quantity_on_hand,
    i.quantity_reserved
FROM product_units pu
JOIN products p ON pu.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN inventory i ON p.id = i.product_id
WHERE pu.is_sellable = true 
  AND p.is_active = true
  AND (i.quantity_available > 0 OR i.quantity_available IS NULL);

-- Step 4: Update RPC functions to use product_id instead of product_variant_id
-- Update reserve_inventory function
CREATE OR REPLACE FUNCTION public.reserve_inventory(
    p_branch_id UUID,
    p_product_id UUID,
    p_quantity NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.inventory
    SET
        quantity_reserved = quantity_reserved + p_quantity,
        quantity_available = quantity_on_hand - (quantity_reserved + p_quantity),
        updated_at = now()
    WHERE
        branch_id = p_branch_id AND product_id = p_product_id
        AND quantity_available >= p_quantity;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not enough available inventory or item not found for product_id % in branch % to reserve', p_product_id, p_branch_id;
    END IF;
END;
$$;

-- Update release_inventory function
CREATE OR REPLACE FUNCTION public.release_inventory(
    p_branch_id UUID,
    p_product_id UUID,
    p_quantity NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.inventory
    SET
        quantity_reserved = quantity_reserved - p_quantity,
        quantity_available = quantity_on_hand - (quantity_reserved - p_quantity),
        updated_at = now()
    WHERE
        branch_id = p_branch_id AND product_id = p_product_id
        AND quantity_reserved >= p_quantity;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not enough reserved inventory or item not found for product_id % in branch % to release', p_product_id, p_branch_id;
    END IF;
END;
$$;

-- Update deduct_inventory function
CREATE OR REPLACE FUNCTION public.deduct_inventory(
    p_branch_id UUID,
    p_product_id UUID,
    p_quantity NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.inventory
    SET
        quantity_on_hand = quantity_on_hand - p_quantity,
        quantity_reserved = quantity_reserved - p_quantity,
        quantity_available = quantity_on_hand - quantity_reserved,
        updated_at = now()
    WHERE
        branch_id = p_branch_id AND product_id = p_product_id
        AND quantity_available >= p_quantity;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not enough inventory or item not found for product_id % in branch %', p_product_id, p_branch_id;
    END IF;
END;
$$;

-- Step 5: Update indexes
-- Drop old indexes
DROP INDEX IF EXISTS idx_inventory_product_variant_id;
DROP INDEX IF EXISTS idx_order_items_product_variant_id;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_unit_id ON public.order_items USING btree (product_unit_id);

-- Step 6: Update RLS policies if they exist
-- Update inventory RLS policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.inventory;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.inventory;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.inventory;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.inventory;

-- Create new RLS policies for inventory
CREATE POLICY "Enable read access for all users" ON public.inventory
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.inventory
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.inventory
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.inventory
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 7: Create helper functions for product unit operations
CREATE OR REPLACE FUNCTION public.get_product_units_for_catalog(
    p_branch_id UUID
)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    name TEXT,
    description TEXT,
    brand TEXT,
    barcode TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    unit_name TEXT,
    unit_label TEXT,
    conversion_factor NUMERIC,
    is_base_unit BOOLEAN,
    is_sellable BOOLEAN,
    price_per_unit NUMERIC,
    min_sellable_quantity NUMERIC,
    sort_order INTEGER,
    sku TEXT,
    category_id UUID,
    supplier_id UUID,
    quantity_available NUMERIC,
    quantity_on_hand NUMERIC,
    quantity_reserved NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pu.id,
        pu.product_id,
        p.name,
        p.description,
        p.brand,
        p.barcode,
        p.is_active,
        p.created_at,
        p.updated_at,
        pu.unit_name,
        pu.unit_label,
        pu.conversion_factor,
        pu.is_base_unit,
        pu.is_sellable,
        pu.price_per_unit,
        pu.min_sellable_quantity,
        pu.sort_order,
        p.sku,
        p.category_id,
        p.supplier_id,
        i.quantity_available,
        i.quantity_on_hand,
        i.quantity_reserved
    FROM product_units pu
    JOIN products p ON pu.product_id = p.id
    LEFT JOIN inventory i ON p.id = i.product_id AND i.branch_id = p_branch_id
    WHERE pu.is_sellable = true 
      AND p.is_active = true
      AND (i.quantity_available > 0 OR i.quantity_available IS NULL)
    ORDER BY p.name, pu.sort_order;
END;
$$;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_product_units_for_catalog TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reserve_inventory TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.release_inventory TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.deduct_inventory TO authenticated, anon;

-- Step 9: Create a migration log entry
INSERT INTO public.migration_log (migration_name, applied_at, description)
VALUES (
    'migrate_product_variants_to_product_units',
    now(),
    'Migrated from product_variants to product_units schema. Updated inventory, order_items, and related functions.'
) ON CONFLICT DO NOTHING;

-- Step 10: Optional - Drop product_variants table if no longer needed
-- WARNING: Only run this if you're sure product_variants is no longer needed
-- DROP TABLE IF EXISTS public.product_variants CASCADE;

COMMENT ON TABLE public.product_units IS 'Product units with pricing and conversion factors. Replaces product_variants table.';
COMMENT ON COLUMN public.inventory.product_id IS 'References products.id instead of product_variants.id';
COMMENT ON COLUMN public.order_items.product_unit_id IS 'References product_units.id instead of product_variants.id';
