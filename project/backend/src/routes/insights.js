const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/insights/overview - Get marketing insights overview
router.get('/overview', async (req, res) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    
    // Build base query for date filtering
    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `AND created_at >= '${start_date}' AND created_at <= '${end_date}'`;
    }

    // Get active promotions count
    const { data: activePromotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .eq('show_on_pwa', true);

    if (promotionsError) {
      console.error('Error fetching active promotions:', promotionsError);
    }

    // Get total engaged customers (customers who made purchases)
    let customersQuery = supabase
      .from('pos_transactions')
      .select('customer_id', { count: 'exact' })
      .eq('transaction_type', 'sale')
      .not('customer_id', 'is', null);

    if (branch_id && branch_id !== 'all') {
      customersQuery = customersQuery.eq('branch_id', branch_id);
    }

    if (start_date && end_date) {
      customersQuery = customersQuery.gte('transaction_date', start_date).lte('transaction_date', end_date);
    }

    const { data: engagedCustomers, error: customersError } = await customersQuery;

    if (customersError) {
      console.error('Error fetching engaged customers:', customersError);
    }

    // Get total sales
    let salesQuery = supabase
      .from('pos_transactions')
      .select('total_amount')
      .eq('transaction_type', 'sale');

    if (branch_id && branch_id !== 'all') {
      salesQuery = salesQuery.eq('branch_id', branch_id);
    }

    if (start_date && end_date) {
      salesQuery = salesQuery.gte('transaction_date', start_date).lte('transaction_date', end_date);
    }

    const { data: salesData, error: salesError } = await salesQuery;

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
    }

    const totalSales = salesData?.reduce((sum, transaction) => sum + (transaction.total_amount || 0), 0) || 0;

    // Get top product
    let topProductQuery = supabase
      .from('pos_transaction_items')
      .select(`
        product_variants!inner(name),
        quantity,
        unit_price
      `)
      .eq('pos_transactions.transaction_type', 'sale');

    if (branch_id && branch_id !== 'all') {
      topProductQuery = topProductQuery.eq('pos_transactions.branch_id', branch_id);
    }

    if (start_date && end_date) {
      topProductQuery = topProductQuery
        .gte('pos_transactions.transaction_date', start_date)
        .lte('pos_transactions.transaction_date', end_date);
    }

    const { data: topProductData, error: topProductError } = await topProductQuery
      .order('quantity', { ascending: false })
      .limit(1);

    if (topProductError) {
      console.error('Error fetching top product:', topProductError);
    }

    // Calculate conversion rate (simplified)
    const totalOrders = salesData?.length || 0;
    const totalCustomers = engagedCustomers?.length || 0;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

    // Calculate growth rate (simplified - would need historical data)
    const growthRate = 15.3; // Mock data for now

    const overview = {
      activePromotions: activePromotions?.length || 0,
      totalEngagedCustomers: engagedCustomers?.length || 0,
      topProduct: topProductData?.[0]?.product_variants?.name || 'No data',
      totalSales: totalSales,
      growthRate: growthRate,
      conversionRate: parseFloat(conversionRate.toFixed(2))
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error in GET /api/insights/overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/insights/monthly-sales-trend - Get monthly sales trend data
router.get('/monthly-sales-trend', async (req, res) => {
  try {
    const { branch_id, year = new Date().getFullYear() } = req.query;
    
    // Get monthly sales data
    let query = supabase
      .from('pos_transactions')
      .select(`
        transaction_date,
        total_amount,
        id,
        customer_id
      `)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', `${year}-01-01`)
      .lte('transaction_date', `${year}-12-31`);

    if (branch_id && branch_id !== 'all') {
      query = query.eq('branch_id', branch_id);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching monthly sales trend:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch monthly sales trend',
        error: error.message 
      });
    }

    // Group by month and calculate metrics
    const monthlyData = {};
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Initialize all months
    months.forEach((month, index) => {
      monthlyData[index + 1] = {
        month,
        sales: 0,
        orders: 0,
        customers: new Set()
      };
    });

    // Process transactions
    transactions?.forEach(transaction => {
      const month = new Date(transaction.transaction_date).getMonth() + 1;
      if (monthlyData[month]) {
        monthlyData[month].sales += transaction.total_amount || 0;
        monthlyData[month].orders += 1;
        if (transaction.customer_id) {
          monthlyData[month].customers.add(transaction.customer_id);
        }
      }
    });

    // Convert to array format
    const trendData = Object.values(monthlyData).map(data => ({
      month: data.month,
      sales: data.sales,
      orders: data.orders,
      customers: data.customers.size
    }));

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Error in GET /api/insights/monthly-sales-trend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/insights/top-products - Get top selling products
router.get('/top-products', async (req, res) => {
  try {
    const { branch_id, start_date, end_date, limit = 5 } = req.query;
    
    let query = supabase
      .from('pos_transaction_items')
      .select(`
        product_variants!inner(name),
        quantity,
        unit_price,
        pos_transactions!inner(transaction_date, branch_id)
      `)
      .eq('pos_transactions.transaction_type', 'sale');

    if (branch_id && branch_id !== 'all') {
      query = query.eq('pos_transactions.branch_id', branch_id);
    }

    if (start_date && end_date) {
      query = query
        .gte('pos_transactions.transaction_date', start_date)
        .lte('pos_transactions.transaction_date', end_date);
    }

    const { data: transactionItems, error } = await query;

    if (error) {
      console.error('Error fetching top products:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch top products',
        error: error.message 
      });
    }

    // Aggregate by product
    const productStats = {};
    transactionItems?.forEach(item => {
      const productName = item.product_variants?.name || 'Unknown Product';
      if (!productStats[productName]) {
        productStats[productName] = {
          name: productName,
          sales: 0,
          units: 0,
          transactions: 0
        };
      }
      productStats[productName].sales += (item.quantity * item.unit_price);
      productStats[productName].units += item.quantity;
      productStats[productName].transactions += 1;
    });

    // Convert to array and sort by sales
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, parseInt(limit))
      .map((product, index) => ({
        ...product,
        rank: index + 1,
        growth: Math.random() * 25 // Mock growth data
      }));

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Error in GET /api/insights/top-products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/insights/loyal-buyers - Get loyal customers
router.get('/loyal-buyers', async (req, res) => {
  try {
    const { branch_id, start_date, end_date, limit = 5, min_purchases = 5 } = req.query;
    
    let query = supabase
      .from('pos_transactions')
      .select(`
        customer_id,
        total_amount,
        transaction_date,
        branch_id
      `)
      .eq('transaction_type', 'sale')
      .not('customer_id', 'is', null);

    if (branch_id && branch_id !== 'all') {
      query = query.eq('branch_id', branch_id);
    }

    if (start_date && end_date) {
      query = query
        .gte('transaction_date', start_date)
        .lte('transaction_date', end_date);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching loyal buyers:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch loyal buyers',
        error: error.message 
      });
    }

    // Aggregate by customer
    const customerStats = {};
    transactions?.forEach(transaction => {
      const customerId = transaction.customer_id;
      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          customer_id: customerId,
          purchases: 0,
          totalSpent: 0,
          lastPurchase: transaction.transaction_date,
          transactions: []
        };
      }
      customerStats[customerId].purchases += 1;
      customerStats[customerId].totalSpent += transaction.total_amount || 0;
      customerStats[customerId].transactions.push(transaction);
      
      if (new Date(transaction.transaction_date) > new Date(customerStats[customerId].lastPurchase)) {
        customerStats[customerId].lastPurchase = transaction.transaction_date;
      }
    });

    // Filter by minimum purchases and convert to array
    const loyalBuyers = Object.values(customerStats)
      .filter(customer => customer.purchases >= parseInt(min_purchases))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, parseInt(limit))
      .map(customer => {
        // Determine tier based on total spent
        let tier = 'Bronze';
        if (customer.totalSpent >= 20000) tier = 'Gold';
        else if (customer.totalSpent >= 10000) tier = 'Silver';

        return {
          name: `Customer ${customer.customer_id.slice(-4)}`, // Mock name
          purchases: customer.purchases,
          totalSpent: customer.totalSpent,
          lastPurchase: customer.lastPurchase,
          tier: tier
        };
      });

    res.json({
      success: true,
      data: loyalBuyers
    });
  } catch (error) {
    console.error('Error in GET /api/insights/loyal-buyers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/insights/branch-performance - Get branch performance metrics
router.get('/branch-performance', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Get branch data
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');

    if (branchesError) {
      console.error('Error fetching branches:', branchesError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch branches',
        error: branchesError.message 
      });
    }

    const branchPerformance = [];

    for (const branch of branches || []) {
      let query = supabase
        .from('pos_transactions')
        .select(`
          total_amount,
          customer_id,
          transaction_date
        `)
        .eq('transaction_type', 'sale')
        .eq('branch_id', branch.id);

      if (start_date && end_date) {
        query = query
          .gte('transaction_date', start_date)
          .lte('transaction_date', end_date);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error(`Error fetching transactions for branch ${branch.id}:`, error);
        continue;
      }

      const sales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const orders = transactions?.length || 0;
      const customers = new Set(transactions?.map(t => t.customer_id).filter(Boolean)).size;

      branchPerformance.push({
        name: branch.name,
        sales: sales,
        orders: orders,
        customers: customers,
        growth: Math.random() * 20 // Mock growth data
      });
    }

    // Sort by sales
    branchPerformance.sort((a, b) => b.sales - a.sales);

    res.json({
      success: true,
      data: branchPerformance
    });
  } catch (error) {
    console.error('Error in GET /api/insights/branch-performance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/insights/promotion-effectiveness - Get promotion effectiveness metrics
router.get('/promotion-effectiveness', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Get promotions data
    let query = supabase
      .from('promotions')
      .select('*');

    if (start_date && end_date) {
      query = query
        .gte('created_at', start_date)
        .lte('created_at', end_date);
    }

    const { data: promotions, error } = await query;

    if (error) {
      console.error('Error fetching promotions:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch promotions',
        error: error.message 
      });
    }

    const promotionEffectiveness = [];

    for (const promotion of promotions || []) {
      // Mock data for views and conversion
      // In a real implementation, you would track these metrics
      const views = Math.floor(Math.random() * 1000) + 500;
      const uses = promotion.total_uses || 0;
      const conversion = views > 0 ? (uses / views) * 100 : 0;
      const revenue = uses * (promotion.discount_value || 0);

      promotionEffectiveness.push({
        name: promotion.title,
        views: views,
        uses: uses,
        conversion: parseFloat(conversion.toFixed(2)),
        revenue: revenue
      });
    }

    // Sort by conversion rate
    promotionEffectiveness.sort((a, b) => b.conversion - a.conversion);

    res.json({
      success: true,
      data: promotionEffectiveness
    });
  } catch (error) {
    console.error('Error in GET /api/insights/promotion-effectiveness:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/insights/customer-segments - Get customer segmentation data
router.get('/customer-segments', async (req, res) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    
    let query = supabase
      .from('pos_transactions')
      .select(`
        customer_id,
        total_amount,
        transaction_date,
        branch_id
      `)
      .eq('transaction_type', 'sale')
      .not('customer_id', 'is', null);

    if (branch_id && branch_id !== 'all') {
      query = query.eq('branch_id', branch_id);
    }

    if (start_date && end_date) {
      query = query
        .gte('transaction_date', start_date)
        .lte('transaction_date', end_date);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching customer segments:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch customer segments',
        error: error.message 
      });
    }

    // Aggregate by customer
    const customerStats = {};
    transactions?.forEach(transaction => {
      const customerId = transaction.customer_id;
      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          customer_id: customerId,
          purchases: 0,
          totalSpent: 0,
          avgOrder: 0
        };
      }
      customerStats[customerId].purchases += 1;
      customerStats[customerId].totalSpent += transaction.total_amount || 0;
    });

    // Calculate average order for each customer
    Object.values(customerStats).forEach(customer => {
      customer.avgOrder = customer.totalSpent / customer.purchases;
    });

    // Segment customers
    const segments = {
      'Frequent Buyers': { count: 0, totalSpent: 0, avgOrder: 0 },
      'Occasional Buyers': { count: 0, totalSpent: 0, avgOrder: 0 },
      'New Customers': { count: 0, totalSpent: 0, avgOrder: 0 },
      'Loyal Customers': { count: 0, totalSpent: 0, avgOrder: 0 }
    };

    Object.values(customerStats).forEach(customer => {
      if (customer.purchases >= 10 && customer.avgOrder >= 2000) {
        segments['Loyal Customers'].count++;
        segments['Loyal Customers'].totalSpent += customer.totalSpent;
      } else if (customer.purchases >= 5) {
        segments['Frequent Buyers'].count++;
        segments['Frequent Buyers'].totalSpent += customer.totalSpent;
      } else if (customer.purchases >= 2) {
        segments['Occasional Buyers'].count++;
        segments['Occasional Buyers'].totalSpent += customer.totalSpent;
      } else {
        segments['New Customers'].count++;
        segments['New Customers'].totalSpent += customer.totalSpent;
      }
    });

    // Calculate percentages and average orders
    const totalCustomers = Object.values(segments).reduce((sum, seg) => sum + seg.count, 0);
    const customerSegments = Object.entries(segments).map(([segment, data]) => ({
      segment,
      count: data.count,
      percentage: totalCustomers > 0 ? parseFloat(((data.count / totalCustomers) * 100).toFixed(1)) : 0,
      avgOrder: data.count > 0 ? Math.round(data.totalSpent / data.count) : 0
    }));

    res.json({
      success: true,
      data: customerSegments
    });
  } catch (error) {
    console.error('Error in GET /api/insights/customer-segments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/insights/export - Export insights data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', type = 'overview' } = req.query;
    
    // This would implement actual export functionality
    // For now, return a mock response
    res.json({
      success: true,
      message: `Export functionality for ${type} in ${format} format would be implemented here`,
      data: {
        format,
        type,
        downloadUrl: `/api/insights/download/${Date.now()}.${format}`
      }
    });
  } catch (error) {
    console.error('Error in GET /api/insights/export:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
