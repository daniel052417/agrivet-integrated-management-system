-- Create inventory_movements table to track all inventory transactions
-- This table tracks purchases, sales, adjustments, transfers, and other inventory movements

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  inventory_id UUID NULL,
  product_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  reference_number VARCHAR(100) NULL,
  reference_id UUID NULL,
  movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT inventory_movements_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE SET NULL,
  CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  
  CONSTRAINT inventory_movements_type_check CHECK (
    (movement_type)::text = ANY (
      (ARRAY[
        'purchase'::character varying,
        'sale'::character varying,
        'adjustment'::character varying,
        'transfer_in'::character varying,
        'transfer_out'::character varying,
        'return'::character varying,
        'damage'::character varying,
        'expired'::character varying,
        'count_adjustment'::character varying
      ])::text[]
    )
  )
) TABLESPACE pg_default;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id 
  ON public.inventory_movements USING btree (product_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch_id 
  ON public.inventory_movements USING btree (branch_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_date 
  ON public.inventory_movements USING btree (movement_date DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type 
  ON public.inventory_movements USING btree (movement_type) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference_number 
  ON public.inventory_movements USING btree (reference_number) TABLESPACE pg_default;

-- Composite index for common queries (product + date range)
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date 
  ON public.inventory_movements USING btree (product_id, movement_date DESC) TABLESPACE pg_default;

-- Composite index for branch + date range queries
CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch_date 
  ON public.inventory_movements USING btree (branch_id, movement_date DESC) TABLESPACE pg_default;

-- Comment on table
COMMENT ON TABLE public.inventory_movements IS 'Tracks all inventory movements including purchases, sales, adjustments, and transfers';
COMMENT ON COLUMN public.inventory_movements.movement_type IS 'Type of movement: purchase, sale, adjustment, transfer_in, transfer_out, return, damage, expired, count_adjustment';
COMMENT ON COLUMN public.inventory_movements.quantity IS 'Quantity change: positive for stock in, negative for stock out';
COMMENT ON COLUMN public.inventory_movements.reference_number IS 'Related transaction number (e.g., PO number, transaction number, adjustment ID)';
COMMENT ON COLUMN public.inventory_movements.reference_id IS 'Foreign key to related transaction (e.g., purchase_order_id, pos_transaction_id)';









