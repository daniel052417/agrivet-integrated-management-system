-- Fix Schema Mismatches to Match Existing Code
-- This migration fixes the schema to match your existing TypeScript interfaces

-- ============================================================================
-- FIX ID FIELD TYPES AND TABLE STRUCTURES
-- ============================================================================

-- Fix roles table to use role_id as integer
-- First, add the new role_id column
ALTER TABLE roles ADD COLUMN IF NOT EXISTS role_id SERIAL;

-- Update existing data to populate role_id
UPDATE roles SET role_id = nextval('roles_role_id_seq') WHERE role_id IS NULL;

-- Make role_id NOT NULL and add unique constraint
ALTER TABLE roles ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE roles ADD CONSTRAINT roles_role_id_key UNIQUE (role_id);

-- Keep the existing id column for compatibility

-- Fix users table to have both UUID id and integer user_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id SERIAL;
ALTER TABLE users ADD CONSTRAINT users_user_id_key UNIQUE (user_id);

-- Fix user_roles table to use integer IDs
-- Add new columns with correct types
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS user_id_new INTEGER;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_id_new INTEGER;

-- Update data if exists - map UUIDs to integers
UPDATE user_roles SET 
  user_id_new = (SELECT user_id FROM users WHERE users.id = user_roles.user_id),
  role_id_new = (SELECT role_id FROM roles WHERE roles.id = user_roles.role_id)
WHERE user_id IS NOT NULL AND role_id IS NOT NULL;

-- Make new columns NOT NULL where we have data
ALTER TABLE user_roles ALTER COLUMN user_id_new SET NOT NULL;
ALTER TABLE user_roles ALTER COLUMN role_id_new SET NOT NULL;

-- Drop old foreign key constraints
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;

-- Drop old columns and rename new ones
ALTER TABLE user_roles DROP COLUMN IF EXISTS user_id;
ALTER TABLE user_roles DROP COLUMN IF EXISTS role_id;
ALTER TABLE user_roles RENAME COLUMN user_id_new TO user_id;
ALTER TABLE user_roles RENAME COLUMN role_id_new TO role_id;

-- Add primary key and foreign keys
ALTER TABLE user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_id_fkey 
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE;

-- Fix role_permissions table
-- Add new columns with correct types
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS role_id_new INTEGER;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_id_new INTEGER;

-- Update data if exists - map UUIDs to integers
UPDATE role_permissions SET 
  role_id_new = (SELECT role_id FROM roles WHERE roles.id = role_permissions.role_id),
  permission_id_new = (SELECT id FROM permissions WHERE permissions.id = role_permissions.permission_id)
WHERE role_id IS NOT NULL AND permission_id IS NOT NULL;

-- Make new columns NOT NULL where we have data
ALTER TABLE role_permissions ALTER COLUMN role_id_new SET NOT NULL;
ALTER TABLE role_permissions ALTER COLUMN permission_id_new SET NOT NULL;

-- Drop old foreign key constraints
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;

-- Drop old columns and rename new ones
ALTER TABLE role_permissions DROP COLUMN IF EXISTS role_id;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS permission_id;
ALTER TABLE role_permissions RENAME COLUMN role_id_new TO role_id;
ALTER TABLE role_permissions RENAME COLUMN permission_id_new TO permission_id;

-- Add constraints
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey 
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE;
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey 
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- ============================================================================
-- FIX POS SYSTEM TABLES
-- ============================================================================

-- Fix pos_sessions table
ALTER TABLE pos_sessions RENAME COLUMN opened_by TO cashier_id;
ALTER TABLE pos_sessions DROP COLUMN IF EXISTS closed_by;
ALTER TABLE pos_sessions ADD COLUMN IF NOT EXISTS closed_by INTEGER;

-- Create pos_transactions table (if not exists)
CREATE TABLE IF NOT EXISTS pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pos_session_id UUID REFERENCES pos_sessions(id) ON DELETE CASCADE,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    cashier_id INTEGER,
    branch_id UUID REFERENCES branches(id),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    transaction_type VARCHAR(20) DEFAULT 'sale',
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'completed',
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT pos_transactions_type_check CHECK (transaction_type IN ('sale', 'return', 'exchange', 'void')),
    CONSTRAINT pos_transactions_payment_status_check CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    CONSTRAINT pos_transactions_status_check CHECK (status IN ('active', 'void', 'returned'))
);

-- Create pos_transaction_items table
CREATE TABLE IF NOT EXISTS pos_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    weight_kg DECIMAL(8,3),
    expiry_date DATE,
    batch_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pos_payments table
CREATE TABLE IF NOT EXISTS pos_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL,
    payment_type VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    change_given DECIMAL(12,2) DEFAULT 0,
    reference_number VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'completed',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT pos_payments_method_check CHECK (payment_method IN ('cash', 'digital')),
    CONSTRAINT pos_payments_status_check CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Rename transaction_items to sales_transaction_items
