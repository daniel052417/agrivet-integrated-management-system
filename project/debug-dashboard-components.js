const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-anon-key') {
  console.log('❌ Please set your Supabase credentials in environment variables or update this script');
  console.log('   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardComponents() {
  console.log('🔍 DEBUGGING DASHBOARD COMPONENTS');
  console.log('=====================================\n');

  try {
    // 1. Check pos_transactions table
    console.log('📊 1. POS TRANSACTIONS TABLE');
    console.log('----------------------------');
    
    const { data: allTransactions, error: allTxError } = await supabase
      .from('pos_transactions')
      .select('*')
      .limit(5);
    
    if (allTxError) {
      console.log('❌ Error fetching pos_transactions:', allTxError.message);
    } else {
      console.log(`✅ Found ${allTransactions?.length || 0} sample transactions`);
      if (allTransactions && allTransactions.length > 0) {
        console.log('📋 Sample transaction structure:');
        console.log(JSON.stringify(allTransactions[0], null, 2));
        
        // Check unique values for key fields
        const { data: uniqueTypes } = await supabase
          .from('pos_transactions')
          .select('transaction_type')
          .not('transaction_type', 'is', null);
        
        const { data: uniquePaymentStatus } = await supabase
          .from('pos_transactions')
          .select('payment_status')
          .not('payment_status', 'is', null);
        
        const { data: uniqueStatus } = await supabase
          .from('pos_transactions')
          .select('status')
          .not('status', 'is', null);
        
        console.log('\n🔍 Unique transaction_type values:', [...new Set(uniqueTypes?.map(t => t.transaction_type) || [])]);
        console.log('🔍 Unique payment_status values:', [...new Set(uniquePaymentStatus?.map(p => p.payment_status) || [])]);
        console.log('🔍 Unique status values:', [...new Set(uniqueStatus?.map(s => s.status) || [])]);
      }
    }

    // 2. Check branches table
    console.log('\n🏢 2. BRANCHES TABLE');
    console.log('-------------------');
    
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*');
    
    if (branchesError) {
      console.log('❌ Error fetching branches:', branchesError.message);
    } else {
      console.log(`✅ Found ${branches?.length || 0} branches`);
      if (branches && branches.length > 0) {
        console.log('📋 Branch structure:');
        console.log(JSON.stringify(branches[0], null, 2));
      }
    }

    // 3. Check staff table
    console.log('\n👥 3. STAFF TABLE');
    console.log('-----------------');
    
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .limit(5);
    
    if (staffError) {
      console.log('❌ Error fetching staff:', staffError.message);
    } else {
      console.log(`✅ Found ${staff?.length || 0} sample staff members`);
      if (staff && staff.length > 0) {
        console.log('📋 Staff structure:');
        console.log(JSON.stringify(staff[0], null, 2));
      }
    }

    // 4. Check products table
    console.log('\n📦 4. PRODUCTS TABLE');
    console.log('--------------------');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
    } else {
      console.log(`✅ Found ${products?.length || 0} sample products`);
      if (products && products.length > 0) {
        console.log('📋 Product structure:');
        console.log(JSON.stringify(products[0], null, 2));
      }
    }

    // 5. Check categories table
    console.log('\n📂 5. CATEGORIES TABLE');
    console.log('----------------------');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.log('❌ Error fetching categories:', categoriesError.message);
    } else {
      console.log(`✅ Found ${categories?.length || 0} categories`);
      if (categories && categories.length > 0) {
        console.log('📋 Category structure:');
        console.log(JSON.stringify(categories[0], null, 2));
      }
    }

    // 6. Check pos_transaction_items table
    console.log('\n🛒 6. POS TRANSACTION ITEMS TABLE');
    console.log('----------------------------------');
    
    const { data: items, error: itemsError } = await supabase
      .from('pos_transaction_items')
      .select('*')
      .limit(5);
    
    if (itemsError) {
      console.log('❌ Error fetching pos_transaction_items:', itemsError.message);
    } else {
      console.log(`✅ Found ${items?.length || 0} sample transaction items`);
      if (items && items.length > 0) {
        console.log('📋 Transaction item structure:');
        console.log(JSON.stringify(items[0], null, 2));
      }
    }

    // 7. Test different filter combinations
    console.log('\n🧪 7. TESTING FILTER COMBINATIONS');
    console.log('----------------------------------');
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Test 1: Strict filters
    console.log('\n🔬 Test 1: Strict filters (transaction_type=sale, payment_status=completed, status=active)');
    const { data: strictData, error: strictError } = await supabase
      .from('pos_transactions')
      .select('id, total_amount, transaction_type, payment_status, status, transaction_date')
      .eq('transaction_type', 'sale')
      .eq('payment_status', 'completed')
      .eq('status', 'active')
      .gte('transaction_date', thirtyDaysAgo.toISOString());
    
    if (strictError) {
      console.log('❌ Strict filter error:', strictError.message);
    } else {
      console.log(`✅ Strict filters found: ${strictData?.length || 0} transactions`);
    }

    // Test 2: Fallback 1 (no status filter)
    console.log('\n🔬 Test 2: Fallback 1 (transaction_type=sale, payment_status=completed)');
    const { data: fallback1Data, error: fallback1Error } = await supabase
      .from('pos_transactions')
      .select('id, total_amount, transaction_type, payment_status, status, transaction_date')
      .eq('transaction_type', 'sale')
      .eq('payment_status', 'completed')
      .gte('transaction_date', thirtyDaysAgo.toISOString());
    
    if (fallback1Error) {
      console.log('❌ Fallback 1 error:', fallback1Error.message);
    } else {
      console.log(`✅ Fallback 1 found: ${fallback1Data?.length || 0} transactions`);
    }

    // Test 3: Fallback 2 (only transaction_type)
    console.log('\n🔬 Test 3: Fallback 2 (transaction_type=sale only)');
    const { data: fallback2Data, error: fallback2Error } = await supabase
      .from('pos_transactions')
      .select('id, total_amount, transaction_type, payment_status, status, transaction_date')
      .eq('transaction_type', 'sale')
      .gte('transaction_date', thirtyDaysAgo.toISOString());
    
    if (fallback2Error) {
      console.log('❌ Fallback 2 error:', fallback2Error.message);
    } else {
      console.log(`✅ Fallback 2 found: ${fallback2Data?.length || 0} transactions`);
    }

    // Test 4: No filters (all transactions)
    console.log('\n🔬 Test 4: No filters (all transactions in date range)');
    const { data: allData, error: allError } = await supabase
      .from('pos_transactions')
      .select('id, total_amount, transaction_type, payment_status, status, transaction_date')
      .gte('transaction_date', thirtyDaysAgo.toISOString());
    
    if (allError) {
      console.log('❌ No filters error:', allError.message);
    } else {
      console.log(`✅ No filters found: ${allData?.length || 0} transactions`);
    }

    // 8. Check date ranges
    console.log('\n📅 8. DATE RANGE ANALYSIS');
    console.log('-------------------------');
    
    const { data: dateRangeData, error: dateRangeError } = await supabase
      .from('pos_transactions')
      .select('transaction_date')
      .order('transaction_date', { ascending: false })
      .limit(10);
    
    if (dateRangeError) {
      console.log('❌ Date range error:', dateRangeError.message);
    } else {
      console.log('📅 Most recent transaction dates:');
      dateRangeData?.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.transaction_date}`);
      });
    }

    // 9. Summary and recommendations
    console.log('\n📋 9. SUMMARY & RECOMMENDATIONS');
    console.log('===============================');
    
    const totalTransactions = allData?.length || 0;
    const strictMatches = strictData?.length || 0;
    const fallback1Matches = fallback1Data?.length || 0;
    const fallback2Matches = fallback2Data?.length || 0;
    
    console.log(`📊 Total transactions (last 30 days): ${totalTransactions}`);
    console.log(`📊 Strict filter matches: ${strictMatches}`);
    console.log(`📊 Fallback 1 matches: ${fallback1Matches}`);
    console.log(`📊 Fallback 2 matches: ${fallback2Matches}`);
    
    if (strictMatches > 0) {
      console.log('✅ Your data matches the strict filters perfectly!');
    } else if (fallback1Matches > 0) {
      console.log('⚠️  Your data needs fallback 1 (remove status filter)');
    } else if (fallback2Matches > 0) {
      console.log('⚠️  Your data needs fallback 2 (only transaction_type filter)');
    } else if (totalTransactions > 0) {
      console.log('⚠️  Your data exists but needs different filters');
    } else {
      console.log('❌ No transaction data found in the last 30 days');
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug script
debugDashboardComponents();
