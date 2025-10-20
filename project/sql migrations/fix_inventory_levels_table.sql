-- Fix inventory_levels table access and permissions
-- This migration ensures the inventory_levels table is properly created and accessible

-- Create inventory_levels table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.inventory_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    location_id uuid NOT NULL,
    quantity_on_hand integer DEFAULT 0 NOT NULL,
    reserved_quantity integer DEFAULT 0,
    reorder_point integer DEFAULT 0,
    max_stock_level integer,
    last_count_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    quantity_reserved integer DEFAULT 0,
    quantity_available integer GENERATED ALWAYS AS ((quantity_on_hand - quantity_reserved)) STORED,
    CONSTRAINT inventory_levels_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_levels_product_id_location_id_key UNIQUE (product_id, location_id),
    CONSTRAINT inventory_levels_quantity_on_hand_check CHECK ((quantity_on_hand >= 0)),
    CONSTRAINT inventory_levels_reserved_quantity_check CHECK ((reserved_quantity >= 0))
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_levels_location_id_fkey'
    ) THEN
        ALTER TABLE public.inventory_levels 
        ADD CONSTRAINT inventory_levels_location_id_fkey 
        FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_levels_product_id_fkey'
    ) THEN
        ALTER TABLE public.inventory_levels 
        ADD CONSTRAINT inventory_levels_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product_id ON public.inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_location_id ON public.inventory_levels(location_id);

-- Enable Row Level Security
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_levels
DROP POLICY IF EXISTS "Authenticated users can manage inventory levels" ON public.inventory_levels;
CREATE POLICY "Authenticated users can manage inventory levels" ON public.inventory_levels
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON TABLE public.inventory_levels TO authenticated;
GRANT ALL ON TABLE public.inventory_levels TO service_role;
GRANT ALL ON TABLE public.inventory_levels TO anon;

-- Add comments
COMMENT ON TABLE public.inventory_levels IS 'Current stock levels by location';
COMMENT ON COLUMN public.inventory_levels.quantity_available IS 'Computed column: quantity_on_hand - quantity_reserved';

-- Create update trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_inventory_levels_updated_at'
    ) THEN
        CREATE TRIGGER update_inventory_levels_updated_at
            BEFORE UPDATE ON public.inventory_levels
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
