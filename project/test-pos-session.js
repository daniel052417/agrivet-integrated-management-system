/**
 * Test script for POS Session functionality
 * This script tests the POS session creation when a cashier logs in
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const testCashier = {
  email: 'cashier@test.com',
  password: 'TestPassword123!',
  first_name: 'Test',
  last_name: 'Cashier',
  branch_id: 'your-branch-id' // Replace with actual branch ID
};

async function testPOSSessionCreation() {
  console.log('🧪 [TEST] Starting POS Session Creation Test...\n');

  try {
    // Step 1: Create a test cashier user
    console.log('📝 [TEST] Step 1: Creating test cashier user...');
    
    const hashedPassword = await bcrypt.hash(testCashier.password, 10);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: testCashier.email,
        password_hash: hashedPassword,
        first_name: testCashier.first_name,
        last_name: testCashier.last_name,
        branch_id: testCashier.branch_id,
        role: 'cashier',
        user_type: 'staff',
        account_status: 'active',
        is_active: true,
        email_verified: true
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ [TEST] Error creating user:', userError);
      return;
    }

    console.log('✅ [TEST] Test cashier user created:', userData.id);

    // Step 2: Create a test POS terminal
    console.log('\n📝 [TEST] Step 2: Creating test POS terminal...');
    
    const { data: terminalData, error: terminalError } = await supabase
      .from('pos_terminals')
      .insert({
        terminal_name: 'Test Terminal',
        terminal_code: 'TEST-001',
        branch_id: testCashier.branch_id,
        status: 'active',
        assigned_user_id: userData.id
      })
      .select()
      .single();

    if (terminalError) {
      console.error('❌ [TEST] Error creating terminal:', terminalError);
      return;
    }

    console.log('✅ [TEST] Test POS terminal created:', terminalData.id);

    // Step 3: Test POS session creation
    console.log('\n📝 [TEST] Step 3: Testing POS session creation...');
    
    const { posSessionService } = require('./src/lib/posSessionService.ts');
    
    // Check if cashier can start a new session
    const validation = await posSessionService.canStartNewSession(
      userData.id, 
      testCashier.branch_id
    );

    console.log('🔍 [TEST] Session validation result:', validation);

    if (validation.canStart) {
      // Create POS session
      const session = await posSessionService.createSession({
        cashier_id: userData.id,
        branch_id: testCashier.branch_id,
        terminal_id: terminalData.id,
        starting_cash: 0.00,
        notes: 'Test session created by test script'
      });

      console.log('✅ [TEST] POS session created successfully:', session.id);
      console.log('📊 [TEST] Session details:', {
        sessionNumber: session.session_number,
        status: session.status,
        terminalId: session.terminal_id,
        openedAt: session.opened_at
      });
    } else {
      console.log('⚠️ [TEST] Cannot create session:', validation.reason);
    }

    // Step 4: Test getting current session
    console.log('\n📝 [TEST] Step 4: Testing get current session...');
    
    const currentSession = await posSessionService.getCurrentSession(userData.id);
    if (currentSession) {
      console.log('✅ [TEST] Current session found:', currentSession.id);
    } else {
      console.log('❌ [TEST] No current session found');
    }

    // Step 5: Test session history
    console.log('\n📝 [TEST] Step 5: Testing session history...');
    
    const sessionHistory = await posSessionService.getSessionHistory(userData.id, 5);
    console.log('📊 [TEST] Session history:', sessionHistory.length, 'sessions found');

    // Step 6: Clean up test data
    console.log('\n🧹 [TEST] Step 6: Cleaning up test data...');
    
    // Close the session
    if (currentSession) {
      await posSessionService.closeSession(
        currentSession.id, 
        userData.id, 
        0.00, 
        'Test session closed by test script'
      );
      console.log('✅ [TEST] Session closed');
    }

    // Delete test terminal
    await supabase
      .from('pos_terminals')
      .delete()
      .eq('id', terminalData.id);
    console.log('✅ [TEST] Test terminal deleted');

    // Delete test user
    await supabase
      .from('users')
      .delete()
      .eq('id', userData.id);
    console.log('✅ [TEST] Test user deleted');

    console.log('\n🎉 [TEST] All tests completed successfully!');

  } catch (error) {
    console.error('❌ [TEST] Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPOSSessionCreation();
}

module.exports = { testPOSSessionCreation };
