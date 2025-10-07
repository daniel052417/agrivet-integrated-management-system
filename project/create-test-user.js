/**
 * Test User Creation Script
 * 
 * This script creates a test user in your users table with a hashed password
 * for testing the custom authentication system.
 */

import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    // Hash the password
    const password = 'TestPassword123!';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('🔐 Test User Creation');
    console.log('==================');
    console.log(`Email: test@agrivet.com`);
    console.log(`Password: ${password}`);
    console.log(`Hashed Password: ${hashedPassword}`);

    console.log('\n📝 SQL to insert into users table:\n');

    // SQL to insert into users table
    const sql = `
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  phone,
  branch_id,
  is_active,
  account_status,
  email_verified,
  password_hash,
  role,
  user_type,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test@agrivet.com',
  'Test',
  'User',
  '+1234567890',
  (SELECT id FROM branches LIMIT 1),
  true,
  'active',
  true,
  '${hashedPassword}',
  'super-admin',
  'staff',
  NOW(),
  NOW()
);

-- Assign super-admin role
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  r.id,
  NOW()
FROM users u, roles r
WHERE u.email = 'test@agrivet.com'
  AND r.name = 'super-admin';
`;

    console.log(sql);
    console.log('\n✅ Copy and run this SQL in your Supabase SQL editor');
    console.log('✅ Then you can login with: test@agrivet.com / TestPassword123!');

  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();
