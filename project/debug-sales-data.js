/**
 * Debug script to check why sales data is showing as 0/empty
 * This will help identify the exact issues with the data queries
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSalesData() {
  console.log('🔍 [DEBUG] Starting Sales Data Debug...\n');

  try {
    // Debug 1: Check if pos_transactions table exists and has data
    console.log('📝 [DEBUG] 1. Checking pos_transactions table...');
    const { data: allTransactions, error: allTxError } = await supabase
      .from('pos_transactions')
      .select('*')
      .limit(5);

    if (allTxError) {
      console.error('❌ [DEBUG] Error accessing pos_transactions:', allTxError);
    } else {
      console.log('✅ [DEBUG] pos_transactions table accessible');
      console.log('📊 [DEBUG] Sample transactions:', allTransactions?.length || 0);
      if (allTransactions && allTransactions.length > 0) {
        console.log('📋 [DEBUG] Sample transaction structure:', {
          id: allTransactions[0].id,
          transaction_type: allTransactions[0].transaction_type,
          payment_status: allTransactions[0].payment_status,
          status: allTransactions[0].status,
          total_amount: allTransactions[0].total_amount,
          transaction_date: allTransactions[0].transaction_date
        });
      }
    }

    // Debug 2: Check today's date format and transactions
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📝 [DEBUG] 2. Checking today's data (${today})...`);
    
    const { data: todaysAll, error: todaysAllError } = await supabase
      .from('pos_transactions')
      .select('*')
      .gte('transaction_date', `${today}T00:00:00`)
      .lte('transaction_date', `${today}T23:59:59`);

    if (todaysAllError) {
      console.error('❌ [DEBUG] Error fetching today\'s transactions:', todaysAllError);
    } else {
      console.log('✅ [DEBUG] Today\'s transactions (all):', todaysAll?.length || 0);
      if (todaysAll && todaysAll.length > 0) {
        todaysAll.forEach((tx, index) => {
          console.log(`📋 [DEBUG] Transaction ${index + 1}:`, {
            transaction_type: tx.transaction_type,
            payment_status: tx.payment_status,
            status: tx.status,
            total_amount: tx.total_amount
          });
        });
      }
    }

    // Debug 3: Check with different filters
    console.log('\n📝 [DEBUG] 3. Checking with sale filter...');
    const { data: todaysSales, error: todaysSalesError } = await supabase
      .from('pos_transactions')
      .select('*')
      .eq('transaction_type', 'sale')
      .gte('transaction_date', `${today}T00:00:00`)
      .lte('transaction_date', `${today}T23:59:59`);

    if (todaysSalesError) {
      console.error('❌ [DEBUG] Error fetching today\'s sales:', todaysSalesError);
    } else {
      console.log('✅ [DEBUG] Today\'s sales transactions:', todaysSales?.length || 0);
    }

    // Debug 4: Check with completed payment status
    console.log('\n📝 [DEBUG] 4. Checking with completed payment status...');
    const { data: todaysCompleted, error: todaysCompletedError } = await supabase
      .from('pos_transactions')
      .select('*')
      .eq('transaction_type', 'sale')
      .eq('payment_status', 'completed')
      .gte('transaction_date', `${today}T00:00:00`)
      .lte('transaction_date', `${today}T23:59:59`);

    if (todaysCompletedError) {
      console.error('❌ [DEBUG] Error fetching today\'s completed sales:', todaysCompletedError);
    } else {
      console.log('✅ [DEBUG] Today\'s completed sales:', todaysCompleted?.length || 0);
    }

    // Debug 5: Check with active status
    console.log('\n📝 [DEBUG] 5. Checking with active status...');
    const { data: todaysActive, error: todaysActiveError } = await supabase
      .from('pos_transactions')
      .select('*')
      .eq('transaction_type', 'sale')
      .eq('payment_status', 'completed')
      .eq('status', 'active')
      .gte('transaction_date', `${today}T00:00:00`)
      .lte('transaction_date', `${today}T23:59:59`);

    if (todaysActiveError) {
      console.error('❌ [DEBUG] Error fetching today\'s active completed sales:', todaysActiveError);
    } else {
      console.log('✅ [DEBUG] Today\'s active completed sales:', todaysActive?.length || 0);
      if (todaysActive && todaysActive.length > 0) {
        const totalSales = todaysActive.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
        console.log('💰 [DEBUG] Total sales amount:', `₱${totalSales.toLocaleString()}`);
      }
    }

    // Debug 6: Check all time transactions (not just today)
    console.log('\n📝 [DEBUG] 6. Checking all-time transactions...');
    const { data: allTimeSales, error: allTimeError } = await supabase
      .from('pos_transactions')
      .select('*')
      .eq('transaction_type', 'sale')
      .eq('payment_status', 'completed')
      .eq('status', 'active')
      .limit(10);

    if (allTimeError) {
      console.error('❌ [DEBUG] Error fetching all-time sales:', allTimeError);
    } else {
      console.log('✅ [DEBUG] All-time active completed sales:', allTimeSales?.length || 0);
      if (allTimeSales && allTimeSales.length > 0) {
        const totalAllTime = allTimeSales.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
        console.log('💰 [DEBUG] Total all-time sales amount:', `₱${totalAllTime.toLocaleString()}`);
        console.log('📅 [DEBUG] Date range:', {
          earliest: allTimeSales[allTimeSales.length - 1]?.transaction_date,
          latest: allTimeSales[0]?.transaction_date
        });
      }
    }

    // Debug 7: Check different payment statuses
    console.log('\n📝 [DEBUG] 7. Checking different payment statuses...');
    const { data: paymentStatuses, error: paymentError } = await supabase
      .from('pos_transactions')
      .select('payment_status')
      .limit(20);

    if (paymentError) {
      console.error('❌ [DEBUG] Error fetching payment statuses:', paymentError);
    } else {
      const statusCounts = {};
      paymentStatuses?.forEach(tx => {
        statusCounts[tx.payment_status] = (statusCounts[tx.payment_status] || 0) + 1;
      });
      console.log('✅ [DEBUG] Payment status distribution:', statusCounts);
    }

    // Debug 8: Check different transaction types
    console.log('\n📝 [DEBUG] 8. Checking different transaction types...');
    const { data: transactionTypes, error: typeError } = await supabase
      .from('pos_transactions')
      .select('transaction_type')
      .limit(20);

    if (typeError) {
      console.error('❌ [DEBUG] Error fetching transaction types:', typeError);
    } else {
      const typeCounts = {};
      transactionTypes?.forEach(tx => {
        typeCounts[tx.transaction_type] = (typeCounts[tx.transaction_type] || 0) + 1;
      });
      console.log('✅ [DEBUG] Transaction type distribution:', typeCounts);
    }

    // Debug 9: Check different status values
    console.log('\n📝 [DEBUG] 9. Checking different status values...');
    const { data: statuses, error: statusError } = await supabase
      .from('pos_transactions')
      .select('status')
      .limit(20);

    if (statusError) {
      console.error('❌ [DEBUG] Error fetching statuses:', statusError);
    } else {
      const statusCounts = {};
      statuses?.forEach(tx => {
        statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1;
      });
      console.log('✅ [DEBUG] Status distribution:', statusCounts);
    }

    console.log('\n🎯 [DEBUG] Debug Summary:');
    console.log('  • Check if your data has the correct transaction_type values');
    console.log('  • Check if your data has the correct payment_status values');
    console.log('  • Check if your data has the correct status values');
    console.log('  • Check if your transaction_date is in the correct timezone');
    console.log('  • The queries are looking for: transaction_type="sale", payment_status="completed", status="active"');

  } catch (error) {
    console.error('❌ [DEBUG] Debug failed:', error);
  }
}

// Run the debug
if (require.main === module) {
  debugSalesData();
}

module.exports = { debugSalesData };
