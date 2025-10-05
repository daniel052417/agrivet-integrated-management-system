    -- Add order processing columns to existing orders table
    -- This is a minimal migration that only adds the essential columns

    -- Add columns to orders table for order processing
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
    ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS estimated_ready_time timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS cancellation_reason text,
    ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
    ADD COLUMN IF NOT EXISTS processing_started_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS ready_at timestamptz,
    ADD COLUMN IF NOT EXISTS ready_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS completed_at timestamptz,
    ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS internal_notes text;

    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_orders_confirmed_by ON orders(confirmed_by);
    CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by ON orders(cancelled_by);
    CREATE INDEX IF NOT EXISTS idx_orders_processing_started_by ON orders(processing_started_by);
    CREATE INDEX IF NOT EXISTS idx_orders_ready_by ON orders(ready_by);
    CREATE INDEX IF NOT EXISTS idx_orders_completed_by ON orders(completed_by);

    -- Add comments for documentation
    COMMENT ON COLUMN orders.confirmed_at IS 'Timestamp when order was confirmed';
    COMMENT ON COLUMN orders.confirmed_by IS 'User who confirmed the order';
    COMMENT ON COLUMN orders.estimated_ready_time IS 'Estimated time when order will be ready for pickup';
    COMMENT ON COLUMN orders.cancelled_at IS 'Timestamp when order was cancelled';
    COMMENT ON COLUMN orders.cancelled_by IS 'User who cancelled the order';
    COMMENT ON COLUMN orders.cancellation_reason IS 'Reason for order cancellation';
    COMMENT ON COLUMN orders.processing_started_at IS 'Timestamp when order processing started';
    COMMENT ON COLUMN orders.processing_started_by IS 'User who started processing the order';
    COMMENT ON COLUMN orders.ready_at IS 'Timestamp when order was marked ready';
    COMMENT ON COLUMN orders.ready_by IS 'User who marked order as ready';
    COMMENT ON COLUMN orders.completed_at IS 'Timestamp when order was completed';
    COMMENT ON COLUMN orders.completed_by IS 'User who completed the order';
    COMMENT ON COLUMN orders.internal_notes IS 'Internal notes for staff use';
