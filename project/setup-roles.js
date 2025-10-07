/**
 * Setup Roles Script
 * This script creates the necessary roles in your database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prhxgpbqkpdnjpmxndyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaHhncGJxa3BkbmptcG5keXAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDY0NzQ5MCwiZXhwIjoyMDUwMjIzNDkwfQ.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8';

const supabase = createClient(supabaseUrl, supabaseKey);

const roles = [
  {
    name: 'super-admin',
    display_name: 'Super Administrator',
    description: 'Full system access with all permissions',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'hr-admin',
    display_name: 'HR Administrator',
    description: 'Human Resources administration and management',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'hr-staff',
    display_name: 'HR Staff',
    description: 'Human Resources staff member',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'marketing-admin',
    display_name: 'Marketing Administrator',
    description: 'Marketing administration and management',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'marketing-staff',
    display_name: 'Marketing Staff',
    description: 'Marketing staff member',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'cashier',
    display_name: 'Cashier',
    description: 'Point of Sale and cashier operations',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'inventory-clerk',
    display_name: 'Inventory Clerk',
    description: 'Inventory management and stock control',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'staff',
    display_name: 'Staff Member',
    description: 'General staff member',
    is_active: true,
    is_system_role: true
  },
  {
    name: 'user',
    display_name: 'User',
    description: 'Basic user access',
    is_active: true,
    is_system_role: false
  }
];

async function setupRoles() {
  try {
    console.log('🔧 Setting up roles in database...');
    
    // First, check if roles already exist
    const { data: existingRoles, error: fetchError } = await supabase
      .from('roles')
      .select('name');
    
    if (fetchError) {
      console.error('❌ Error fetching existing roles:', fetchError);
      return;
    }
    
    console.log('📋 Existing roles:', existingRoles?.map(r => r.name) || []);
    
    // Filter out roles that already exist
    const existingRoleNames = existingRoles?.map(r => r.name) || [];
    const rolesToCreate = roles.filter(role => !existingRoleNames.includes(role.name));
    
    if (rolesToCreate.length === 0) {
      console.log('✅ All roles already exist in database');
      return;
    }
    
    console.log('📝 Creating roles:', rolesToCreate.map(r => r.name));
    
    // Insert new roles
    const { data, error } = await supabase
      .from('roles')
      .insert(rolesToCreate)
      .select();
    
    if (error) {
      console.error('❌ Error creating roles:', error);
    } else {
      console.log('✅ Successfully created roles:', data?.map(r => r.name) || []);
    }
    
    // Verify all roles exist
    const { data: allRoles, error: verifyError } = await supabase
      .from('roles')
      .select('name, display_name, is_active')
      .eq('is_active', true);
    
    if (verifyError) {
      console.error('❌ Error verifying roles:', verifyError);
    } else {
      console.log('📋 All active roles in database:');
      allRoles?.forEach(role => {
        console.log(`  - ${role.name}: ${role.display_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

setupRoles();
