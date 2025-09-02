-- POS System Database Schema Extension
-- This migration adds POS-specific tables to the existing agrivet system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- POS Sessions Management
CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    session_number VARCHAR(50) UNIQUE NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    starting_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
    ending_cash DECIMAL(10,2),
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS Transactions (extends existing sales_transactions)
CREATE TABLE IF NOT EXISTS pos_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(100) UNIQUE NOT NULL,
    pos_session_id UUID REFERENCES pos_sessions(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    cashier_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_type VARCHAR(20) DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'return', 'exchange', 'void')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'void', 'returned')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS Transaction Items (extends existing transaction_items)
CREATE TABLE IF NOT EXISTS pos_transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'pcs',
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    weight_kg DECIMAL(8,3), -- For weight-based products
    expiry_date DATE, -- For medicines and perishables
    batch_number VARCHAR(100), -- For batch tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS pos_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'digital')),
    payment_type VARCHAR(50), -- 'gcash', 'paymaya', 'grab_pay', etc.
    amount DECIMAL(10,2) NOT NULL,
    change_given DECIMAL(10,2) DEFAULT 0,
    reference_number VARCHAR(100), -- For digital payments
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Variants for POS
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- 'Size', 'Color', 'Weight', etc.
    variant_value VARCHAR(100) NOT NULL, -- 'Small', 'Red', '1kg', etc.
    price_modifier DECIMAL(10,2) DEFAULT 0, -- Additional cost or discount
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, variant_name, variant_value)
);

-- POS Settings and Configuration
CREATE TABLE IF NOT EXISTS pos_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(branch_id, setting_key)
);

-- Receipt Templates
CREATE TABLE IF NOT EXISTS receipt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(20) DEFAULT 'standard' CHECK (template_type IN ('standard', 'thermal', 'email', 'sms')),
    header_text TEXT,
    footer_text TEXT,
    logo_url VARCHAR(500),
    show_tax_breakdown BOOLEAN DEFAULT true,
    show_payment_methods BOOLEAN DEFAULT true,
    show_cashier_info BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick Sale Shortcuts
CREATE TABLE IF NOT EXISTS quick_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    shortcut_name VARCHAR(100) NOT NULL,
    shortcut_key VARCHAR(10), -- Keyboard shortcut
    quantity DECIMAL(10,3) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Loyalty Points
