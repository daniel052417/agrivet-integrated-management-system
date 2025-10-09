/**
 * Test script for POS Sales Service functionality
 * This script tests the sales data fetching from POS transaction tables
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

  async getSalesSummary(startDate, endDate, branchId) {
    try {
      console.log('📊 [Sales] Fetching sales summary:', { startDate, endDate, branchId });

      let query = this.supabase
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
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: transactions, error } = await query;

      if (error) {
        throw error;
      }

      // Get total items sold
      const transactionIds = transactions?.map(t => t.id) || [];
      let itemsQuery = this.supabase
        .from('pos_transaction_items')
        .select('quantity')
        .in('transaction_id', transactionIds);

      const { data: items, error: itemsError } = await itemsQuery;

      if (itemsError) {
        throw itemsError;
      }

      const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const totalDiscounts = transactions?.reduce((sum, t) => sum + (t.discount_amount || 0), 0) || 0;
      const totalTaxes = transactions?.reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const totalItemsSold = items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      const summary = {
        totalSales,
        totalTransactions,
        totalDiscounts,
        totalTaxes,
        averageTransactionValue,
        totalItemsSold
      };

      console.log('✅ [Sales] Sales summary fetched:', summary);
      return summary;
    } catch (error) {
      console.error('❌ [Sales] Error fetching sales summary:', error);
      throw error;
    }
  }

  async getTopProducts(startDate, endDate, limit = 10, branchId) {
    try {
      console.log('📊 [Sales] Fetching top products:', { startDate, endDate, limit, branchId });

      // First get transaction IDs for the date range
      let transactionsQuery = this.supabase
        .from('pos_transactions')
        .select('id')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (branchId) {
        transactionsQuery = transactionsQuery.eq('branch_id', branchId);
      }

      const { data: transactions, error: transactionsError } = await transactionsQuery;

      if (transactionsError) {
        throw transactionsError;
      }

      const transactionIds = transactions?.map(t => t.id) || [];

      if (transactionIds.length === 0) {
        return [];
      }

      // Get transaction items for these transactions
      const { data: items, error: itemsError } = await this.supabase
        .from('pos_transaction_items')
        .select(`
          product_id,
          product_name,
          product_sku,
          quantity,
          line_total
        `)
        .in('transaction_id', transactionIds);

      if (itemsError) {
        throw itemsError;
      }

      // Group by product
      const productData = {};

      items?.forEach(item => {
        if (!productData[item.product_id]) {
          productData[item.product_id] = {
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            totalQuantity: 0,
            totalRevenue: 0,
            totalTransactions: 0
          };
        }

        productData[item.product_id].totalQuantity += item.quantity || 0;
        productData[item.product_id].totalRevenue += item.line_total || 0;
        productData[item.product_id].totalTransactions += 1;
      });

      const result = Object.values(productData)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      console.log('✅ [Sales] Top products fetched:', result.length, 'products');
      return result;
    } catch (error) {
      console.error('❌ [Sales] Error fetching top products:', error);
      throw error;
    }
  }

  async getSalesByBranch(startDate, endDate) {
    try {
      console.log('📊 [Sales] Fetching sales by branch:', { startDate, endDate });

      const { data, error } = await this.supabase
        .from('pos_transactions')
        .select(`
          branch_id,
          total_amount,
          id,
          branches!inner(
            id,
            name
          )
        `)
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) {
        throw error;
      }

      // Group by branch
      const branchData = {};

      data?.forEach(transaction => {
        const branchId = transaction.branch_id;
        if (!branchId) return;

        if (!branchData[branchId]) {
          branchData[branchId] = {
            branch_id: branchId,
            branch_name: transaction.branches?.name || 'Unknown Branch',
            totalSales: 0,
            totalTransactions: 0,
            averageTransactionValue: 0
          };
        }

        branchData[branchId].totalSales += transaction.total_amount || 0;
        branchData[branchId].totalTransactions += 1;
      });

      const result = Object.values(branchData).map(branch => ({
        ...branch,
        averageTransactionValue: branch.totalTransactions > 0 ? branch.totalSales / branch.totalTransactions : 0
      })).sort((a, b) => b.totalSales - a.totalSales);

      console.log('✅ [Sales] Sales by branch fetched:', result.length, 'branches');
      return result;
    } catch (error) {
      console.error('❌ [Sales] Error fetching sales by branch:', error);
      throw error;
    }
  }

  async getRecentTransactions(limit = 20, branchId) {
    try {
      console.log('📊 [Sales] Fetching recent transactions:', { limit, branchId });

      let query = this.supabase
        .from('pos_transactions')
        .select(`
          *,
          users!inner(
            first_name,
            last_name
          ),
          branches!left(
            name
          ),
          customers!left(
            first_name,
            last_name
          )
        `)
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log('✅ [Sales] Recent transactions fetched:', data?.length || 0, 'transactions');
      return data || [];
    } catch (error) {
      console.error('❌ [Sales] Error fetching recent transactions:', error);
      throw error;
    }
  }
}

async function testSalesService() {
  console.log('🧪 [TEST] Starting POS Sales Service Test...\n');

  try {
    const salesService = new MockPOSSalesService();

    // Test date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('📅 [TEST] Testing date range:', startDateStr, 'to', endDateStr);

    // Test 1: Sales Summary
    console.log('\n📝 [TEST] Test 1: Sales Summary');
    const salesSummary = await salesService.getSalesSummary(startDateStr, endDateStr);
    console.log('📊 [TEST] Sales Summary Result:', {
      totalSales: salesSummary.totalSales,
      totalTransactions: salesSummary.totalTransactions,
      totalDiscounts: salesSummary.totalDiscounts,
      totalTaxes: salesSummary.totalTaxes,
      averageTransactionValue: salesSummary.averageTransactionValue,
      totalItemsSold: salesSummary.totalItemsSold
    });

    // Test 2: Top Products
    console.log('\n📝 [TEST] Test 2: Top Products');
    const topProducts = await salesService.getTopProducts(startDateStr, endDateStr, 5);
    console.log('📊 [TEST] Top Products Result:', topProducts.length, 'products');
    topProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.product_name} - ${product.totalRevenue} (${product.totalQuantity} units)`);
    });

    // Test 3: Sales by Branch
    console.log('\n📝 [TEST] Test 3: Sales by Branch');
    const salesByBranch = await salesService.getSalesByBranch(startDateStr, endDateStr);
    console.log('📊 [TEST] Sales by Branch Result:', salesByBranch.length, 'branches');
    salesByBranch.forEach((branch, index) => {
      console.log(`  ${index + 1}. ${branch.branch_name} - ${branch.totalSales} (${branch.totalTransactions} transactions)`);
    });

    // Test 4: Recent Transactions
    console.log('\n📝 [TEST] Test 4: Recent Transactions');
    const recentTransactions = await salesService.getRecentTransactions(5);
    console.log('📊 [TEST] Recent Transactions Result:', recentTransactions.length, 'transactions');
    recentTransactions.forEach((transaction, index) => {
      console.log(`  ${index + 1}. ${transaction.transaction_number} - ${transaction.total_amount} (${transaction.transaction_date})`);
    });

    // Test 5: Today's Sales
    console.log('\n📝 [TEST] Test 5: Today\'s Sales');
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = await salesService.getSalesSummary(today, today);
    console.log('📊 [TEST] Today\'s Sales Result:', {
      totalSales: todaysSales.totalSales,
      totalTransactions: todaysSales.totalTransactions
    });

    console.log('\n🎉 [TEST] All sales service tests completed successfully!');

  } catch (error) {
    console.error('❌ [TEST] Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testSalesService();
}

module.exports = { testSalesService, MockPOSSalesService };
