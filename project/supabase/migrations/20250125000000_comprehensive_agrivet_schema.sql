-- Comprehensive Agrivet Management System Schema Migration
-- This migration creates a complete, optimized database schema for the Agrivet Integrated Management System
-- Date: 2025-01-25
-- Description: Complete schema overhaul with proper permissions, relationships, and business logic

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE SYSTEM TABLES
-- ============================================================================

-- System settings and configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_category VARCHAR(50) NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Application settings
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name VARCHAR(255) DEFAULT 'AgriVet Management System',
    company_name VARCHAR(255) DEFAULT 'AgriVet Supply Co.',
    company_logo TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    currency VARCHAR(3) DEFAULT 'PHP',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    number_format VARCHAR(20) DEFAULT '1,234.56',
    fiscal_year_start DATE DEFAULT '2025-01-01',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

-- Enhanced users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    staff_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Roles table with enhanced structure
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 10,
    is_custom BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    component VARCHAR(200),
    category VARCHAR(20) DEFAULT 'standard',
    is_system BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    is_enabled BOOLEAN DEFAULT true,
    upgrade_message TEXT,
    required_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT permissions_category_check CHECK (category IN ('sensitive', 'upgradeable', 'standard'))
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    granted_by UUID REFERENCES users(id),
    UNIQUE(role_id, permission_id)
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id)
);

-- Component access control
CREATE TABLE IF NOT EXISTS component_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_path VARCHAR(200) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) DEFAULT 'standard',
    required_permission VARCHAR(100),
    required_role VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    is_enabled BOOLEAN DEFAULT true,
    upgrade_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT component_access_category_check CHECK (category IN ('sensitive', 'upgradeable', 'standard'))
);

-- ============================================================================
-- BRANCH & LOCATION MANAGEMENT
-- ============================================================================

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    opening_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Locations within branches
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) DEFAULT 'warehouse',
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT locations_type_check CHECK (location_type IN ('warehouse', 'store', 'office', 'other'))
);

-- ============================================================================
-- STAFF MANAGEMENT
-- ============================================================================

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    branch_id UUID REFERENCES branches(id),
    hire_date DATE NOT NULL,
    termination_date DATE,
    salary DECIMAL(12,2),
    hourly_rate DECIMAL(8,2),
    employment_type VARCHAR(20) DEFAULT 'full_time',
    status VARCHAR(20) DEFAULT 'active',
    user_account_id UUID REFERENCES users(id),
    manager_id UUID REFERENCES staff(id),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT staff_employment_type_check CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    CONSTRAINT staff_status_check CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave'))
);

-- Staff user links
CREATE TABLE IF NOT EXISTS staff_user_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    link_status VARCHAR(20) DEFAULT 'active',
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    unlinked_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(staff_id, user_id),
    CONSTRAINT staff_user_links_status_check CHECK (link_status IN ('active', 'inactive', 'transferred'))
);

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    supplier_id UUID REFERENCES suppliers(id),
    unit_of_measure VARCHAR(20) DEFAULT 'pcs',
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    markup_percentage DECIMAL(5,2),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER DEFAULT 0,
    weight DECIMAL(8,3),
    dimensions VARCHAR(50),
    expiry_date DATE,
    batch_number VARCHAR(100),
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_taxable BOOLEAN DEFAULT true,
    tax_rate DECIMAL(5,2) DEFAULT 12.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inventory levels by location
CREATE TABLE IF NOT EXISTS inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    reorder_point INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    last_restock_date TIMESTAMP WITH TIME ZONE,
    last_count_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_id, location_id)
);

-- Inventory movements
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    from_location_id UUID REFERENCES locations(id),
    to_location_id UUID REFERENCES locations(id),
    movement_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT inventory_movements_type_check CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment', 'return', 'damage'))
);

-- ============================================================================
-- CUSTOMER MANAGEMENT
-- ============================================================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    customer_type VARCHAR(20) DEFAULT 'individual',
    company_name VARCHAR(255),
    contact_first_name VARCHAR(100),
    contact_last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms VARCHAR(100),
    tax_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT customers_type_check CHECK (customer_type IN ('individual', 'business', 'veterinarian', 'farmer'))
);

-- ============================================================================
-- POINT OF SALE (POS) SYSTEM
-- ============================================================================

