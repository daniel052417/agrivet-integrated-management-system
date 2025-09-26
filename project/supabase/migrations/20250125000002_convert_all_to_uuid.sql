-- Convert All Database IDs to UUIDs
-- This migration converts the entire system to use UUIDs consistently

-- ============================================================================
-- DROP DEPENDENT VIEWS AND OBJECTS
-- ============================================================================

-- Drop all views that might depend on columns we're about to modify
DROP VIEW IF EXISTS staff_with_accounts CASCADE;
DROP VIEW IF EXISTS users_with_staff CASCADE;
DROP VIEW IF EXISTS employee_summary CASCADE;
DROP VIEW IF EXISTS product_inventory_summary CASCADE;
DROP VIEW IF EXISTS sales_summary CASCADE;
DROP VIEW IF EXISTS pos_session_summary CASCADE;
DROP VIEW IF EXISTS campaign_performance CASCADE;
DROP VIEW IF EXISTS payroll_summary CASCADE;

-- ============================================================================
-- CONVERT ROLES TABLE TO UUID
-- ============================================================================

-- Drop existing constraints and columns
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;

-- Remove the integer role_id column if it exists
ALTER TABLE roles DROP COLUMN IF EXISTS role_id;

-- Ensure roles.id is UUID and primary key
ALTER TABLE roles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT USERS TABLE TO UUID
-- ============================================================================

-- Drop existing constraints
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Remove the integer user_id column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS user_id;

-- Ensure users.id is UUID and primary key
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT USER_ROLES TABLE TO UUID
-- ============================================================================

-- Update user_roles to use UUIDs
ALTER TABLE user_roles ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE user_roles ALTER COLUMN role_id TYPE UUID USING role_id::UUID;

-- Add foreign key constraints
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_id_fkey 
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- ============================================================================
-- CONVERT ROLE_PERMISSIONS TABLE TO UUID
-- ============================================================================

-- Update role_permissions to use UUIDs
ALTER TABLE role_permissions ALTER COLUMN role_id TYPE UUID USING role_id::UUID;
ALTER TABLE role_permissions ALTER COLUMN permission_id TYPE UUID USING permission_id::UUID;

-- Add foreign key constraints
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey 
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey 
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- ============================================================================
-- CONVERT PRODUCTS TABLE TO UUID
-- ============================================================================

-- Remove integer product_id if it exists
ALTER TABLE products DROP COLUMN IF EXISTS product_id;

-- Ensure products.id is UUID and primary key
ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT CUSTOMERS TABLE TO UUID
-- ============================================================================

-- Ensure customers.id is UUID and primary key
ALTER TABLE customers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT STAFF TABLE TO UUID
-- ============================================================================

-- Remove string employee_id if it exists
ALTER TABLE staff DROP COLUMN IF EXISTS employee_id;

-- Ensure staff.id is UUID and primary key
ALTER TABLE staff ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE staff ADD CONSTRAINT staff_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT DEPARTMENTS TABLE TO UUID
-- ============================================================================

-- Remove integer department_id if it exists
ALTER TABLE departments DROP COLUMN IF EXISTS department_id;

-- Ensure departments.id is UUID and primary key
ALTER TABLE departments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT JOB_TITLES TABLE TO UUID
-- ============================================================================

-- Remove integer job_title_id if it exists
ALTER TABLE job_titles DROP COLUMN IF EXISTS job_title_id;

-- Ensure job_titles.id is UUID and primary key
ALTER TABLE job_titles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE job_titles ADD CONSTRAINT job_titles_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT EMPLOYEES TABLE TO UUID
-- ============================================================================

-- Remove integer employee_id if it exists
ALTER TABLE employees DROP COLUMN IF EXISTS employee_id;

-- Ensure employees.id is UUID and primary key
ALTER TABLE employees ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT LOCATIONS TABLE TO UUID
-- ============================================================================

-- Remove integer location_id if it exists
ALTER TABLE locations DROP COLUMN IF EXISTS location_id;

-- Ensure locations.id is UUID and primary key
ALTER TABLE locations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE locations ADD CONSTRAINT locations_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT SUPPLIERS TABLE TO UUID
-- ============================================================================

-- Remove integer supplier_id if it exists
ALTER TABLE suppliers DROP COLUMN IF EXISTS supplier_id;

-- Ensure suppliers.id is UUID and primary key
ALTER TABLE suppliers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE suppliers ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT BRANCHES TABLE TO UUID
-- ============================================================================

-- Remove integer branch_id if it exists
ALTER TABLE branches DROP COLUMN IF EXISTS branch_id;

-- Ensure branches.id is UUID and primary key
ALTER TABLE branches ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE branches ADD CONSTRAINT branches_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT INVENTORY TABLE TO UUID
-- ============================================================================

-- Remove integer inventory_id if it exists
ALTER TABLE inventory DROP COLUMN IF EXISTS inventory_id;

