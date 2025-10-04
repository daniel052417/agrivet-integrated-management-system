-- Complete Checkout System Migration
-- This migration adds all missing tables and columns for the enhanced checkout system

-- ==============================================
-- 1. UPDATE EXISTING TABLES WITH MISSING COLUMNS
-- ==============================================

-- Update orders table with missing columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_reference CHARACTER VARYING(100),
ADD COLUMN IF NOT EXISTS payment_notes TEXT,
ADD COLUMN IF NOT EXISTS estimated_ready_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_guest_order BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS customer_name CHARACTER VARYING(100),
ADD COLUMN IF NOT EXISTS customer_email CHARACTER VARYING(100),
ADD COLUMN IF NOT EXISTS customer_phone CHARACTER VARYING(20),
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update order_items table with missing columns
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS base_unit_quantity NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS product_name CHARACTER VARYING(255),
ADD COLUMN IF NOT EXISTS product_sku CHARACTER VARYING(100),
ADD COLUMN IF NOT EXISTS unit_name CHARACTER VARYING(50),
ADD COLUMN IF NOT EXISTS unit_label CHARACTER VARYING(20),
ADD COLUMN IF NOT EXISTS weight NUMERIC(8, 2),
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS batch_number CHARACTER VARYING(100),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update inventory table to use product_id instead of product_variant_id
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS product_id UUID,
ADD COLUMN IF NOT EXISTS base_unit CHARACTER VARYING(20) DEFAULT 'piece';