-- POS sessions
CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number VARCHAR(50) UNIQUE NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    location_id UUID REFERENCES locations(id),
    opened_by UUID REFERENCES users(id) NOT NULL,
    closed_by UUID REFERENCES users(id),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    starting_cash DECIMAL(12,2) DEFAULT 0 NOT NULL,
    ending_cash DECIMAL(12,2),
    expected_cash DECIMAL(12,2),
    cash_variance DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT pos_sessions_status_check CHECK (status IN ('open', 'closed', 'reconciled'))
);

-- Sales transactions
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    pos_session_id UUID REFERENCES pos_sessions(id),
    customer_id UUID REFERENCES customers(id),
    staff_id UUID REFERENCES staff(id),
    branch_id UUID REFERENCES branches(id),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT sales_transactions_payment_method_check CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'gcash', 'paymaya', 'bank_transfer', 'check')),
    CONSTRAINT sales_transactions_payment_status_check CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Transaction items
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- HUMAN RESOURCES
-- ============================================================================

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    break_start TIME,
    break_end TIME,
    total_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(staff_id, attendance_date),
    CONSTRAINT attendance_records_status_check CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave'))
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES staff(id),
    approved_date TIMESTAMP WITH TIME ZONE,
    emergency_contact VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT leave_requests_type_check CHECK (leave_type IN ('annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity')),
    CONSTRAINT leave_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- ============================================================================
-- PAYROLL SYSTEM
-- ============================================================================

-- Payroll periods
CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    total_employees INTEGER DEFAULT 0,
    total_gross_pay DECIMAL(12,2) DEFAULT 0,
    total_tax_amount DECIMAL(12,2) DEFAULT 0,
    total_net_pay DECIMAL(12,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT payroll_periods_type_check CHECK (period_type IN ('monthly', 'bi_weekly', 'weekly', 'custom')),
    CONSTRAINT payroll_periods_status_check CHECK (status IN ('draft', 'processing', 'review', 'approved', 'paid', 'closed'))
);

-- Payroll records
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    department VARCHAR(255),
    base_salary DECIMAL(10,2) DEFAULT 0,
    regular_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    allowances DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    sss_contribution DECIMAL(10,2) DEFAULT 0,
    philhealth_contribution DECIMAL(10,2) DEFAULT 0,
    pagibig_contribution DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(period_id, staff_id),
    CONSTRAINT payroll_records_status_check CHECK (status IN ('pending', 'reviewed', 'approved', 'paid', 'disputed'))
);

-- ============================================================================
-- MARKETING SYSTEM
-- ============================================================================

-- Marketing campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    image_url TEXT,
    cta_text VARCHAR(100),
    cta_url TEXT,
    is_active BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    publish_date TIMESTAMP WITH TIME ZONE,
    target_audience TEXT[],
    target_channels TEXT[],
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT marketing_campaigns_template_type_check CHECK (template_type IN ('hero_banner', 'promo_card', 'popup'))
);

-- Campaign analytics
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT campaign_analytics_event_type_check CHECK (event_type IN ('view', 'click', 'conversion', 'impression'))
);

-- ============================================================================
-- NOTIFICATIONS & COMMUNICATIONS
-- ============================================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(10) DEFAULT 'medium',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT notifications_channel_check CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    CONSTRAINT notifications_type_check CHECK (notification_type IN ('order_update', 'appointment', 'payment', 'promotion', 'product_alert', 'stock_alert')),
    CONSTRAINT notifications_priority_check CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT notifications_status_check CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened'))
);

-- ============================================================================
-- AUDIT & LOGGING
-- ============================================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product_id ON inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_location_id ON inventory_levels(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_customer_id ON sales_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_staff_id ON sales_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_branch_id ON sales_transactions(branch_id);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_staff_id ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(attendance_date);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Staff can see their own data and managers can see their team
CREATE POLICY "Staff can view own data" ON staff FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM staff_user_links 
        WHERE staff_id = staff.id AND link_status = 'active'
    )
);

