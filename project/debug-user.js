/**
 * Debug User Script
 * Check if test user exists in database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prhxgpbqkpdnjpmxndyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaHhncGJxa3BkbmptcG5keXAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDY0NzQ5MCwiZXhwIjoyMDUwMjIzNDkwfQ.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUser() {
  try {
    console.log('🔍 Checking for test user in database...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@agrivet.com')
      .single();
    
    if (error) {
      console.log('❌ Error:', error);
    } else if (data) {
      console.log('✅ User found:', {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        account_status: data.account_status,
        is_active: data.is_active,
        email_verified: data.email_verified,
        password_hash: data.password_hash ? 'EXISTS' : 'MISSING',
        password_hash_length: data.password_hash?.length
      });
    } else {
      console.log('❌ No user found with email: test@agrivet.com');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

debugUser();