-- ==============================================
-- 2. CREATE MISSING TABLES
-- ==============================================

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING(50) NOT NULL,
  type CHARACTER VARYING(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requires_reference BOOLEAN DEFAULT false,
  processing_fee NUMERIC(5, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_name_key UNIQUE (name),
  CONSTRAINT chk_payment_type CHECK (
    (type)::text = ANY (
      ARRAY[
        'cash'::character varying,
        'card'::character varying,
        'digital_wallet'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  payment_method_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  reference_number CHARACTER VARYING(100),
  status CHARACTER VARYING(20) NOT NULL DEFAULT 'pending'::character varying,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processing_fee NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  processed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sales_transaction_id UUID,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id),
  CONSTRAINT payments_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES users (id),
  CONSTRAINT payments_sales_transaction_id_fkey FOREIGN KEY (sales_transaction_id) REFERENCES sales_transactions (id),
  CONSTRAINT chk_payment_status CHECK (
    (status)::text = ANY (
      ARRAY[
        'pending'::character varying,
        'completed'::character varying,
        'failed'::character varying,
        'refunded'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  transaction_id CHARACTER VARYING(100),
  payment_method CHARACTER VARYING(20) NOT NULL,
  payment_gateway CHARACTER VARYING(50),
  amount NUMERIC(10, 2) NOT NULL,
  currency CHARACTER VARYING(3) DEFAULT 'PHP'::character varying,
  processing_fee NUMERIC(10, 2) DEFAULT 0,
  status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  gateway_status CHARACTER VARYING(50),
  reference_number CHARACTER VARYING(100),
  gateway_response JSONB,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_transaction_id_key UNIQUE (transaction_id),
  CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT chk_payment_transaction_status CHECK (
    (status)::text = ANY (
      ARRAY[
        'pending'::character varying,
        'processing'::character varying,
        'completed'::character varying,
        'failed'::character varying,
        'cancelled'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- Create order_tracking table
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  tracking_number CHARACTER VARYING(100),
  carrier CHARACTER VARYING(50),
  current_location CHARACTER VARYING(255),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  last_update TIMESTAMP WITH TIME ZONE,
  update_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT order_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT order_tracking_tracking_number_key UNIQUE (tracking_number),
  CONSTRAINT order_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT chk_tracking_status CHECK (
    (status)::text = ANY (
      ARRAY[
        'pending'::character varying,
        'in_transit'::character varying,
        'out_for_delivery'::character varying,
        'delivered'::character varying,
        'failed'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  status CHARACTER VARYING(20) NOT NULL,
  previous_status CHARACTER VARYING(20),
  changed_by UUID,
  changed_by_name CHARACTER VARYING(100),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID,
  customer_id UUID,
  email_type CHARACTER VARYING(50) NOT NULL,
  recipient_email CHARACTER VARYING(100) NOT NULL,
  recipient_name CHARACTER VARYING(100),
  subject CHARACTER VARYING(255) NOT NULL,
  template_name CHARACTER VARYING(100),
  content_html TEXT,
  content_text TEXT,
  status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT email_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT email_notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id)
) TABLESPACE pg_default;

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING(100) NOT NULL,
  subject_template CHARACTER VARYING(255) NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_templates_pkey PRIMARY KEY (id),
  CONSTRAINT email_templates_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  order_id UUID,
  transaction_type CHARACTER VARYING(20) NOT NULL,
  quantity_change NUMERIC(10, 3) NOT NULL,
  quantity_before NUMERIC(10, 3) NOT NULL,
  quantity_after NUMERIC(10, 3) NOT NULL,
  reference_number CHARACTER VARYING(100),
  notes TEXT,
  created_by UUID,
  created_by_name CHARACTER VARYING(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id),
  CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT inventory_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT chk_transaction_type CHECK (
    (transaction_type)::text = ANY (
      ARRAY[
        'sale'::character varying,
        'adjustment'::character varying,
        'restock'::character varying,
        'return'::character varying,
        'reservation'::character varying,
        'release'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- ==============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_guest_branch ON public.orders(is_guest_order, branch_id, created_at);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_unit_id ON public.order_items(product_unit_id);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON public.payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_processed_by ON public.payments(processed_by);

-- Payment transactions table indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);

-- Order tracking table indexes
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON public.order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_tracking_number ON public.order_tracking(tracking_number);

-- Order status history table indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);

-- Email notifications table indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_order_id ON public.email_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_email_type ON public.email_notifications(email_type);

-- Email templates table indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Inventory transactions table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_branch_id ON public.inventory_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order_id ON public.inventory_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions(transaction_type);

-- Payment methods table indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);

-- ==============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. CREATE RLS POLICIES
-- ==============================================

-- Payment methods policies
CREATE POLICY "Public can read payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage payment methods" ON public.payment_methods FOR ALL USING (auth.role() = 'authenticated');

-- Payments policies
CREATE POLICY "Public can read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE USING (auth.role() = 'authenticated');

-- Payment transactions policies
CREATE POLICY "Public can read payment transactions" ON public.payment_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert payment transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update payment transactions" ON public.payment_transactions FOR UPDATE USING (auth.role() = 'authenticated');

-- Order tracking policies
CREATE POLICY "Public can read order tracking" ON public.order_tracking FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update order tracking" ON public.order_tracking FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert order tracking" ON public.order_tracking FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Order status history policies
CREATE POLICY "Public can read order status history" ON public.order_status_history FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert order status history" ON public.order_status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Email notifications policies
CREATE POLICY "Public can read email notifications" ON public.email_notifications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage email notifications" ON public.email_notifications FOR ALL USING (auth.role() = 'authenticated');

-- Email templates policies
CREATE POLICY "Public can read email templates" ON public.email_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage email templates" ON public.email_templates FOR ALL USING (auth.role() = 'authenticated');

-- Inventory transactions policies
CREATE POLICY "Public can read inventory transactions" ON public.inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert inventory transactions" ON public.inventory_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 6. INSERT SAMPLE DATA
-- ==============================================

-- Insert sample payment methods
INSERT INTO public.payment_methods (name, type, is_active, requires_reference, processing_fee) VALUES
('Cash', 'cash', true, false, 0),
('GCash', 'digital_wallet', true, true, 0.02),
('PayMaya', 'digital_wallet', true, true, 0.02),
('Credit Card', 'card', true, true, 0.03),
('Debit Card', 'card', true, true, 0.02)
ON CONFLICT (name) DO NOTHING;

-- Insert sample email templates
INSERT INTO public.email_templates (name, subject_template, html_template, text_template, variables, is_active) VALUES
('order_confirmation', 'Order Confirmation - {{order_number}}', 
'<h1>Order Confirmed!</h1><p>Dear {{customer_name}},</p><p>Your order {{order_number}} has been confirmed and is being prepared.</p><p><strong>Order Total:</strong> {{order_total}}</p><p><strong>Estimated Ready Time:</strong> {{estimated_ready_time}}</p><p><strong>Pickup Location:</strong> {{branch_name}}</p>',
'Order Confirmed!\n\nDear {{customer_name}},\n\nYour order {{order_number}} has been confirmed and is being prepared.\n\nOrder Total: {{order_total}}\nEstimated Ready Time: {{estimated_ready_time}}\nPickup Location: {{branch_name}}',
'["customer_name", "order_number", "order_total", "estimated_ready_time", "branch_name"]'::jsonb, true),
('order_ready', 'Your Order is Ready - {{order_number}}',
'<h1>Your Order is Ready!</h1><p>Dear {{customer_name}},</p><p>Your order {{order_number}} is ready for pickup.</p><p><strong>Pickup Location:</strong> {{branch_name}}</p><p><strong>Address:</strong> {{branch_address}}</p>',
'Your Order is Ready!\n\nDear {{customer_name}},\n\nYour order {{order_number}} is ready for pickup.\n\nPickup Location: {{branch_name}}\nAddress: {{branch_address}}',
'["customer_name", "order_number", "branch_name", "branch_address"]'::jsonb, true),
('order_cancelled', 'Order Cancelled - {{order_number}}',
'<h1>Order Cancelled</h1><p>Dear {{customer_name}},</p><p>Your order {{order_number}} has been cancelled.</p><p>If you have any questions, please contact us.</p>',
'Order Cancelled\n\nDear {{customer_name}},\n\nYour order {{order_number}} has been cancelled.\n\nIf you have any questions, please contact us.',
'["customer_name", "order_number"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- 7. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to update order payment status
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order payment status based on payment status
  UPDATE orders 
  SET 
    payment_status = NEW.status,
    updated_at = NOW()
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate processing fee
CREATE OR REPLACE FUNCTION calculate_processing_fee()
RETURNS TRIGGER AS $$
DECLARE
  fee_rate NUMERIC;
BEGIN
  -- Get processing fee rate from payment method
  SELECT processing_fee INTO fee_rate
  FROM payment_methods
  WHERE id = NEW.payment_method_id;
  
  -- Calculate processing fee
  NEW.processing_fee = NEW.amount * COALESCE(fee_rate, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to audit payments
CREATE OR REPLACE FUNCTION audit_payments_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- This would typically insert into an audit log table
  -- For now, we'll just return the new record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. CREATE TRIGGERS
-- ==============================================

-- Trigger to update order payment status when payment is created/updated
CREATE TRIGGER update_order_payment_status_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_status();

-- Trigger to calculate processing fee before payment insert
CREATE TRIGGER calculate_processing_fee_trigger
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_processing_fee();

-- Trigger to audit payments
CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR DELETE OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION audit_payments_trigger();

-- Trigger to audit inventory
CREATE TRIGGER audit_inventory_trigger
  AFTER INSERT OR DELETE OR UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Trigger to update inventory updated_at
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. CREATE VIEWS FOR COMMON QUERIES
-- ==============================================

-- View for order details with all related information
CREATE OR REPLACE VIEW public.order_details AS
SELECT 
  o.*,
  c.first_name || ' ' || c.last_name as customer_full_name,
  c.email as customer_email,
  c.phone as customer_phone,
  b.name as branch_name,
  b.address as branch_address,
  b.phone as branch_phone,
  pm.name as payment_method_name,
  p.status as payment_status,
  ot.tracking_number,
  ot.current_location,
  ot.status as tracking_status
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN branches b ON o.branch_id = b.id
LEFT JOIN payments p ON o.id = p.order_id
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
LEFT JOIN order_tracking ot ON o.id = ot.order_id;

-- View for order items with product details
CREATE OR REPLACE VIEW public.order_items_details AS
SELECT 
  oi.*,
  p.name as product_name,
  p.sku as product_sku,
  p.description as product_description,
  pu.unit_name,
  pu.unit_label,
  pu.conversion_factor,
  c.name as category_name
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN product_units pu ON oi.product_unit_id = pu.id
LEFT JOIN categories c ON p.category_id = c.id;

-- ==============================================
-- 10. GRANT PERMISSIONS
-- ==============================================

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_transactions TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.order_details TO authenticated, anon;
GRANT SELECT ON public.order_items_details TO authenticated, anon;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION update_order_payment_status() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_processing_fee() TO authenticated;
GRANT EXECUTE ON FUNCTION audit_payments_trigger() TO authenticated;

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Complete checkout system migration completed successfully!';
  RAISE NOTICE 'Added tables: payment_methods, payments, payment_transactions, order_tracking, order_status_history, email_notifications, email_templates, inventory_transactions';
  RAISE NOTICE 'Updated tables: orders, order_items, inventory';
  RAISE NOTICE 'Created indexes, policies, triggers, and views for optimal performance';
  RAISE NOTICE 'Inserted sample data for testing';
END $$;