-- Sales transactions - staff can see transactions from their branch
CREATE POLICY "Staff can view branch transactions" ON sales_transactions FOR SELECT USING (
    branch_id IN (
        SELECT branch_id FROM staff 
        JOIN staff_user_links ON staff.id = staff_user_links.staff_id 
        WHERE staff_user_links.user_id = auth.uid() AND staff_user_links.link_status = 'active'
    )
);

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default system roles
INSERT INTO roles (role_name, display_name, description, level, is_custom, is_active) VALUES
('super-admin', 'Super Administrator', 'Full system access with all permissions', 1, false, true),
('hr-admin', 'HR Administrator', 'Human resources department administrator', 2, false, true),
('marketing-admin', 'Marketing Administrator', 'Marketing department administrator', 2, false, true),
('hr-staff', 'HR Staff', 'Human resources staff member', 4, false, true),
('marketing-staff', 'Marketing Staff', 'Marketing department staff member', 4, false, true),
('cashier', 'Cashier', 'Point of sale system operator', 5, false, true),
('inventory-clerk', 'Inventory Clerk', 'Inventory and stock management staff', 5, false, true)
ON CONFLICT (role_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    updated_at = now();

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action, component, category, is_system, is_visible, is_enabled) VALUES
-- Dashboard permissions
('dashboard_access', 'Access to dashboard', 'dashboard', 'read', 'dashboard/admin', 'standard', true, true, true),
('dashboard_analytics', 'View dashboard analytics', 'dashboard', 'read', 'dashboard/analytics', 'standard', true, true, true),

-- Inventory permissions
('inventory_read', 'View inventory', 'inventory', 'read', 'inventory/management', 'standard', true, true, true),
('inventory_write', 'Manage inventory', 'inventory', 'write', 'inventory/management', 'standard', true, true, true),
('inventory_admin', 'Full inventory control', 'inventory', 'admin', 'inventory/management', 'sensitive', true, true, true),

-- Sales permissions
('sales_read', 'View sales data', 'sales', 'read', 'sales/dashboard', 'standard', true, true, true),
('sales_write', 'Process sales', 'sales', 'write', 'pos/interface', 'standard', true, true, true),
('sales_admin', 'Full sales control', 'sales', 'admin', 'sales/management', 'sensitive', true, true, true),

-- HR permissions
('hr_read', 'View HR data', 'hr', 'read', 'hr/dashboard', 'standard', true, true, true),
('hr_write', 'Manage HR records', 'hr', 'write', 'hr/staff', 'standard', true, true, true),
('hr_admin', 'Full HR control', 'hr', 'admin', 'hr/management', 'sensitive', true, true, true),
('payroll_access', 'Access payroll', 'payroll', 'read', 'hr/payroll', 'sensitive', true, true, false),

-- Marketing permissions
('marketing_read', 'View marketing data', 'marketing', 'read', 'marketing/dashboard', 'standard', true, true, true),
('marketing_write', 'Manage campaigns', 'marketing', 'write', 'marketing/campaigns', 'standard', true, true, true),
('marketing_admin', 'Full marketing control', 'marketing', 'admin', 'marketing/management', 'sensitive', true, true, true),

