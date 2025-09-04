-- Staff-User Account Integration Migration
-- This migration enhances the existing schema to support staff-user account linking

-- 1. Add user_account_id to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS user_account_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add staff_id to users table  
ALTER TABLE users
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- 3. Create staff_user_links table for tracking relationships
CREATE TABLE IF NOT EXISTS staff_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  link_status VARCHAR(20) DEFAULT 'active' CHECK (link_status IN ('active', 'inactive', 'transferred')),
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unlinked_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(staff_id, user_id)
);

-- 4. Create account_creation_workflow table for tracking account creation process
CREATE TABLE IF NOT EXISTS account_creation_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  workflow_status VARCHAR(20) DEFAULT 'pending' CHECK (workflow_status IN ('pending', 'in_progress', 'completed', 'failed')),
  account_creation_method VARCHAR(20) CHECK (account_creation_method IN ('manual', 'email_invite', 'auto_create')),
  email_invite_sent_at TIMESTAMP WITH TIME ZONE,
  account_created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create user_account_audit table for tracking account operations
CREATE TABLE IF NOT EXISTS user_account_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email VARCHAR(255),
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate', 'suspend', 'link', 'unlink', 'transfer')),
  target_user_email VARCHAR(255) NOT NULL,
  target_user_id UUID,
  target_staff_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create email_invitations table for account creation invitations
CREATE TABLE IF NOT EXISTS email_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_user_account_id ON staff(user_account_id);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_links_staff_id ON staff_user_links(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_links_user_id ON staff_user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_links_status ON staff_user_links(link_status);
CREATE INDEX IF NOT EXISTS idx_account_creation_workflow_staff_id ON account_creation_workflow(staff_id);
CREATE INDEX IF NOT EXISTS idx_account_creation_workflow_status ON account_creation_workflow(workflow_status);
CREATE INDEX IF NOT EXISTS idx_user_account_audit_target_user_id ON user_account_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_account_audit_created_at ON user_account_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_email_invitations_token ON email_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_email_invitations_staff_id ON email_invitations(staff_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_status ON email_invitations(status);

-- 8. Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at columns
CREATE TRIGGER update_staff_user_links_updated_at 
  BEFORE UPDATE ON staff_user_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_creation_workflow_updated_at 
  BEFORE UPDATE ON account_creation_workflow 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_invitations_updated_at 
  BEFORE UPDATE ON email_invitations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to create staff-user link
CREATE OR REPLACE FUNCTION create_staff_user_link(
  p_staff_id UUID,
  p_user_id UUID,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  link_id UUID;
BEGIN
  -- Insert the link
  INSERT INTO staff_user_links (staff_id, user_id, created_by)
  VALUES (p_staff_id, p_user_id, p_created_by)
  RETURNING id INTO link_id;
  
  -- Update staff table
  UPDATE staff SET user_account_id = p_user_id WHERE id = p_staff_id;
  
  -- Update users table
  UPDATE users SET staff_id = p_staff_id WHERE id = p_user_id;
  
  RETURN link_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to unlink staff-user
CREATE OR REPLACE FUNCTION unlink_staff_user(
  p_staff_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update link status
  UPDATE staff_user_links 
  SET link_status = 'inactive', unlinked_at = now()
  WHERE staff_id = p_staff_id AND user_id = p_user_id;
  
  -- Clear references
  UPDATE staff SET user_account_id = NULL WHERE id = p_staff_id;
  UPDATE users SET staff_id = NULL WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 13. Create view for staff with user account information
CREATE OR REPLACE VIEW staff_with_accounts AS
SELECT 
  s.*,
  u.user_id,
  u.username,
  u.email as user_email,
  u.is_active as user_is_active,
  u.last_login_at,
  sul.link_status,
  sul.linked_at,
  acw.workflow_status,
  acw.account_creation_method
FROM staff s
LEFT JOIN staff_user_links sul ON s.id = sul.staff_id AND sul.link_status = 'active'
LEFT JOIN users u ON sul.user_id = u.user_id
LEFT JOIN account_creation_workflow acw ON s.id = acw.staff_id;

-- 14. Create view for users with staff information
CREATE OR REPLACE VIEW users_with_staff AS
SELECT 
  u.*,
  s.id as staff_id,
  s.employee_id,
  s.first_name as staff_first_name,
  s.last_name as staff_last_name,
  s.position,
  s.department,
  s.branch_id,
  s.hire_date,
  s.salary,
  s.is_active as staff_is_active,
  sul.link_status,
  sul.linked_at
FROM users u
LEFT JOIN staff_user_links sul ON u.user_id = sul.user_id AND sul.link_status = 'active'
LEFT JOIN staff s ON sul.staff_id = s.id;

-- 15. Insert sample data for testing (optional - remove in production)
-- This creates some sample staff without accounts for testing the workflow
INSERT INTO staff (id, employee_id, first_name, last_name, email, phone, position, department, branch_id, hire_date, is_active, role, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'EMP-001', 'John', 'Doe', 'john.doe@agrivet.com', '+1234567890', 'Sales Associate', 'Sales', (SELECT id FROM branches LIMIT 1), '2024-01-01', true, 'staff', now(), now()),
  (gen_random_uuid(), 'EMP-002', 'Jane', 'Smith', 'jane.smith@agrivet.com', '+1234567891', 'Manager', 'Operations', (SELECT id FROM branches LIMIT 1), '2024-01-15', true, 'manager', now(), now())
ON CONFLICT (employee_id) DO NOTHING;

-- 16. Create RLS policies for security (if using RLS)
-- Note: Adjust these policies based on your specific security requirements

-- Enable RLS on new tables
ALTER TABLE staff_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_creation_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_account_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_invitations ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your auth setup)
CREATE POLICY "Users can view their own staff links" ON staff_user_links
  FOR SELECT USING (auth.uid()::text = created_by::text OR auth.uid()::text = staff_id::text);

CREATE POLICY "Admins can manage staff links" ON staff_user_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view their own workflow" ON account_creation_workflow
  FOR SELECT USING (auth.uid()::text = created_by::text OR auth.uid()::text = staff_id::text);

CREATE POLICY "Admins can manage workflows" ON account_creation_workflow
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Authenticated users can view audit logs" ON user_account_audit
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert audit logs" ON user_account_audit
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view their own invitations" ON email_invitations
  FOR SELECT USING (auth.uid()::text = created_by::text OR email = auth.email());

CREATE POLICY "Admins can manage invitations" ON email_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

-- 17. Fix RLS policies for existing users table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Create new policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to insert users for staff
CREATE POLICY "Admins can create user accounts" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

-- 18. Add comments for documentation
COMMENT ON TABLE staff_user_links IS 'Tracks the relationship between staff records and user accounts';
COMMENT ON TABLE account_creation_workflow IS 'Tracks the process of creating user accounts for staff members';
COMMENT ON TABLE user_account_audit IS 'Audit log for all user account operations';
COMMENT ON TABLE email_invitations IS 'Stores email invitations for account creation';

COMMENT ON COLUMN staff.user_account_id IS 'Reference to the linked user account';
COMMENT ON COLUMN users.staff_id IS 'Reference to the linked staff record';
COMMENT ON COLUMN staff_user_links.link_status IS 'Status of the staff-user link: active, inactive, or transferred';
COMMENT ON COLUMN account_creation_workflow.workflow_status IS 'Current status of the account creation process';
COMMENT ON COLUMN email_invitations.invitation_token IS 'Unique token for email invitation verification';
