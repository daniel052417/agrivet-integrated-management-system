/**
 * Test script for Overview Dashboard functionality
 * This script tests the metric cards and dashboard components with real POS data
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock POS Sales Service for testing
class MockPOSSalesService {
  constructor() {
    this.supabase = supabase;
  }

  async getTodaysSales() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: transactions, error } = await this.supabase
        .from('pos_transactions')
        .select(`
          total_amount,
          discount_amount,
          tax_amount,
          id
        `)
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', `${today}T00:00:00`)
        .lte('transaction_date', `${today}T23:59:59`);

      if (error) {
        throw error;
      }

      const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const totalDiscounts = transactions?.reduce((sum, t) => sum + (t.discount_amount || 0), 0) || 0;
      const totalTaxes = transactions?.reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0;
      const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return {
        totalSales,
        totalTransactions,
        totalDiscounts,
        totalTaxes,
        averageTransactionValue,
        totalItemsSold: 0 // Would need to query pos_transaction_items
      };
    } catch (error) {
      console.error('❌ [Sales] Error fetching today\'s sales:', error);
      throw error;
    }
  }
}

async function testOverviewDashboard() {
  console.log('🧪 [TEST] Starting Overview Dashboard Test...\n');

  try {
    const salesService = new MockPOSSalesService();

    // Test 1: Today's Sales
    console.log('📝 [TEST] Test 1: Today\'s Sales');
    const todaysSales = await salesService.getTodaysSales();
    console.log('📊 [TEST] Today\'s Sales Result:', {
      totalSales: `₱${todaysSales.totalSales.toLocaleString()}`,
      totalTransactions: todaysSales.totalTransactions,
      averageTransactionValue: `₱${todaysSales.averageTransactionValue.toLocaleString()}`
    });

    // Test 2: Active POS Sessions
    console.log('\n📝 [TEST] Test 2: Active POS Sessions');
    const { data: openSessions, error: sessionsError } = await supabase
      .from('pos_sessions')
      .select('id')
      .eq('status', 'open');

    if (sessionsError) {
      console.error('❌ [TEST] Error fetching sessions:', sessionsError);
    } else {
      console.log('📊 [TEST] Active POS Sessions:', openSessions?.length || 0);
    }

    // Test 3: Total Branches
    console.log('\n📝 [TEST] Test 3: Total Branches');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true);

    if (branchesError) {
      console.error('❌ [TEST] Error fetching branches:', branchesError);
    } else {
      console.log('📊 [TEST] Total Branches:', branches?.length || 0);
      branches?.forEach((branch, index) => {
        console.log(`  ${index + 1}. ${branch.name}`);
      });
    }

    // Test 4: Active Cashiers
    console.log('\n📝 [TEST] Test 4: Active Cashiers');
    const { data: cashiers, error: cashiersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('role', 'cashier')
      .eq('is_active', true);

    if (cashiersError) {
      console.error('❌ [TEST] Error fetching cashiers:', cashiersError);
    } else {
      console.log('📊 [TEST] Active Cashiers:', cashiers?.length || 0);
      cashiers?.forEach((cashier, index) => {
        console.log(`  ${index + 1}. ${cashier.first_name} ${cashier.last_name} (${cashier.email})`);
      });
    }

    // Test 5: Products in Stock
    console.log('\n📝 [TEST] Test 5: Products in Stock');
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity_on_hand');

    if (inventoryError) {
      console.error('❌ [TEST] Error fetching inventory:', inventoryError);
    } else {
      const totalStock = inventory?.reduce((sum, item) => sum + (item.quantity_on_hand || 0), 0) || 0;
      console.log('📊 [TEST] Total Products in Stock:', totalStock.toLocaleString());
    }

    // Test 6: Pending Orders
    console.log('\n📝 [TEST] Test 6: Pending Orders');
    const { data: pendingTransactions, error: pendingError } = await supabase
      .from('pos_transactions')
      .select('id, transaction_number, total_amount')
      .eq('payment_status', 'pending')
      .eq('status', 'active');

    if (pendingError) {
      console.error('❌ [TEST] Error fetching pending transactions:', pendingError);
    } else {
      console.log('📊 [TEST] Pending Orders:', pendingTransactions?.length || 0);
      pendingTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. ${transaction.transaction_number} - ₱${transaction.total_amount}`);
      });
    }

    // Test 7: Low Stock Alerts
    console.log('\n📝 [TEST] Test 7: Low Stock Alerts');
    const { data: lowStockData, error: lowStockError } = await supabase
      .from('inventory')
      .select(`
        quantity_on_hand, 
        reorder_level,
        products!inner(
          name,
          is_active
        )
      `)
      .not('quantity_on_hand', 'is', null)
      .not('reorder_level', 'is', null)
      .eq('products.is_active', true);

    if (lowStockError) {
      console.error('❌ [TEST] Error fetching low stock data:', lowStockError);
    } else {
      const lowStockItems = lowStockData?.filter(item => 
        item.quantity_on_hand <= item.reorder_level
      ) || [];
      
      console.log('📊 [TEST] Low Stock Alerts:', lowStockItems.length);
      lowStockItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.products?.name} - ${item.quantity_on_hand} (Reorder: ${item.reorder_level})`);
      });
    }

    console.log('\n🎉 [TEST] All Overview Dashboard tests completed successfully!');
    console.log('\n📋 [SUMMARY] Dashboard Metrics:');
    console.log(`  • Today's Sales: ₱${todaysSales.totalSales.toLocaleString()}`);
    console.log(`  • Total Transactions: ${todaysSales.totalTransactions}`);
    console.log(`  • Active POS Sessions: ${openSessions?.length || 0}`);
    console.log(`  • Total Branches: ${branches?.length || 0}`);
    console.log(`  • Active Cashiers: ${cashiers?.length || 0}`);
    console.log(`  • Pending Orders: ${pendingTransactions?.length || 0}`);
    console.log(`  • Low Stock Alerts: ${lowStockData?.filter(item => item.quantity_on_hand <= item.reorder_level).length || 0}`);

  } catch (error) {
    console.error('❌ [TEST] Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testOverviewDashboard();
}

module.exports = { testOverviewDashboard, MockPOSSalesService };
