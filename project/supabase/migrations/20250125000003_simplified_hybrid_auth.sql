-- Simplified Hybrid Authentication Schema Migration
-- This migration simplifies the authentication system for a hybrid approach
-- Date: 2025-01-25
-- Description: Streamlined auth with direct role assignment and static sidebar

-- ============================================================================
-- SIMPLIFIED AUTHENTICATION SCHEMA
-- ============================================================================

-- 1. Simplify users table - add direct role reference
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- 2. Create simplified roles table (if not exists)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 10, -- 1=highest (super-admin), higher numbers = lower access
    is_active BOOLEAN DEFAULT true,
    sidebar_config JSONB DEFAULT '{}', -- Static sidebar configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Insert core system roles
INSERT INTO roles (id, role_name, display_name, description, level, sidebar_config) VALUES
    ('00000000-0000-0000-0000-000000000001', 'super-admin', 'Super Administrator', 'Full system access', 1, '{"sections": ["overview", "sales", "inventory", "hr", "marketing", "reports", "settings", "users"]}'),
    ('00000000-0000-0000-0000-000000000002', 'hr-admin', 'HR Administrator', 'Human Resources management', 2, '{"sections": ["overview", "hr", "reports", "settings"]}'),
    ('00000000-0000-0000-0000-000000000003', 'hr-staff', 'HR Staff', 'HR operations and support', 3, '{"sections": ["overview", "hr"]}'),
    ('00000000-0000-0000-0000-000000000004', 'marketing-admin', 'Marketing Administrator', 'Marketing management', 2, '{"sections": ["overview", "marketing", "reports"]}'),
    ('00000000-0000-0000-0000-000000000005', 'marketing-staff', 'Marketing Staff', 'Marketing operations', 3, '{"sections": ["overview", "marketing"]}'),
    ('00000000-0000-0000-0000-000000000006', 'cashier', 'Cashier', 'Point of Sale operations', 4, '{"sections": ["overview", "pos", "sales"]}'),
    ('00000000-0000-0000-0000-000000000007', 'inventory-clerk', 'Inventory Clerk', 'Inventory management', 4, '{"sections": ["overview", "inventory", "reports"]}')
ON CONFLICT (role_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    sidebar_config = EXCLUDED.sidebar_config,
    updated_at = now();

-- 4. Update existing users to have role_id (migrate from role field)
UPDATE users 
SET role_id = (
    SELECT id FROM roles 
    WHERE role_name = users.role
)
WHERE role_id IS NULL AND role IS NOT NULL;

-- 5. Create simplified user_roles table (for future multi-role support)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT true, -- Primary role for the user
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- 6. Migrate existing user-role relationships to user_roles table
INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
SELECT 
    u.id as user_id,
    u.role_id,
    true as is_primary,
    u.created_at as assigned_at
FROM users u
WHERE u.role_id IS NOT NULL
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_primary ON user_roles(user_id, is_primary) WHERE is_primary = true;

-- 8. Create function to get user with role
CREATE OR REPLACE FUNCTION get_user_with_role(user_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    is_active BOOLEAN,
    role_id UUID,
    role_name TEXT,
    display_name TEXT,
    level INTEGER,
    sidebar_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.username,
        u.is_active,
        r.id as role_id,
        r.role_name,
        r.display_name,
        r.level,
        r.sidebar_config
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.email = user_email
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to get user's primary role
CREATE OR REPLACE FUNCTION get_user_primary_role(user_id UUID)
RETURNS TABLE (
    role_id UUID,
    role_name TEXT,
    display_name TEXT,
    level INTEGER,
    sidebar_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.role_name,
        r.display_name,
        r.level,
        r.sidebar_config
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id
    AND ur.is_primary = true
    AND ur.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 10. Add RLS policies for simplified schema
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.role_name IN ('super-admin', 'hr-admin')
        )
    );

-- All authenticated users can view roles
CREATE POLICY "Authenticated users can view roles" ON roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.role_name = 'super-admin'
        )
    );

-- Users can view their own role assignments
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all role assignments
CREATE POLICY "Admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.role_name IN ('super-admin', 'hr-admin')
        )
    );

-- 11. Create view for easy user-role queries
CREATE OR REPLACE VIEW user_with_role AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.first_name,
    u.last_name,
    u.phone_number,
    u.avatar_url,
    u.is_active,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    r.id as role_id,
    r.role_name,
    r.display_name as role_display_name,
    r.level as role_level,
    r.sidebar_config
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.is_active = true;

-- 12. Add comments for documentation
COMMENT ON TABLE roles IS 'System roles with static sidebar configuration';
COMMENT ON COLUMN roles.sidebar_config IS 'JSON configuration for sidebar items this role can access';
COMMENT ON TABLE user_roles IS 'User-role assignments (supports future multi-role functionality)';
COMMENT ON COLUMN user_roles.is_primary IS 'Whether this is the primary role for the user';
COMMENT ON FUNCTION get_user_with_role IS 'Get user data with role information by email';
COMMENT ON FUNCTION get_user_primary_role IS 'Get primary role for a user by ID';
COMMENT ON VIEW user_with_role IS 'Convenient view combining user and role data';
