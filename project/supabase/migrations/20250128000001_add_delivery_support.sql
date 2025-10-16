-- ============================================================================
-- ADD DELIVERY SUPPORT TO ORDERS TABLE
-- ============================================================================
-- This migration adds delivery-related columns to the orders table to support
-- the "Delivery via Maxim" feature in the PWA checkout flow.

-- Step 1: Add delivery columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS delivery_address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_contact_number VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_landmark TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_tracking_number VARCHAR(100) DEFAULT NULL;

-- Step 2: Update order_type constraint to include 'delivery'
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS chk_order_type;

ALTER TABLE public.orders 
ADD CONSTRAINT chk_order_type CHECK (
  (order_type)::text = ANY (
    ARRAY[
      'pickup'::character varying,
      'delivery'::character varying
    ]::text[]
  )
);

-- Step 3: Add delivery status constraint
ALTER TABLE public.orders 
ADD CONSTRAINT chk_delivery_status CHECK (
  (delivery_status)::text = ANY (
    ARRAY[
      'pending'::character varying,
      'booked'::character varying,
      'in_transit'::character varying,
      'delivered'::character varying,
      'failed'::character varying
    ]::text[]
  )
);

-- Step 4: Add delivery method constraint
ALTER TABLE public.orders 
ADD CONSTRAINT chk_delivery_method CHECK (
  (delivery_method)::text = ANY (
    ARRAY[
      'maxim'::character varying,
      'other'::character varying
    ]::text[]
  )
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON public.orders(delivery_method);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_tracking ON public.orders(delivery_tracking_number);

-- Step 6: Update existing orders to have 'pickup' as default order_type
UPDATE public.orders 
SET order_type = 'pickup' 
WHERE order_type IS NULL;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.orders.delivery_method IS 'Delivery service provider (maxim, other)';
COMMENT ON COLUMN public.orders.delivery_status IS 'Current delivery status (pending, booked, in_transit, delivered, failed)';
COMMENT ON COLUMN public.orders.delivery_address IS 'Full delivery address for delivery orders';
COMMENT ON COLUMN public.orders.delivery_contact_number IS 'Contact number for delivery coordination';
COMMENT ON COLUMN public.orders.delivery_landmark IS 'Optional landmark for delivery location';
COMMENT ON COLUMN public.orders.delivery_fee IS 'Delivery fee (set by staff after booking)';
COMMENT ON COLUMN public.orders.delivery_tracking_number IS 'Tracking number from delivery service';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the migration was successful:

-- Check if columns were added
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- AND column_name LIKE 'delivery_%'
-- ORDER BY column_name;

-- Check constraints
-- SELECT constraint_name, constraint_type, check_clause 
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
-- WHERE tc.table_name = 'orders' 
-- AND tc.constraint_type = 'CHECK'
-- AND (cc.check_clause LIKE '%delivery%' OR cc.check_clause LIKE '%order_type%');

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'orders' 
-- AND indexname LIKE '%delivery%';
