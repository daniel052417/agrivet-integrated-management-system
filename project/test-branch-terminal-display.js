const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-anon-key') {
  console.log('❌ Please set your Supabase credentials in environment variables');
  console.log('   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBranchTerminalDisplay() {
  console.log('🔍 TESTING BRANCH & TERMINAL DISPLAY');
  console.log('=====================================\n');

  try {
    // 1. Test getting a sample user with branch_id
    console.log('📊 1. TESTING USER WITH BRANCH DATA');
    console.log('-----------------------------------');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, branch_id, email')
      .not('branch_id', 'is', null)
      .limit(1);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users with branch_id found');
      return;
    }

    const testUser = users[0];
    console.log('✅ Test user found:', {
      id: testUser.id,
      name: `${testUser.first_name} ${testUser.last_name}`,
      email: testUser.email,
      branch_id: testUser.branch_id
    });

    // 2. Test getting branch information
    console.log('\n🏢 2. TESTING BRANCH INFORMATION');
    console.log('---------------------------------');
    
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name, code, address, phone, is_active')
      .eq('id', testUser.branch_id)
      .single();

    if (branchError) {
      console.log('❌ Error fetching branch:', branchError.message);
    } else {
      console.log('✅ Branch found:', {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        phone: branch.phone,
        is_active: branch.is_active
      });
    }

    // 3. Test getting POS terminals for the branch
    console.log('\n🖥️  3. TESTING POS TERMINALS');
    console.log('----------------------------');
    
    const { data: terminals, error: terminalsError } = await supabase
      .from('pos_terminals')
      .select('id, terminal_name, terminal_code, branch_id, status, assigned_user_id')
      .eq('branch_id', testUser.branch_id)
      .eq('status', 'active');

    if (terminalsError) {
      console.log('❌ Error fetching terminals:', terminalsError.message);
    } else {
      console.log(`✅ Found ${terminals?.length || 0} active terminals for branch`);
      terminals?.forEach((terminal, index) => {
        console.log(`   ${index + 1}. ${terminal.terminal_name} (${terminal.terminal_code})`);
        console.log(`      Status: ${terminal.status}`);
        console.log(`      Assigned to: ${terminal.assigned_user_id || 'None'}`);
      });
    }

    // 4. Test getting current POS session
    console.log('\n📋 4. TESTING POS SESSIONS');
    console.log('--------------------------');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('pos_sessions')
      .select(`
        id,
        session_number,
        terminal_id,
        branch_id,
        status,
        opened_at,
        branches!inner(
          id,
          name,
          code
        ),
        pos_terminals!left(
          id,
          terminal_name,
          terminal_code
        )
      `)
      .eq('cashier_id', testUser.id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1);

    if (sessionsError) {
      console.log('❌ Error fetching sessions:', sessionsError.message);
    } else if (sessions && sessions.length > 0) {
      const session = sessions[0];
      console.log('✅ Open session found:', {
        session_number: session.session_number,
        branch: session.branches.name,
        terminal: session.pos_terminals?.terminal_name || 'No terminal',
        opened_at: session.opened_at
      });
    } else {
      console.log('ℹ️  No open sessions found for this user');
    }

    // 5. Test the display format
    console.log('\n🎨 5. TESTING DISPLAY FORMATS');
    console.log('-----------------------------');
    
    if (branch) {
      const terminalCode = terminals?.[0]?.terminal_code || 'POS1';
      const branchName = branch.name;
      
      console.log('📱 Expected POS Layout Display:');
      console.log(`   Title: "${terminalCode}"`);
      console.log(`   Subtitle: "${branchName}"`);
      console.log(`   Session: "${sessions?.[0]?.session_number || 'N/A'}"`);
    }

    // 6. Summary
    console.log('\n📋 6. SUMMARY');
    console.log('=============');
    
    console.log('✅ Branch Terminal Display Test Complete!');
    console.log('The POSLayout will now dynamically show:');
    console.log('• Terminal code (e.g., "POB1-POB-POS1")');
    console.log('• Full branch name (e.g., "Poblacion Branch")');
    console.log('• Current session number (if available)');
    console.log('• Loading states and error handling');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testBranchTerminalDisplay();
