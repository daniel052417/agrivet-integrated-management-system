import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting permissions system setup...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250124000003_existing_schema_adaptive.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the permission system
    await testPermissionSystem();
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function testPermissionSystem() {
  try {
    console.log('🧪 Testing permission system...');
    
    // Test 1: Check if roles were created
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true);
    
    if (rolesError) {
      console.error('❌ Failed to fetch roles:', rolesError);
      return;
    }
    
    console.log(`✅ Found ${roles.length} active roles:`, roles.map(r => r.role_name));
    
    // Test 2: Check if permissions were created
    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('*');
    
    if (permissionsError) {
      console.error('❌ Failed to fetch permissions:', permissionsError);
      return;
    }
    
    console.log(`✅ Found ${permissions.length} permissions`);
    
    // Test 3: Check if component access was created
    const { data: components, error: componentsError } = await supabase
      .from('component_access')
      .select('*')
      .eq('is_active', true);
    
    if (componentsError) {
      console.error('❌ Failed to fetch component access:', componentsError);
      return;
    }
    
    console.log(`✅ Found ${components.length} accessible components`);
    
    // Test 4: Check if role permissions were assigned
    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from('role_permissions')
      .select('*');
    
    if (rolePermissionsError) {
      console.error('❌ Failed to fetch role permissions:', rolePermissionsError);
      return;
    }
    
    console.log(`✅ Found ${rolePermissions.length} role-permission assignments`);
    
    // Test 5: Test the permission functions
    console.log('🔧 Testing permission functions...');
    
    // Create a test user (if not exists)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    // Assign super-admin role to test user
    const { error: assignError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: testUserId,
        role_id: roles.find(r => r.role_name === 'super-admin')?.role_id,
        is_active: true
      });
    
    if (assignError) {
      console.log('⚠️  Could not assign test role (user might not exist):', assignError.message);
    } else {
      console.log('✅ Test role assigned successfully');
      
      // Test permission functions
      const { data: userPermissions } = await supabase.rpc('get_user_permissions', {
        user_uuid: testUserId
      });
      
      console.log(`✅ Test user has ${userPermissions?.length || 0} permissions`);
      
      const { data: accessibleComponents } = await supabase.rpc('get_user_accessible_components', {
        user_uuid: testUserId
      });
      
      console.log(`✅ Test user can access ${accessibleComponents?.length || 0} components`);
    }
    
    console.log('🎉 Permission system setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Create a user account in your app');
    console.log('3. Assign roles to users through the admin interface');
    console.log('4. Test the permission system with different user roles');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  }
}

// Run the setup
runMigration();
