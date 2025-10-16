-- Fixed Comprehensive Permissions System Migration
-- This migration sets up a complete role-based permissions system

-- 1. Alter existing roles table to add missing columns
ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name VARCHAR(150);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 10;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing roles with display names and levels
UPDATE roles SET display_name = 'Super Administrator', level = 1 WHERE role_name = 'admin';
UPDATE roles SET display_name = 'Manager', level = 3 WHERE role_name = 'manager';
UPDATE roles SET display_name = 'Cashier', level = 5 WHERE role_name = 'cashier';
UPDATE roles SET display_name = 'HR Administrator', level = 2 WHERE role_name = 'hr';
UPDATE roles SET display_name = 'Marketing Administrator', level = 2 WHERE role_name = 'marketing';
UPDATE roles SET display_name = 'Inventory Clerk', level = 5 WHERE role_name = 'inventory';
UPDATE roles SET display_name = 'Basic User', level = 10 WHERE role_name = 'user';

-- Add new roles that don't exist
INSERT INTO roles (role_name, display_name, description, level, is_custom, is_active) VALUES
    ('super-admin', 'Super Administrator', 'Full system access with all permissions', 1, false, true),
    ('hr-admin', 'HR Administrator', 'Human resources department administrator', 2, false, true),
    ('marketing-admin', 'Marketing Administrator', 'Marketing department administrator', 2, false, true),
    ('hr-staff', 'HR Staff', 'Human resources staff member', 4, false, true),
    ('marketing-staff', 'Marketing Staff', 'Marketing department staff member', 4, false, true),
    ('inventory-clerk', 'Inventory Clerk', 'Inventory and stock management staff', 5, false, true)
ON CONFLICT (role_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    updated_at = now();

-- 2. Create new permissions table (replacing the old one)
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- 'inventory', 'sales', 'hr', 'marketing', 'pos', 'reports', 'settings'
    action VARCHAR(50) NOT NULL,   -- 'read', 'write', 'delete', 'admin', 'create', 'update'
    component VARCHAR(200),        -- Component path for dynamic loading
    category VARCHAR(20) DEFAULT 'standard' CHECK (category IN ('sensitive', 'upgradeable', 'standard')),
    is_system BOOLEAN DEFAULT false, -- System-defined permissions cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create new role_permissions junction table (replacing the old one)
DROP TABLE IF EXISTS role_permissions CASCADE;
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    granted_by UUID,
    UNIQUE(role_id, permission_id)
);

-- 4. Create new user_roles table (replacing the old one)
DROP TABLE IF EXISTS user_roles CASCADE;
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id)
);

-- 5. Create component_access table for dynamic component loading
CREATE TABLE IF NOT EXISTS component_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_path VARCHAR(200) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(20) DEFAULT 'standard' CHECK (category IN ('sensitive', 'upgradeable', 'standard')),
    required_permission VARCHAR(100),
    required_role VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Insert system permissions
