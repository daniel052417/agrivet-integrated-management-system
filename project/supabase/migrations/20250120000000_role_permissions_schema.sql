-- Role Permissions Schema Migration
-- This migration creates tables for role-based permissions management

-- Create role_permissions table to store role-specific permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role_id, module)
);

-- Insert default system roles (if they don't exist)
INSERT INTO roles (role_name, description) VALUES
    ('admin', 'Full system access with all permissions'),
    ('manager', 'Department or branch management access'),
    ('cashier', 'Point of sale and sales access'),
    ('hr', 'Human resources and staff management'),
    ('marketing', 'Marketing and promotional activities'),
    ('inventory', 'Inventory and stock management'),
    ('user', 'Basic user access')
ON CONFLICT (role_name) DO NOTHING;

-- Insert default permissions for system roles with proper role_id references
INSERT INTO role_permissions (role_id, role_name, module, can_view, can_edit, can_delete)
SELECT 
    r.role_id,
    r.role_name,
    p.module,
    p.can_view,
    p.can_edit,
    p.can_delete
FROM roles r
CROSS JOIN (
    VALUES 
        -- Admin permissions (full access)
        ('admin', 'dashboard', true, true, true),
        ('admin', 'sales', true, true, true),
        ('admin', 'inventory', true, true, true),
        ('admin', 'staff', true, true, true),
        ('admin', 'reports', true, true, true),
        ('admin', 'settings', true, true, true),
        
        -- Manager permissions
        ('manager', 'dashboard', true, true, false),
        ('manager', 'sales', true, true, false),
        ('manager', 'inventory', true, true, false),
        ('manager', 'staff', true, true, false),
        ('manager', 'reports', true, true, false),
        ('manager', 'settings', false, false, false),
        
        -- Cashier permissions
        ('cashier', 'dashboard', true, false, false),
        ('cashier', 'sales', true, true, false),
        ('cashier', 'inventory', true, false, false),
        ('cashier', 'staff', false, false, false),
        ('cashier', 'reports', true, false, false),
        ('cashier', 'settings', false, false, false),
        
        -- HR permissions
        ('hr', 'dashboard', true, false, false),
        ('hr', 'sales', false, false, false),
        ('hr', 'inventory', false, false, false),
        ('hr', 'staff', true, true, true),
        ('hr', 'reports', true, false, false),
        ('hr', 'settings', false, false, false),
        
        -- Marketing permissions
        ('marketing', 'dashboard', true, false, false),
        ('marketing', 'sales', true, false, false),
        ('marketing', 'inventory', true, false, false),
        ('marketing', 'staff', false, false, false),
        ('marketing', 'reports', true, true, false),
        ('marketing', 'settings', false, false, false),
        
        -- Inventory permissions
        ('inventory', 'dashboard', true, false, false),
        ('inventory', 'sales', false, false, false),
        ('inventory', 'inventory', true, true, true),
        ('inventory', 'staff', false, false, false),
        ('inventory', 'reports', true, false, false),
        ('inventory', 'settings', false, false, false),
        
        -- User permissions (minimal access)
        ('user', 'dashboard', true, false, false),
        ('user', 'sales', false, false, false),
        ('user', 'inventory', false, false, false),
        ('user', 'staff', false, false, false),
        ('user', 'reports', false, false, false),
        ('user', 'settings', false, false, false)
) AS p(role_name, module, can_view, can_edit, can_delete)
WHERE r.role_name = p.role_name
ON CONFLICT (role_id, module) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON role_permissions(module);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