-- Ensure inventory.id is UUID and primary key
ALTER TABLE inventory ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE inventory ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT SALES_TRANSACTIONS TABLE TO UUID
-- ============================================================================

-- Ensure sales_transactions.id is UUID and primary key
ALTER TABLE sales_transactions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE sales_transactions ADD CONSTRAINT sales_transactions_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT SALES_TRANSACTION_ITEMS TABLE TO UUID
-- ============================================================================

-- Ensure sales_transaction_items.id is UUID and primary key
ALTER TABLE sales_transaction_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE sales_transaction_items ADD CONSTRAINT sales_transaction_items_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT POS_SESSIONS TABLE TO UUID
-- ============================================================================

-- Ensure pos_sessions.id is UUID and primary key
ALTER TABLE pos_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pos_sessions ADD CONSTRAINT pos_sessions_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT POS_TRANSACTIONS TABLE TO UUID
-- ============================================================================

-- Ensure pos_transactions.id is UUID and primary key
ALTER TABLE pos_transactions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pos_transactions ADD CONSTRAINT pos_transactions_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT POS_TRANSACTION_ITEMS TABLE TO UUID
-- ============================================================================

-- Ensure pos_transaction_items.id is UUID and primary key
ALTER TABLE pos_transaction_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pos_transaction_items ADD CONSTRAINT pos_transaction_items_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT POS_PAYMENTS TABLE TO UUID
-- ============================================================================

-- Ensure pos_payments.id is UUID and primary key
ALTER TABLE pos_payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pos_payments ADD CONSTRAINT pos_payments_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT MARKETING_CAMPAIGNS TABLE TO UUID
-- ============================================================================

-- Ensure marketing_campaigns.id is UUID and primary key
ALTER TABLE marketing_campaigns ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE marketing_campaigns ADD CONSTRAINT marketing_campaigns_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT CAMPAIGN_TEMPLATES TABLE TO UUID
-- ============================================================================

-- Ensure campaign_templates.id is UUID and primary key
ALTER TABLE campaign_templates ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE campaign_templates ADD CONSTRAINT campaign_templates_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT CAMPAIGN_ANALYTICS TABLE TO UUID
-- ============================================================================

-- Ensure campaign_analytics.id is UUID and primary key
ALTER TABLE campaign_analytics ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE campaign_analytics ADD CONSTRAINT campaign_analytics_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT CAMPAIGN_SCHEDULES TABLE TO UUID
-- ============================================================================

-- Ensure campaign_schedules.id is UUID and primary key
ALTER TABLE campaign_schedules ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE campaign_schedules ADD CONSTRAINT campaign_schedules_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT PAYROLL_RECORDS TABLE TO UUID
-- ============================================================================

-- Ensure payroll_records.id is UUID and primary key
ALTER TABLE payroll_records ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE payroll_records ADD CONSTRAINT payroll_records_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT PAYROLL_COMPONENTS TABLE TO UUID
-- ============================================================================

-- Ensure payroll_components.id is UUID and primary key
ALTER TABLE payroll_components ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE payroll_components ADD CONSTRAINT payroll_components_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT LEAVE_REQUESTS TABLE TO UUID
-- ============================================================================

-- Ensure leave_requests.id is UUID and primary key
ALTER TABLE leave_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT LEADS TABLE TO UUID
-- ============================================================================

-- Ensure leads.id is UUID and primary key
ALTER TABLE leads ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT COMPONENT_ACCESS TABLE TO UUID
-- ============================================================================

-- Ensure component_access.id is UUID and primary key
ALTER TABLE component_access ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE component_access ADD CONSTRAINT component_access_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT APP_SETTINGS TABLE TO UUID
-- ============================================================================

-- Ensure app_settings.id is UUID and primary key
ALTER TABLE app_settings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);

-- ============================================================================
-- CONVERT SYSTEM_SETTINGS TABLE TO UUID
-- ============================================================================

-- Ensure system_settings.id is UUID and primary key
ALTER TABLE system_settings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE system_settings ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);

-- ============================================================================
-- UPDATE HELPER FUNCTIONS FOR UUID
-- ============================================================================

-- Update get_user_permissions function
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
    WHERE ur.user_id = user_uuid
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
            ur.user_id = user_uuid
            AND ur.is_active = true 
            AND rp.is_granted = true
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE RLS POLICIES FOR UUID
-- ============================================================================

-- Update POS transaction policies
DROP POLICY IF EXISTS "Staff can view POS transactions" ON pos_transactions;
CREATE POLICY "Staff can view POS transactions" ON pos_transactions FOR SELECT USING (
    cashier_id = auth.uid()
);