-- User management permissions
('users_read', 'View users', 'users', 'read', 'users/accounts', 'sensitive', true, true, true),
('users_write', 'Manage users', 'users', 'write', 'users/management', 'sensitive', true, true, true),
('users_admin', 'Full user control', 'users', 'admin', 'users/admin', 'sensitive', true, true, true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    component = EXCLUDED.component,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system,
    is_visible = EXCLUDED.is_visible,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

-- Insert default component access
INSERT INTO component_access (component_path, display_name, description, category, required_permission, is_active, is_visible, is_enabled) VALUES
-- Dashboard components
('dashboard/admin', 'Admin Dashboard', 'Main administrative dashboard', 'standard', 'dashboard_access', true, true, true),
('dashboard/hr', 'HR Dashboard', 'Human resources dashboard', 'standard', 'hr_read', true, true, true),
('dashboard/marketing', 'Marketing Dashboard', 'Marketing campaigns dashboard', 'standard', 'marketing_read', true, true, true),
('dashboard/cashier', 'Cashier Dashboard', 'Point of sale dashboard', 'standard', 'sales_write', true, true, true),
('dashboard/inventory', 'Inventory Dashboard', 'Inventory management dashboard', 'standard', 'inventory_read', true, true, true),

-- Inventory components
('inventory/management', 'Inventory Management', 'Manage product inventory', 'standard', 'inventory_write', true, true, true),
('inventory/categories', 'Product Categories', 'Manage product categories', 'standard', 'inventory_write', true, true, true),
('inventory/stock', 'Stock Levels', 'View and manage stock levels', 'standard', 'inventory_read', true, true, true),
('inventory/alerts', 'Stock Alerts', 'Low stock and reorder alerts', 'standard', 'inventory_read', true, true, true),

-- Sales components
('pos/interface', 'POS Interface', 'Point of sale system', 'standard', 'sales_write', true, true, true),
('sales/dashboard', 'Sales Dashboard', 'Sales analytics and reports', 'standard', 'sales_read', true, true, true),
('sales/transactions', 'Sales Transactions', 'View sales transaction history', 'standard', 'sales_read', true, true, true),

-- HR components
('hr/staff', 'Staff Management', 'Manage staff members', 'standard', 'hr_write', true, true, true),
('hr/attendance', 'Attendance Tracking', 'Track staff attendance', 'standard', 'hr_write', true, true, true),
('hr/payroll', 'Payroll Management', 'Manage payroll and compensation', 'sensitive', 'payroll_access', true, true, false),
('hr/leave', 'Leave Management', 'Manage leave requests', 'standard', 'hr_write', true, true, true),

-- Marketing components
('marketing/campaigns', 'Campaign Management', 'Create and manage marketing campaigns', 'standard', 'marketing_write', true, true, true),
('marketing/analytics', 'Marketing Analytics', 'View campaign performance', 'standard', 'marketing_read', true, true, true),
('marketing/templates', 'Template Management', 'Manage campaign templates', 'standard', 'marketing_write', true, true, true),

-- User management components
('users/accounts', 'User Accounts', 'Manage user accounts', 'sensitive', 'users_read', true, true, true),
('users/permissions', 'Permission Management', 'Manage user permissions', 'sensitive', 'users_admin', true, true, true)
ON CONFLICT (component_path) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    required_permission = EXCLUDED.required_permission,
    is_active = EXCLUDED.is_active,
    is_visible = EXCLUDED.is_visible,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

-- Insert default app settings
INSERT INTO app_settings (app_name, company_name, contact_email, currency, timezone) VALUES
('AgriVet Management System', 'AgriVet Supply Co.', 'admin@agrivet.com', 'PHP', 'Asia/Manila')
ON CONFLICT (id) DO UPDATE SET
    app_name = EXCLUDED.app_name,
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    currency = EXCLUDED.currency,
    timezone = EXCLUDED.timezone,
    updated_at = now();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, is_public) VALUES
('company_name', 'AgriVet Supply Co.', 'general', 'Company name displayed throughout the system', true),
('currency', 'PHP', 'general', 'Default currency for all transactions', true),
('timezone', 'Asia/Manila', 'general', 'Default timezone for the system', true),
('tax_rate', '12.00', 'financial', 'Default tax rate percentage', false),
('low_stock_threshold', '10', 'inventory', 'Default low stock alert threshold', false),
('session_timeout', '30', 'security', 'User session timeout in minutes', false)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    setting_category = EXCLUDED.setting_category,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = now();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user permissions
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

-- Function to get user accessible components
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

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = user_uuid 
        AND ur.is_active = true 
        AND rp.is_granted = true
        AND p.name = permission_name
        AND p.is_visible = true
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant permissions to Supabase roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Grant default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'System users with authentication and profile information';
COMMENT ON TABLE roles IS 'User roles with hierarchical permissions';
COMMENT ON TABLE permissions IS 'Granular permissions for system access control';
COMMENT ON TABLE staff IS 'Staff members with employment information';
COMMENT ON TABLE products IS 'Product catalog with pricing and inventory data';
COMMENT ON TABLE sales_transactions IS 'Point of sale transaction records';
COMMENT ON TABLE inventory_levels IS 'Current stock levels by location';
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaign management';
COMMENT ON TABLE payroll_records IS 'Individual payroll records per period';

COMMENT ON COLUMN roles.level IS 'Hierarchy level: 1=highest (super-admin), higher numbers=lower access';
COMMENT ON COLUMN permissions.category IS 'Permission visibility: sensitive=hidden, upgradeable=shown with upgrade message, standard=normal';
COMMENT ON COLUMN inventory_levels.quantity_available IS 'Computed column: quantity_on_hand - quantity_reserved';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
INSERT INTO system_settings (setting_key, setting_value, setting_category, description) VALUES
('schema_version', '20250125000000', 'system', 'Current database schema version'),
('migration_completed', now()::text, 'system', 'Last comprehensive schema migration completion time')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
