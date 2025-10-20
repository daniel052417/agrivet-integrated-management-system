-- Enhanced Order Processing Schema
-- Add columns for comprehensive order management

-- Add columns to orders table for order processing
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES users(id),
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

-- Create order_status_history table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status character varying(20) NOT NULL,
    previous_status character varying(20),
    changed_by uuid REFERENCES users(id),
    changed_by_name character varying(100),
    notes text,
    metadata jsonb,
    created_at timestamptz DEFAULT NOW()
);

-- Add indexes for order_status_history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON order_status_history(changed_by);

-- Create inventory_reservations table for order inventory management
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    quantity_reserved numeric(10, 3) NOT NULL,
    quantity_released numeric(10, 3) DEFAULT 0,
    reserved_at timestamptz DEFAULT NOW(),
    released_at timestamptz,
    reserved_by uuid REFERENCES users(id),
    released_by uuid REFERENCES users(id),
    status character varying(20) DEFAULT 'active' CHECK (status IN ('active', 'released', 'fulfilled')),
    notes text
);

-- Add indexes for inventory_reservations
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order_id ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_id ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_branch_id ON inventory_reservations(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status ON inventory_reservations(status);

-- Create order_notifications table for customer communication
CREATE TABLE IF NOT EXISTS order_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    notification_type character varying(20) NOT NULL CHECK (notification_type IN ('confirmation', 'cancellation', 'ready', 'reminder')),
    sent_to character varying(255) NOT NULL, -- phone or email
    sent_via character varying(20) NOT NULL CHECK (sent_via IN ('sms', 'email', 'push')),
    message_content text NOT NULL,
    sent_at timestamptz DEFAULT NOW(),
    sent_by uuid REFERENCES users(id),
    status character varying(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    error_message text
);

-- Add indexes for order_notifications
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_sent_at ON order_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_order_notifications_type ON order_notifications(notification_type);

-- Add comments for documentation
COMMENT ON COLUMN orders.confirmed_by IS 'User who confirmed the order';
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

COMMENT ON TABLE order_status_history IS 'Audit trail for all order status changes';
COMMENT ON TABLE inventory_reservations IS 'Tracks inventory reservations for orders';
COMMENT ON TABLE order_notifications IS 'Log of all customer notifications sent';