INSERT INTO permissions (name, description, resource, action, component, category, is_system) VALUES
    -- Dashboard permissions
    ('dashboard.view', 'View dashboard', 'dashboard', 'read', 'dashboard/admin', 'standard', true),
    ('dashboard.hr.view', 'View HR dashboard', 'dashboard', 'read', 'dashboard/hr', 'standard', true),
    ('dashboard.marketing.view', 'View marketing dashboard', 'dashboard', 'read', 'dashboard/marketing', 'standard', true),
    ('dashboard.cashier.view', 'View cashier dashboard', 'dashboard', 'read', 'dashboard/cashier', 'standard', true),
    ('dashboard.inventory.view', 'View inventory dashboard', 'dashboard', 'read', 'dashboard/inventory', 'standard', true),
    
    -- Inventory permissions
    ('inventory.view', 'View inventory', 'inventory', 'read', 'inventory/management', 'standard', true),
    ('inventory.create', 'Create inventory items', 'inventory', 'create', 'inventory/management', 'standard', true),
    ('inventory.update', 'Update inventory items', 'inventory', 'update', 'inventory/management', 'standard', true),
    ('inventory.delete', 'Delete inventory items', 'inventory', 'delete', 'inventory/management', 'sensitive', true),
    ('inventory.admin', 'Full inventory management', 'inventory', 'admin', 'inventory/management', 'sensitive', true),
    ('inventory.categories', 'Manage categories', 'inventory', 'admin', 'inventory/categories', 'standard', true),
    ('inventory.alerts', 'Manage stock alerts', 'inventory', 'write', 'inventory/alerts', 'standard', true),
    
    -- Sales permissions
    ('sales.view', 'View sales data', 'sales', 'read', 'sales/dashboard', 'standard', true),
    ('sales.create', 'Create sales transactions', 'sales', 'create', 'sales/transactions', 'standard', true),
    ('sales.update', 'Update sales transactions', 'sales', 'update', 'sales/transactions', 'standard', true),
    ('sales.delete', 'Delete sales transactions', 'sales', 'delete', 'sales/transactions', 'sensitive', true),
    ('sales.admin', 'Full sales management', 'sales', 'admin', 'sales/dashboard', 'sensitive', true),
    ('sales.customers', 'Manage customers', 'sales', 'admin', 'sales/customers', 'standard', true),
    
    -- HR permissions
    ('hr.view', 'View HR data', 'hr', 'read', 'hr/dashboard', 'standard', true),
    ('hr.staff.view', 'View staff information', 'hr', 'read', 'hr/staff', 'standard', true),
    ('hr.staff.create', 'Create staff records', 'hr', 'create', 'hr/staff', 'sensitive', true),
    ('hr.staff.update', 'Update staff records', 'hr', 'update', 'hr/staff', 'sensitive', true),
    ('hr.staff.delete', 'Delete staff records', 'hr', 'delete', 'hr/staff', 'sensitive', true),
    ('hr.admin', 'Full HR management', 'hr', 'admin', 'hr/dashboard', 'sensitive', true),
    ('hr.attendance', 'Manage attendance', 'hr', 'admin', 'hr/attendance', 'standard', true),
    ('hr.payroll', 'Manage payroll', 'hr', 'admin', 'hr/payroll', 'sensitive', true),
    ('hr.leave', 'Manage leave requests', 'hr', 'admin', 'hr/leave', 'standard', true),
    
    -- Marketing permissions
    ('marketing.view', 'View marketing data', 'marketing', 'read', 'marketing/dashboard', 'standard', true),
    ('marketing.campaigns.view', 'View campaigns', 'marketing', 'read', 'marketing/campaigns', 'standard', true),
    ('marketing.campaigns.create', 'Create campaigns', 'marketing', 'create', 'marketing/campaigns', 'standard', true),
    ('marketing.campaigns.update', 'Update campaigns', 'marketing', 'update', 'marketing/campaigns', 'standard', true),
    ('marketing.campaigns.delete', 'Delete campaigns', 'marketing', 'delete', 'marketing/campaigns', 'sensitive', true),
    ('marketing.admin', 'Full marketing management', 'marketing', 'admin', 'marketing/dashboard', 'sensitive', true),
    ('marketing.analytics', 'View marketing analytics', 'marketing', 'read', 'marketing/analytics', 'standard', true),
    ('marketing.templates', 'Manage templates', 'marketing', 'admin', 'marketing/templates', 'standard', true),
    ('marketing.notifications', 'Send notifications', 'marketing', 'create', 'marketing/notifications', 'standard', true),
    
    -- POS permissions
    ('pos.view', 'View POS interface', 'pos', 'read', 'pos/interface', 'standard', true),
    ('pos.transactions', 'Process transactions', 'pos', 'create', 'pos/transactions', 'standard', true),
    ('pos.payments', 'Process payments', 'pos', 'create', 'pos/payments', 'standard', true),
    ('pos.receipts', 'Generate receipts', 'pos', 'create', 'pos/receipts', 'standard', true),
    ('pos.admin', 'Full POS management', 'pos', 'admin', 'pos/interface', 'sensitive', true),
    
    -- Reports permissions
    ('reports.view', 'View reports', 'reports', 'read', 'reports/dashboard', 'standard', true),
    ('reports.sales', 'View sales reports', 'reports', 'read', 'reports/sales', 'standard', true),
    ('reports.inventory', 'View inventory reports', 'reports', 'read', 'reports/inventory', 'standard', true),
    ('reports.hr', 'View HR reports', 'reports', 'read', 'reports/hr', 'sensitive', true),
    ('reports.financial', 'View financial reports', 'reports', 'read', 'reports/financial', 'sensitive', true),
    ('reports.admin', 'Full reports access', 'reports', 'admin', 'reports/dashboard', 'sensitive', true),
    
    -- Settings permissions
    ('settings.view', 'View settings', 'settings', 'read', 'settings/dashboard', 'sensitive', true),
    ('settings.users', 'Manage users', 'settings', 'admin', 'settings/users', 'sensitive', true),
    ('settings.permissions', 'Manage permissions', 'settings', 'admin', 'settings/permissions', 'sensitive', true),
    ('settings.system', 'System settings', 'settings', 'admin', 'settings/system', 'sensitive', true),
    ('settings.branch', 'Branch settings', 'settings', 'admin', 'settings/branch', 'sensitive', true),
    ('settings.admin', 'Full settings access', 'settings', 'admin', 'settings/dashboard', 'sensitive', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    component = EXCLUDED.component,
    category = EXCLUDED.category,
    updated_at = now();

-- 7. Insert component access definitions
INSERT INTO component_access (component_path, display_name, description, category, required_permission, required_role) VALUES
    -- Dashboard components
    ('dashboard/admin', 'Admin Dashboard', 'Administrative dashboard with full system overview', 'sensitive', 'dashboard.view', 'super-admin'),
    ('dashboard/hr', 'HR Dashboard', 'Human resources dashboard', 'standard', 'dashboard.hr.view', 'hr-admin'),
    ('dashboard/marketing', 'Marketing Dashboard', 'Marketing department dashboard', 'standard', 'dashboard.marketing.view', 'marketing-admin'),
    ('dashboard/cashier', 'Cashier Dashboard', 'Point of sale dashboard', 'standard', 'dashboard.cashier.view', 'cashier'),
    ('dashboard/inventory', 'Inventory Dashboard', 'Inventory management dashboard', 'standard', 'dashboard.inventory.view', 'inventory-clerk'),
    
    -- Inventory components
    ('inventory/management', 'Inventory Management', 'Main inventory management interface', 'standard', 'inventory.view', 'inventory-clerk'),
    ('inventory/categories', 'Product Categories', 'Manage product categories', 'standard', 'inventory.categories', 'inventory-clerk'),
    ('inventory/alerts', 'Stock Alerts', 'Manage low stock alerts', 'standard', 'inventory.alerts', 'inventory-clerk'),
    
    -- Sales components
    ('sales/dashboard', 'Sales Dashboard', 'Sales overview and analytics', 'standard', 'sales.view', 'cashier'),
    ('sales/transactions', 'Sales Transactions', 'Manage sales transactions', 'standard', 'sales.create', 'cashier'),
    ('sales/customers', 'Customer Management', 'Manage customer information', 'standard', 'sales.customers', 'cashier'),
    
    -- HR components
    ('hr/dashboard', 'HR Dashboard', 'Human resources management dashboard', 'sensitive', 'hr.view', 'hr-admin'),
    ('hr/staff', 'Staff Management', 'Manage staff members and records', 'sensitive', 'hr.staff.view', 'hr-admin'),
    ('hr/attendance', 'Attendance Management', 'Track and manage attendance', 'standard', 'hr.attendance', 'hr-staff'),
    ('hr/payroll', 'Payroll Management', 'Manage payroll and compensation', 'sensitive', 'hr.payroll', 'hr-admin'),
    ('hr/leave', 'Leave Management', 'Manage leave requests and approvals', 'standard', 'hr.leave', 'hr-staff'),
    
    -- Marketing components
    ('marketing/dashboard', 'Marketing Dashboard', 'Marketing department dashboard', 'standard', 'marketing.view', 'marketing-admin'),
    ('marketing/campaigns', 'Campaign Management', 'Create and manage marketing campaigns', 'standard', 'marketing.campaigns.view', 'marketing-staff'),
    ('marketing/analytics', 'Marketing Analytics', 'View marketing performance analytics', 'standard', 'marketing.analytics', 'marketing-staff'),
    ('marketing/templates', 'Template Management', 'Manage marketing templates', 'standard', 'marketing.templates', 'marketing-staff'),
    ('marketing/notifications', 'Client Notifications', 'Send notifications to clients', 'standard', 'marketing.notifications', 'marketing-staff'),
    
    -- POS components
    ('pos/interface', 'POS Interface', 'Point of sale system interface', 'standard', 'pos.view', 'cashier'),
    ('pos/transactions', 'Transaction Processing', 'Process sales transactions', 'standard', 'pos.transactions', 'cashier'),
    ('pos/payments', 'Payment Processing', 'Handle payment processing', 'standard', 'pos.payments', 'cashier'),
    ('pos/receipts', 'Receipt Generation', 'Generate and print receipts', 'standard', 'pos.receipts', 'cashier'),
    
    -- Reports components
    ('reports/dashboard', 'Reports Dashboard', 'Main reports interface', 'standard', 'reports.view', 'manager'),
    ('reports/sales', 'Sales Reports', 'Generate sales reports', 'standard', 'reports.sales', 'cashier'),
    ('reports/inventory', 'Inventory Reports', 'Generate inventory reports', 'standard', 'reports.inventory', 'inventory-clerk'),
    ('reports/hr', 'HR Reports', 'Generate HR reports', 'sensitive', 'reports.hr', 'hr-admin'),
    ('reports/financial', 'Financial Reports', 'Generate financial reports', 'sensitive', 'reports.financial', 'super-admin'),
    
    -- Settings components
    ('settings/dashboard', 'Settings Dashboard', 'System settings interface', 'sensitive', 'settings.view', 'super-admin'),
    ('settings/users', 'User Management', 'Manage system users', 'sensitive', 'settings.users', 'super-admin'),
    ('settings/permissions', 'Permission Management', 'Manage roles and permissions', 'sensitive', 'settings.permissions', 'super-admin'),
    ('settings/system', 'System Settings', 'Configure system parameters', 'sensitive', 'settings.system', 'super-admin'),
    ('settings/branch', 'Branch Settings', 'Manage branch configurations', 'sensitive', 'settings.branch', 'super-admin')
ON CONFLICT (component_path) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    required_permission = EXCLUDED.required_permission,
    required_role = EXCLUDED.required_role,
    updated_at = now();

-- 8. Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'super-admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin gets all permissions (for backward compatibility)
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR Admin permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'hr-admin'
AND p.resource IN ('dashboard', 'hr', 'reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Marketing Admin permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'marketing-admin'
AND p.resource IN ('dashboard', 'marketing', 'reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'manager'
AND p.resource IN ('dashboard', 'sales', 'inventory', 'reports')
AND p.action IN ('read', 'write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR Staff permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'hr-staff'
AND p.resource IN ('dashboard', 'hr')
AND p.action IN ('read', 'write')
AND p.name NOT IN ('hr.payroll', 'hr.staff.create', 'hr.staff.delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Marketing Staff permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'marketing-staff'
AND p.resource IN ('dashboard', 'marketing')
AND p.action IN ('read', 'write', 'create', 'update')
AND p.name NOT IN ('marketing.campaigns.delete', 'marketing.admin')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Cashier permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'cashier'
AND p.resource IN ('dashboard', 'pos', 'sales', 'reports')
AND p.action IN ('read', 'write', 'create', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Inventory Clerk permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'inventory-clerk'
AND p.resource IN ('dashboard', 'inventory', 'reports')
AND p.action IN ('read', 'write', 'create', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Basic User permissions (minimal)
INSERT INTO role_permissions (role_id, permission_id, is_granted, granted_by)
SELECT 
    r.role_id,
    p.id,
    true,
    NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'user'
AND p.resource = 'dashboard'
AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_component_access_path ON component_access(component_path);
CREATE INDEX IF NOT EXISTS idx_component_access_category ON component_access(category);

-- 10. Create function to get user permissions
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
    SELECT 
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
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND rp.is_granted = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now());
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to get user accessible components
CREATE OR REPLACE FUNCTION get_user_accessible_components(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    component_path VARCHAR(200),
    display_name VARCHAR(150),
    description TEXT,
    category VARCHAR(20),
    required_permission VARCHAR(100),
    required_role VARCHAR(100),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    has_access BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.component_path,
        ca.display_name,
        ca.description,
        ca.category,
        ca.required_permission,
        ca.required_role,
        ca.is_active,
        ca.created_at,
        ca.updated_at,
        CASE 
            WHEN ca.required_permission IS NULL THEN true
            WHEN EXISTS (
                SELECT 1 FROM get_user_permissions(user_uuid) up 
                WHERE up.name = ca.required_permission
            ) THEN true
            ELSE false
        END as has_access
    FROM component_access ca
    WHERE ca.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM get_user_permissions(user_uuid) 
        WHERE name = user_has_permission.permission_name
    );
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to check if user can access component
CREATE OR REPLACE FUNCTION user_can_access_component(user_uuid UUID, component_path VARCHAR(200))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM get_user_accessible_components(user_uuid) 
        WHERE component_path = user_can_access_component.component_path
        AND has_access = true
    );
END;
$$ LANGUAGE plpgsql;

-- 14. Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_access ENABLE ROW LEVEL SECURITY;

-- 15. Create RLS policies
-- Roles table policies
CREATE POLICY "Users can view active roles" ON roles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = auth.uid()
            AND r.role_name IN ('super-admin', 'admin', 'hr-admin', 'marketing-admin')
            AND ur.is_active = true
        )
    );

-- Permissions table policies
CREATE POLICY "Users can view permissions" ON permissions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage permissions" ON permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = auth.uid()
            AND r.role_name IN ('super-admin', 'admin')
            AND ur.is_active = true
        )
    );

-- Role permissions table policies
CREATE POLICY "Users can view role permissions" ON role_permissions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage role permissions" ON role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = auth.uid()
            AND r.role_name IN ('super-admin', 'admin')
            AND ur.is_active = true
        )
    );

-- User roles table policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = auth.uid()
            AND r.role_name IN ('super-admin', 'admin', 'hr-admin', 'marketing-admin')
            AND ur.is_active = true
        )
    );

-- Component access table policies
CREATE POLICY "Users can view component access" ON component_access
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage component access" ON component_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = auth.uid()
            AND r.role_name IN ('super-admin', 'admin')
            AND ur.is_active = true
        )
    );

-- 16. Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_access_updated_at BEFORE UPDATE ON component_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Add comments for documentation
COMMENT ON TABLE roles IS 'System roles with hierarchical access levels';
COMMENT ON TABLE permissions IS 'Individual permissions that can be granted to roles';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE user_roles IS 'User role assignments with expiration support';
COMMENT ON TABLE component_access IS 'Component access definitions for dynamic loading';

COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Returns all permissions for a specific user';
COMMENT ON FUNCTION get_user_accessible_components(UUID) IS 'Returns all components accessible to a user';
COMMENT ON FUNCTION user_has_permission(UUID, VARCHAR) IS 'Checks if a user has a specific permission';
COMMENT ON FUNCTION user_can_access_component(UUID, VARCHAR) IS 'Checks if a user can access a specific component';





