DROP POLICY IF EXISTS "Staff can view POS transaction items" ON pos_transaction_items;
CREATE POLICY "Staff can view POS transaction items" ON pos_transaction_items FOR SELECT USING (
    transaction_id IN (
        SELECT id FROM pos_transactions 
        WHERE cashier_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Staff can view POS payments" ON pos_payments;
CREATE POLICY "Staff can view POS payments" ON pos_payments FOR SELECT USING (
    transaction_id IN (
        SELECT id FROM pos_transactions 
        WHERE cashier_id = auth.uid()
    )
);

-- ============================================================================
-- ADD MISSING INDEXES FOR UUID TABLES
-- ============================================================================

-- User and role indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

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
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE roles IS 'User roles with UUID primary keys';
COMMENT ON TABLE users IS 'System users with UUID primary keys';
COMMENT ON TABLE user_roles IS 'User-role assignments with UUID foreign keys';
COMMENT ON TABLE role_permissions IS 'Role-permission assignments with UUID foreign keys';
COMMENT ON TABLE products IS 'Product catalog with UUID primary keys';
COMMENT ON TABLE customers IS 'Customer records with UUID primary keys';
COMMENT ON TABLE staff IS 'Staff records with UUID primary keys';

-- ============================================================================
-- RECREATE IMPORTANT VIEWS
-- ============================================================================

-- Recreate staff_with_accounts view
CREATE VIEW staff_with_accounts AS
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    s.position,
    s.department,
    s.is_active,
    s.user_account_id,
    u.username,
    u.role,
    s.created_at,
    s.updated_at
FROM staff s
LEFT JOIN users u ON s.user_account_id = u.id;

-- Recreate users_with_staff view
CREATE VIEW users_with_staff AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active,
    u.staff_id,
    s.position,
    s.department,
    s.hire_date,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN staff s ON u.staff_id = s.id;

-- Recreate employee_summary view
CREATE VIEW employee_summary AS
SELECT 
    e.id,
    e.employee_code,
    e.hire_date,
    e.termination_date,
    e.salary,
    jt.title_name,
    d.department_name,
    s.first_name,
    s.last_name,
    s.email,
    s.is_active
FROM employees e
LEFT JOIN job_titles jt ON e.job_title_id = jt.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN staff s ON e.id = s.id;

-- Recreate product_inventory_summary view
CREATE VIEW product_inventory_summary AS
SELECT 
    p.id,
    p.product_name,
    p.sku,
    p.price,
    p.cost_price,
    p.stock_quantity,
    p.minimum_stock,
    c.name as category_name,
    s.supplier_name,
    i.quantity_on_hand,
    i.reorder_point
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN inventory i ON p.id = i.product_id;

-- Recreate sales_summary view
CREATE VIEW sales_summary AS
SELECT 
    st.id,
    st.transaction_number,
    st.transaction_date,
    st.total_amount,
    st.payment_status,
    c.first_name || ' ' || c.last_name as customer_name,
    s.first_name || ' ' || s.last_name as staff_name,
    b.branch_name
FROM sales_transactions st
LEFT JOIN customers c ON st.customer_id = c.id
LEFT JOIN staff s ON st.staff_id = s.id
LEFT JOIN branches b ON st.branch_id = b.id;

-- Recreate pos_session_summary view
CREATE VIEW pos_session_summary AS
SELECT 
    ps.id,
    ps.session_number,
    ps.opened_at,
    ps.closed_at,
    ps.total_sales,
    ps.total_transactions,
    ps.status,
    u.username as cashier_name,
    b.branch_name
FROM pos_sessions ps
LEFT JOIN users u ON ps.cashier_id = u.id
LEFT JOIN branches b ON ps.branch_id = b.id;

-- Recreate campaign_performance view
CREATE VIEW campaign_performance AS
SELECT 
    mc.id,
    mc.campaign_name,
    mc.template_type,
    mc.views_count,
    mc.clicks_count,
    mc.conversions_count,
    CASE 
        WHEN mc.views_count > 0 THEN (mc.clicks_count::float / mc.views_count) * 100
        ELSE 0
    END as click_through_rate,
    CASE 
        WHEN mc.clicks_count > 0 THEN (mc.conversions_count::float / mc.clicks_count) * 100
        ELSE 0
    END as conversion_rate,
    mc.is_active,
    mc.is_published,
    mc.created_at
FROM marketing_campaigns mc;

-- Recreate payroll_summary view
CREATE VIEW payroll_summary AS
SELECT 
    pr.id,
    pr.pay_period_start,
    pr.pay_period_end,
    pr.basic_salary,
    pr.gross_pay,
    pr.total_deductions,
    pr.net_pay,
    pr.status,
    s.first_name || ' ' || s.last_name as employee_name,
    s.position,
    s.department
FROM payroll_records pr
LEFT JOIN staff s ON pr.employee_id = s.id;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
INSERT INTO system_settings (setting_key, setting_value, setting_category, description) VALUES
('uuid_conversion_version', '20250125000002', 'system', 'All database IDs converted to UUIDs'),
('uuid_conversion_completed', now()::text, 'system', 'UUID conversion completion time')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
