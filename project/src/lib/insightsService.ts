import { supabase } from './supabase';

export interface InsightsOverview {
  activePromotions: number;
  totalEngagedCustomers: number;
  topProduct: string;
  totalSales: number;
  growthRate: number;
  conversionRate: number;
}

export interface MonthlySalesTrend {
  month: string;
  sales: number;
  orders: number;
  customers: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  units: number;
  growth: number;
  rank: number;
}

export interface LoyalBuyer {
  name: string;
  purchases: number;
  totalSpent: number;
  lastPurchase: string;
  tier: 'Gold' | 'Silver' | 'Bronze';
}

export interface BranchPerformance {
  name: string;
  sales: number;
  orders: number;
  customers: number;
  growth: number;
}

export interface PromotionEffectiveness {
  name: string;
  views: number;
  uses: number;
  conversion: number;
  revenue: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  avgOrder: number;
}

export interface InsightsFilters {
  branch_id?: string;
  start_date?: string;
  end_date?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  limit?: number;
}

export class InsightsService {
  /**
   * Get marketing insights overview
   */
  static async getOverview(filters: InsightsFilters = {}): Promise<InsightsOverview> {
    try {
      const { branch_id, start_date, end_date } = filters;
      
      // Get active promotions count
      const { data: activePromotions, error: promotionsError } = await supabase
        .from('promotions')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .eq('show_on_pwa', true);

      if (promotionsError) {
        console.error('Error fetching active promotions:', promotionsError);
      }

      // Get total engaged customers
      let customersQuery = supabase
        .from('pos_transactions')
        .select('customer_id', { count: 'exact' })
        .eq('transaction_type', 'sale')
        .not('customer_id', 'is', null);

      if (branch_id && branch_id !== 'all') {
        customersQuery = customersQuery.eq('branch_id', branch_id);
      }

      if (start_date && end_date) {
        customersQuery = customersQuery
          .gte('transaction_date', start_date)
          .lte('transaction_date', end_date);
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
        salesQuery = salesQuery
          .gte('transaction_date', start_date)
          .lte('transaction_date', end_date);
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
          product_name,
          quantity
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

      // Calculate conversion rate
      const totalOrders = salesData?.length || 0;
      const totalCustomers = engagedCustomers?.length || 0;
      const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

      // Mock growth rate (would be calculated from historical data)
      const growthRate = 15.3;

      return {
        activePromotions: activePromotions?.length || 0,
        totalEngagedCustomers: engagedCustomers?.length || 0,
        topProduct: topProductData?.[0]?.product_name || 'No data',
        totalSales: totalSales,
        growthRate: growthRate,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      };
    } catch (error) {
      console.error('Error in getOverview:', error);
      throw error;
    }
  }

  /**
   * Get monthly sales trend data
   */
  static async getMonthlySalesTrend(filters: InsightsFilters = {}): Promise<MonthlySalesTrend[]> {
    try {
      const { branch_id, year = new Date().getFullYear() } = filters;
      
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
        throw new Error(`Failed to fetch monthly sales trend: ${error.message}`);
      }

      // Group by month
      const monthlyData: { [key: number]: { month: string; sales: number; orders: number; customers: Set<string> } } = {};
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
      return Object.values(monthlyData).map(data => ({
        month: data.month,
        sales: data.sales,
        orders: data.orders,
        customers: data.customers.size
      }));
    } catch (error) {
      console.error('Error in getMonthlySalesTrend:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  static async getTopProducts(filters: InsightsFilters = {}): Promise<TopProduct[]> {
    try {
      const { branch_id, start_date, end_date, limit = 5 } = filters;
      
      let query = supabase
        .from('pos_transaction_items')
        .select(`
          product_name,
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
        throw new Error(`Failed to fetch top products: ${error.message}`);
      }

      // Aggregate by product
      const productStats: { [key: string]: { name: string; sales: number; units: number; transactions: number } } = {};
      
      transactionItems?.forEach(item => {
        const productName = item.product_name || 'Unknown Product';
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
      return Object.values(productStats)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit)
        .map((product, index) => ({
          ...product,
          rank: index + 1,
          growth: Math.random() * 25 // Mock growth data
        }));
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      throw error;
    }
  }

  /**
   * Get loyal customers
   */
  static async getLoyalBuyers(filters: InsightsFilters = {}): Promise<LoyalBuyer[]> {
    try {
      const { branch_id, start_date, end_date, limit = 5, min_purchases = 5 } = filters;
      
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
        throw new Error(`Failed to fetch loyal buyers: ${error.message}`);
      }

      // Aggregate by customer
      const customerStats: { [key: string]: { customer_id: string; purchases: number; totalSpent: number; lastPurchase: string } } = {};
      
      transactions?.forEach(transaction => {
        const customerId = transaction.customer_id;
        if (!customerStats[customerId]) {
          customerStats[customerId] = {
            customer_id: customerId,
            purchases: 0,
            totalSpent: 0,
            lastPurchase: transaction.transaction_date
          };
        }
        customerStats[customerId].purchases += 1;
        customerStats[customerId].totalSpent += transaction.total_amount || 0;
        
        if (new Date(transaction.transaction_date) > new Date(customerStats[customerId].lastPurchase)) {
          customerStats[customerId].lastPurchase = transaction.transaction_date;
        }
      });

      // Filter by minimum purchases and convert to array
      return Object.values(customerStats)
        .filter(customer => customer.purchases >= min_purchases)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit)
        .map(customer => {
          // Determine tier based on total spent
          let tier: 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
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
    } catch (error) {
      console.error('Error in getLoyalBuyers:', error);
      throw error;
    }
  }

  /**
   * Get branch performance metrics
   */
  static async getBranchPerformance(filters: InsightsFilters = {}): Promise<BranchPerformance[]> {
    try {
      const { start_date, end_date } = filters;
      
      // Get branch data
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('id, name');

      if (branchesError) {
        console.error('Error fetching branches:', branchesError);
        throw new Error(`Failed to fetch branches: ${branchesError.message}`);
      }

      const branchPerformance: BranchPerformance[] = [];

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
      return branchPerformance.sort((a, b) => b.sales - a.sales);
    } catch (error) {
      console.error('Error in getBranchPerformance:', error);
      throw error;
    }
  }

  /**
   * Get promotion effectiveness metrics
   */
  static async getPromotionEffectiveness(filters: InsightsFilters = {}): Promise<PromotionEffectiveness[]> {
    try {
      const { start_date, end_date } = filters;
      
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
        throw new Error(`Failed to fetch promotions: ${error.message}`);
      }

      const promotionEffectiveness: PromotionEffectiveness[] = [];

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
      return promotionEffectiveness.sort((a, b) => b.conversion - a.conversion);
    } catch (error) {
      console.error('Error in getPromotionEffectiveness:', error);
      throw error;
    }
  }

  /**
   * Get customer segmentation data
   */
  static async getCustomerSegments(filters: InsightsFilters = {}): Promise<CustomerSegment[]> {
    try {
      const { branch_id, start_date, end_date } = filters;
      
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
        throw new Error(`Failed to fetch customer segments: ${error.message}`);
      }

      // Aggregate by customer
      const customerStats: { [key: string]: { customer_id: string; purchases: number; totalSpent: number; avgOrder: number } } = {};
      
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
      return Object.entries(segments).map(([segment, data]) => ({
        segment,
        count: data.count,
        percentage: totalCustomers > 0 ? parseFloat(((data.count / totalCustomers) * 100).toFixed(1)) : 0,
        avgOrder: data.count > 0 ? Math.round(data.totalSpent / data.count) : 0
      }));
    } catch (error) {
      console.error('Error in getCustomerSegments:', error);
      throw error;
    }
  }

  /**
   * Export insights data
   */
  static async exportData(format: 'pdf' | 'excel', type: string, filters: InsightsFilters = {}): Promise<{ downloadUrl: string }> {
    try {
      // This would implement actual export functionality
      // For now, return a mock response
      return {
        downloadUrl: `/api/insights/download/${Date.now()}.${format}`
      };
    } catch (error) {
      console.error('Error in exportData:', error);
      throw error;
    }
  }
}

export default InsightsService;
