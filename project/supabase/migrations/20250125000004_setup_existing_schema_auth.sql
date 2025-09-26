 -- Setup Authentication for Existing Schema
-- This migration sets up roles and user_roles for your existing database schema
-- Date: 2025-01-25
-- Description: Configure roles and user-role relationships for hybrid auth

-- ============================================================================
-- ROLES SETUP
-- ============================================================================

-- Insert system roles if they don't exist
INSERT INTO roles (id, name, display_name, description, is_active, is_system_role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'super-admin', 'Super Administrator', 'Full system access with all permissions', true, true),
    ('00000000-0000-0000-0000-000000000002', 'hr-admin', 'HR Administrator', 'Human Resources management and staff oversight', true, true),
    ('00000000-0000-0000-0000-000000000003', 'hr-staff', 'HR Staff', 'HR operations and employee support', true, true),
    ('00000000-0000-0000-0000-000000000004', 'marketing-admin', 'Marketing Administrator', 'Marketing campaigns and strategy management', true, true),
    ('00000000-0000-0000-0000-000000000005', 'marketing-staff', 'Marketing Staff', 'Marketing operations and content creation', true, true),
    ('00000000-0000-0000-0000-000000000006', 'cashier', 'Cashier', 'Point of Sale operations and sales', true, true),
    ('00000000-0000-0000-0000-000000000007', 'inventory-clerk', 'Inventory Clerk', 'Inventory management and stock control', true, true),
    ('00000000-0000-0000-0000-000000000008', 'kiosk', 'Kiosk User', 'Public kiosk interface access', true, true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    is_system_role = EXCLUDED.is_system_role,
    updated_at = now();

-- ============================================================================
-- USER_ROLES SETUP
-- ============================================================================

-- Create a function to assign default roles to existing users
CREATE OR REPLACE FUNCTION assign_default_roles_to_existing_users()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    default_role_id UUID;
BEGIN
    -- Get the default role ID (super-admin for now, you can change this)
    SELECT id INTO default_role_id FROM roles WHERE name = 'super-admin' LIMIT 1;
    
    -- Assign default role to all existing users who don't have any roles
    FOR user_record IN 
        SELECT u.id 
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id 
        WHERE ur.user_id IS NULL
    LOOP
        INSERT INTO user_roles (user_id, role_id, assigned_at)
        VALUES (user_record.id, default_role_id, now())
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to assign default roles
SELECT assign_default_roles_to_existing_users();

-- Drop the temporary function
DROP FUNCTION assign_default_roles_to_existing_users();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Create a function to get user with role information
CREATE OR REPLACE FUNCTION get_user_with_role(user_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    branch_id UUID,
    is_active BOOLEAN,
    last_login TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
    current_session_id UUID,
    timezone VARCHAR(50),
    preferred_language VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    role_id UUID,
    role_name VARCHAR(50),
    role_display_name TEXT,
    role_description TEXT,
    role_is_active BOOLEAN,
    role_is_system_role BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.branch_id,
        u.is_active,
        u.last_login,
        u.last_activity,
        u.status,
        u.current_session_id,
        u.timezone,
        u.preferred_language,
        u.created_at,
        u.updated_at,
        r.id as role_id,
        r.name as role_name,
        r.display_name as role_display_name,
        r.description as role_description,
        r.is_active as role_is_active,
        r.is_system_role as role_is_system_role
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.email = user_email
    AND u.is_active = true
    AND r.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user's primary role
CREATE OR REPLACE FUNCTION get_user_primary_role(user_id UUID)
RETURNS TABLE (
    role_id UUID,
    role_name VARCHAR(50),
    role_display_name TEXT,
    role_description TEXT,
    role_is_active BOOLEAN,
    role_is_system_role BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_active,
        r.is_system_role
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id
    AND r.is_active = true
    ORDER BY ur.assigned_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.name IN ('super-admin', 'hr-admin')
        )
    );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at ON user_roles(assigned_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_user_with_role IS 'Get user data with role information by email';
COMMENT ON FUNCTION get_user_primary_role IS 'Get primary role for a user by ID';
COMMENT ON TABLE user_roles IS 'Junction table for user-role many-to-many relationships';

-- ============================================================================
-- SAMPLE DATA (Optional)
-- ============================================================================

-- You can uncomment this section to create sample users with different roles
-- for testing purposes

/*
-- Create sample users (uncomment if needed)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@agrivet.com', crypt('admin123', gen_salt('bf')), now(), now(), now()),
    ('22222222-2222-2222-2222-222222222222', 'hr@agrivet.com', crypt('hr123', gen_salt('bf')), now(), now(), now()),
    ('33333333-3333-3333-3333-333333333333', 'cashier@agrivet.com', crypt('cashier123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create corresponding user profiles
INSERT INTO users (id, email, first_name, last_name, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@agrivet.com', 'Admin', 'User', true),
    ('22222222-2222-2222-2222-222222222222', 'hr@agrivet.com', 'HR', 'Manager', true),
    ('33333333-3333-3333-3333-333333333333', 'cashier@agrivet.com', 'Cashier', 'Staff', true)
ON CONFLICT (id) DO NOTHING;

-- Assign roles to sample users
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', now()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', now()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000006', now())
ON CONFLICT (user_id, role_id) DO NOTHING;
*/