ALTER TABLE transaction_items RENAME TO sales_transaction_items;

-- ============================================================================
-- FIX PRODUCTS TABLE
-- ============================================================================

-- Add product_id as integer (keeping UUID id for compatibility)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_id SERIAL;
ALTER TABLE products ADD CONSTRAINT products_product_id_key UNIQUE (product_id);

-- ============================================================================
-- FIX CUSTOMERS TABLE
-- ============================================================================

-- Ensure customer_code exists
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_code VARCHAR(20);
ALTER TABLE customers ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);

-- ============================================================================
-- FIX STAFF TABLE
-- ============================================================================

-- Add employee_id as string (keeping UUID id for compatibility)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE staff ADD CONSTRAINT staff_employee_id_key UNIQUE (employee_id);

-- ============================================================================
-- UPDATE HELPER FUNCTIONS
-- ============================================================================

-- Update get_user_permissions function to work with new structure
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    description TEXT,
    resource VARCHAR(50),
    action VARCHAR(50),
    component VARCHAR(200),
    category VARCHAR(20),
    is_system BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.resource,
        p.action,
        p.component,
        p.category,
        p.is_system,
        p.created_at,
        p.updated_at
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = (SELECT user_id FROM users WHERE id = user_uuid)
    AND ur.is_active = true 
    AND rp.is_granted = true
    AND p.is_visible = true;
END;
$$ LANGUAGE plpgsql;

-- Update get_user_accessible_components function
CREATE OR REPLACE FUNCTION get_user_accessible_components(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    component_path VARCHAR(200),
    display_name VARCHAR(255),
    description TEXT,
    category VARCHAR(20),
    required_permission VARCHAR(100),
    is_active BOOLEAN,
    is_visible BOOLEAN,
    is_enabled BOOLEAN,
    upgrade_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        ca.id,
        ca.component_path,
        ca.display_name,
        ca.description,
        ca.category,
        ca.required_permission,
        ca.is_active,
        ca.is_visible,
        ca.is_enabled,
        ca.upgrade_message
    FROM component_access ca
    LEFT JOIN permissions p ON ca.required_permission = p.name
    LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    LEFT JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ca.is_active = true
    AND ca.is_visible = true
    AND (
        ca.required_permission IS NULL 
        OR (
            ur.user_id = (SELECT user_id FROM users WHERE id = user_uuid)
            AND ur.is_active = true 
            AND rp.is_granted = true
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADD MISSING INDEXES
-- ============================================================================

-- POS system indexes
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session_id ON pos_transactions(pos_session_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_cashier_id ON pos_transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_product_id ON pos_transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_pos_payments_transaction_id ON pos_payments(transaction_id);

-- Sales system indexes
CREATE INDEX IF NOT EXISTS idx_sales_transaction_items_transaction_id ON sales_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_items_product_id ON sales_transaction_items(product_id);

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Update RLS policies for new table structure
DROP POLICY IF EXISTS "Staff can view branch transactions" ON sales_transactions;
CREATE POLICY "Staff can view branch transactions" ON sales_transactions FOR SELECT USING (
    branch_id IN (
        SELECT branch_id FROM staff 
        JOIN staff_user_links ON staff.id = staff_user_links.staff_id 
        WHERE staff_user_links.user_id = auth.uid() AND staff_user_links.link_status = 'active'
    )
);

-- Add RLS for POS tables
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view POS transactions" ON pos_transactions FOR SELECT USING (
    cashier_id IN (
        SELECT user_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Staff can view POS transaction items" ON pos_transaction_items FOR SELECT USING (
    transaction_id IN (
        SELECT id FROM pos_transactions 
        WHERE cashier_id IN (
            SELECT user_id FROM users WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Staff can view POS payments" ON pos_payments FOR SELECT USING (
    transaction_id IN (
        SELECT id FROM pos_transactions 
        WHERE cashier_id IN (
            SELECT user_id FROM users WHERE id = auth.uid()
        )
    )
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for new tables
GRANT ALL ON TABLE pos_transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE pos_transaction_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE pos_payments TO anon, authenticated, service_role;
GRANT ALL ON TABLE sales_transaction_items TO anon, authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pos_transactions IS 'Point of sale transaction records';
COMMENT ON TABLE pos_transaction_items IS 'Individual items within POS transactions';
COMMENT ON TABLE pos_payments IS 'Payment records for POS transactions';
COMMENT ON TABLE sales_transaction_items IS 'Individual items within sales transactions';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
INSERT INTO system_settings (setting_key, setting_value, setting_category, description) VALUES
('schema_fix_version', '20250125000001', 'system', 'Schema mismatch fixes applied'),
('schema_fix_completed', now()::text, 'system', 'Schema mismatch fixes completion time')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
