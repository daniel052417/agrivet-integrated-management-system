-- Fix RLS Policies for Staff-User Integration
-- This migration fixes the Row Level Security policies to allow staff account creation

-- 1. Fix RLS policies for existing users table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;

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

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own data" ON users
  FOR DELETE USING (auth.uid() = id);

-- Allow admins to insert users for staff
CREATE POLICY "Admins can create user accounts" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

-- 2. Fix RLS policies for staff table if needed
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view staff data" ON staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON staff;
DROP POLICY IF EXISTS "Users can insert staff data" ON staff;
DROP POLICY IF EXISTS "Users can update staff data" ON staff;
DROP POLICY IF EXISTS "Users can delete staff data" ON staff;

-- Create new policies for staff table
CREATE POLICY "Users can view staff data" ON staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

CREATE POLICY "Admins can manage staff" ON staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

CREATE POLICY "Users can insert staff data" ON staff
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

CREATE POLICY "Users can update staff data" ON staff
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

CREATE POLICY "Users can delete staff data" ON staff
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

-- 3. Fix RLS policies for new tables
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own staff links" ON staff_user_links;
DROP POLICY IF EXISTS "Admins can manage staff links" ON staff_user_links;
DROP POLICY IF EXISTS "Users can view their own workflow" ON account_creation_workflow;
DROP POLICY IF EXISTS "Admins can manage workflows" ON account_creation_workflow;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON user_account_audit;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON user_account_audit;
DROP POLICY IF EXISTS "Users can view their own invitations" ON email_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON email_invitations;

-- Create new policies for staff_user_links
CREATE POLICY "Users can view their own staff links" ON staff_user_links
  FOR SELECT USING (auth.uid()::text = created_by::text OR auth.uid()::text = staff_id::text);

CREATE POLICY "Admins can manage staff links" ON staff_user_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

-- Create new policies for account_creation_workflow
CREATE POLICY "Users can view their own workflow" ON account_creation_workflow
  FOR SELECT USING (auth.uid()::text = created_by::text OR auth.uid()::text = staff_id::text);

CREATE POLICY "Admins can manage workflows" ON account_creation_workflow
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

-- Create new policies for user_account_audit
CREATE POLICY "Authenticated users can view audit logs" ON user_account_audit
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert audit logs" ON user_account_audit
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

-- Create new policies for email_invitations
CREATE POLICY "Users can view their own invitations" ON email_invitations
  FOR SELECT USING (auth.uid()::text = created_by::text OR email = auth.email());

CREATE POLICY "Admins can manage invitations" ON email_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager', 'hr')
    )
  );

-- 4. Add comments for documentation
COMMENT ON POLICY "Admins can create user accounts" ON users IS 'Allows admins and managers to create user accounts for staff members';
COMMENT ON POLICY "Admins can manage staff" ON staff IS 'Allows admins, managers, and HR to manage staff records';
COMMENT ON POLICY "Admins can manage staff links" ON staff_user_links IS 'Allows admins, managers, and HR to manage staff-user account links';