CREATE TABLE IF NOT EXISTS customer_loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    points_balance INTEGER DEFAULT 0,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS Audit Logs
CREATE TABLE IF NOT EXISTS pos_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES pos_sessions(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES pos_transactions(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    cashier_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Categories for POS (extending existing categories)
CREATE TABLE IF NOT EXISTS pos_product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    pricing_type VARCHAR(20) DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'weight_based', 'bulk')),
    unit_of_measure VARCHAR(20) DEFAULT 'pcs',
    requires_expiry_date BOOLEAN DEFAULT false,
    requires_batch_tracking BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend existing products table with POS-specific fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS pos_pricing_type VARCHAR(20) DEFAULT 'fixed' CHECK (pos_pricing_type IN ('fixed', 'weight_based', 'bulk'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_per_unit DECIMAL(8,3) DEFAULT 0; -- For weight-based products
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_discount_threshold INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_expiry_date BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_batch_tracking BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_quick_sale BOOLEAN DEFAULT false;

-- Extend existing customers table with loyalty fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_lifetime_spent DECIMAL(12,2) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pos_sessions_cashier_id ON pos_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_branch_id ON pos_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session_id ON pos_transactions(pos_session_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_customer_id ON pos_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_cashier_id ON pos_transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_product_id ON pos_transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_pos_payments_transaction_id ON pos_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_payments_method ON pos_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_pos_settings_branch_id ON pos_settings(branch_id);
CREATE INDEX IF NOT EXISTS idx_quick_sale_items_branch_id ON quick_sale_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_points_customer_id ON customer_loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_audit_logs_session_id ON pos_audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_audit_logs_created_at ON pos_audit_logs(created_at);

-- Insert default POS settings
INSERT INTO pos_settings (branch_id, setting_key, setting_value, setting_type, description) VALUES
    (NULL, 'default_tax_rate', '0.12', 'number', 'Default tax rate for POS transactions'),
    (NULL, 'currency_symbol', '₱', 'string', 'Currency symbol for display'),
    (NULL, 'receipt_footer', 'Thank you for your business!', 'string', 'Default receipt footer text'),
    (NULL, 'enable_loyalty_program', 'true', 'boolean', 'Enable customer loyalty program'),
    (NULL, 'loyalty_points_per_peso', '1', 'number', 'Loyalty points earned per peso spent'),
    (NULL, 'enable_digital_payments', 'true', 'boolean', 'Enable digital payment methods'),
    (NULL, 'auto_print_receipt', 'true', 'boolean', 'Automatically print receipt after transaction'),
    (NULL, 'require_customer_for_sale', 'false', 'boolean', 'Require customer selection for all sales'),
    (NULL, 'low_stock_threshold', '10', 'number', 'Low stock alert threshold'),
    (NULL, 'session_timeout_minutes', '480', 'number', 'POS session timeout in minutes')
ON CONFLICT (branch_id, setting_key) DO NOTHING;

-- Insert default receipt template
INSERT INTO receipt_templates (branch_id, template_name, template_type, header_text, footer_text, is_default, is_active) VALUES
    (NULL, 'Standard Receipt', 'standard', 'AGRIVET STORE\nThank you for your purchase!', 'Thank you for your business!\nVisit us again soon!', true, true)
ON CONFLICT DO NOTHING;

-- Create functions for POS operations
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO new_number;
    
    -- Get count of transactions for today
    SELECT COUNT(*) + 1 INTO counter
    FROM pos_transactions
    WHERE DATE(transaction_date) = CURRENT_DATE;
    
    -- Format: YYYYMMDD-XXXX
    new_number := new_number || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate loyalty points
CREATE OR REPLACE FUNCTION calculate_loyalty_points(amount DECIMAL, customer_tier VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    points_per_peso DECIMAL := 1;
    multiplier DECIMAL := 1;
BEGIN
    -- Get points per peso from settings
    SELECT setting_value::DECIMAL INTO points_per_peso
    FROM pos_settings
    WHERE setting_key = 'loyalty_points_per_peso' AND branch_id IS NULL;
    
    -- Apply tier multiplier
    CASE customer_tier
        WHEN 'bronze' THEN multiplier := 1.0;
        WHEN 'silver' THEN multiplier := 1.1;
        WHEN 'gold' THEN multiplier := 1.25;
        WHEN 'platinum' THEN multiplier := 1.5;
        ELSE multiplier := 1.0;
    END CASE;
    
    RETURN FLOOR(amount * points_per_peso * multiplier);
END;
$$ LANGUAGE plpgsql;

-- Function to update customer loyalty points
CREATE OR REPLACE FUNCTION update_customer_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    points_earned INTEGER;
    new_balance INTEGER;
BEGIN
    -- Calculate points earned
    SELECT calculate_loyalty_points(NEW.total_amount, c.loyalty_tier) INTO points_earned
    FROM customers c
    WHERE c.id = NEW.customer_id;
    
    -- Update customer points
    UPDATE customers
    SET loyalty_points = loyalty_points + points_earned,
        total_lifetime_spent = total_lifetime_spent + NEW.total_amount,
        last_purchase_date = NEW.transaction_date
    WHERE id = NEW.customer_id;
    
    -- Insert loyalty points record
    INSERT INTO customer_loyalty_points (customer_id, transaction_id, points_earned, points_balance)
    VALUES (NEW.customer_id, NEW.id, points_earned, 
            (SELECT loyalty_points FROM customers WHERE id = NEW.customer_id));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loyalty points
CREATE TRIGGER trigger_update_loyalty_points
    AFTER INSERT ON pos_transactions
    FOR EACH ROW
    WHEN (NEW.customer_id IS NOT NULL AND NEW.payment_status = 'completed')
    EXECUTE FUNCTION update_customer_loyalty_points();

-- Function to check low stock
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    threshold INTEGER;
BEGIN
    -- Get low stock threshold from settings
    SELECT setting_value::INTEGER INTO threshold
    FROM pos_settings
    WHERE setting_key = 'low_stock_threshold' AND branch_id IS NULL;
    
    -- Check if stock is below threshold after transaction
    IF (SELECT stock_quantity FROM products WHERE id = NEW.product_id) <= threshold THEN
        -- Log low stock alert (you can extend this to send notifications)
        INSERT INTO pos_audit_logs (session_id, action, entity_type, entity_id, new_value)
        VALUES (
            (SELECT pos_session_id FROM pos_transactions WHERE id = NEW.transaction_id),
            'low_stock_alert',
            'product',
            NEW.product_id::TEXT,
            'Stock below threshold: ' || (SELECT stock_quantity FROM products WHERE id = NEW.product_id)::TEXT
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock checking
CREATE TRIGGER trigger_check_low_stock
    AFTER INSERT ON pos_transaction_items
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

