import { supabase } from './supabase';

export interface POSTransaction {
  id: string;
  transaction_number: string;
  pos_session_id: string;
  customer_id?: string;
  cashier_id: string;
  branch_id?: string;
  transaction_date: string;
  transaction_type: 'sale' | 'return' | 'exchange';
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'active' | 'cancelled' | 'voided';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
  weight_kg?: number;
  expiry_date?: string;
  batch_number?: string;
  created_at: string;
}

export interface POPayment {
  id: string;
  transaction_id: string;
  payment_method: string;
  payment_type?: string;
  amount: number;
  change_given: number;
  reference_number?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_at?: string;
  created_at: string;
}

export interface SalesSummary {
  totalSales: number;
  totalTransactions: number;
  totalDiscounts: number;
  totalTaxes: number;
  averageTransactionValue: number;
  totalItemsSold: number;
}

export interface SalesByPeriod {
  period: string;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  product_sku: string;
  totalQuantity: number;
  totalRevenue: number;
  totalTransactions: number;
}

export interface SalesByBranch {
  branch_id: string;
  branch_name: string;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
}

export interface SalesByCashier {
  cashier_id: string;
  cashier_name: string;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
}

export interface PaymentMethodSummary {
  payment_method: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

class POSSalesService {
  /**
   * Get sales summary for a specific date range
   */
  async getSalesSummary(
    startDate: string, 
    endDate: string, 
    branchId?: string
  ): Promise<SalesSummary> {
    try {
      console.log('📊 [Sales] Fetching sales summary:', { startDate, endDate, branchId });

      let query = supabase
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
      let itemsQuery = supabase
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

      const summary: SalesSummary = {
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

  /**
   * Get sales by period (daily, weekly, monthly)
   */
  async getSalesByPeriod(
    startDate: string,
    endDate: string,
    period: 'day' | 'week' | 'month' = 'day',
    branchId?: string
  ): Promise<SalesByPeriod[]> {
    try {
      console.log('📊 [Sales] Fetching sales by period:', { startDate, endDate, period, branchId });

      let dateFormat: string;
      switch (period) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      let query = supabase
        .from('pos_transactions')
        .select(`
          transaction_date,
          total_amount,
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

      // Group by period
      const groupedData: { [key: string]: { totalSales: number; totalTransactions: number } } = {};

      transactions?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        let periodKey: string;

        switch (period) {
          case 'day':
            periodKey = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            periodKey = date.toISOString().substring(0, 7);
            break;
          default:
            periodKey = date.toISOString().split('T')[0];
        }

        if (!groupedData[periodKey]) {
          groupedData[periodKey] = { totalSales: 0, totalTransactions: 0 };
        }

        groupedData[periodKey].totalSales += transaction.total_amount || 0;
        groupedData[periodKey].totalTransactions += 1;
      });

      const result: SalesByPeriod[] = Object.entries(groupedData).map(([period, data]) => ({
        period,
        totalSales: data.totalSales,
        totalTransactions: data.totalTransactions,
        averageTransactionValue: data.totalTransactions > 0 ? data.totalSales / data.totalTransactions : 0
      })).sort((a, b) => a.period.localeCompare(b.period));

      console.log('✅ [Sales] Sales by period fetched:', result.length, 'periods');
      return result;
    } catch (error) {
      console.error('❌ [Sales] Error fetching sales by period:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  async getTopProducts(
    startDate: string,
    endDate: string,
    limit: number = 10,
    branchId?: string
  ): Promise<TopProduct[]> {
    try {
      console.log('📊 [Sales] Fetching top products:', { startDate, endDate, limit, branchId });

      // First get transaction IDs for the date range
      let transactionsQuery = supabase
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
      const { data: items, error: itemsError } = await supabase
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
      const productData: { [key: string]: TopProduct } = {};

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

  /**
   * Get sales by branch
   */
  async getSalesByBranch(
    startDate: string,
    endDate: string
  ): Promise<SalesByBranch[]> {
    try {
      console.log('📊 [Sales] Fetching sales by branch:', { startDate, endDate });

      const { data, error } = await supabase
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
      const branchData: { [key: string]: SalesByBranch } = {};

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

  /**
   * Get sales by cashier
   */
  async getSalesByCashier(
    startDate: string,
    endDate: string,
    branchId?: string
  ): Promise<SalesByCashier[]> {
    try {
      console.log('📊 [Sales] Fetching sales by cashier:', { startDate, endDate, branchId });

      let query = supabase
        .from('pos_transactions')
        .select(`
          cashier_id,
          total_amount,
          id,
          users!inner(
            id,
            first_name,
            last_name
          )
        `)
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Group by cashier
      const cashierData: { [key: string]: SalesByCashier } = {};

      data?.forEach(transaction => {
        const cashierId = transaction.cashier_id;

        if (!cashierData[cashierId]) {
          cashierData[cashierId] = {
            cashier_id: cashierId,
            cashier_name: `${transaction.users?.first_name || ''} ${transaction.users?.last_name || ''}`.trim(),
            totalSales: 0,
            totalTransactions: 0,
            averageTransactionValue: 0
          };
        }

        cashierData[cashierId].totalSales += transaction.total_amount || 0;
        cashierData[cashierId].totalTransactions += 1;
      });

      const result = Object.values(cashierData).map(cashier => ({
        ...cashier,
        averageTransactionValue: cashier.totalTransactions > 0 ? cashier.totalSales / cashier.totalTransactions : 0
      })).sort((a, b) => b.totalSales - a.totalSales);

      console.log('✅ [Sales] Sales by cashier fetched:', result.length, 'cashiers');
      return result;
    } catch (error) {
      console.error('❌ [Sales] Error fetching sales by cashier:', error);
      throw error;
    }
  }

  /**
   * Get payment method summary
   */
  async getPaymentMethodSummary(
    startDate: string,
    endDate: string,
    branchId?: string
  ): Promise<PaymentMethodSummary[]> {
    try {
      console.log('📊 [Sales] Fetching payment method summary:', { startDate, endDate, branchId });

      // First get transaction IDs for the date range
      let transactionsQuery = supabase
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

      // Get payments for these transactions
      const { data: payments, error: paymentsError } = await supabase
        .from('pos_payments')
        .select(`
          payment_method,
          amount
        `)
        .in('transaction_id', transactionIds)
        .eq('payment_status', 'completed');

      if (paymentsError) {
        throw paymentsError;
      }

      // Group by payment method
      const paymentData: { [key: string]: PaymentMethodSummary } = {};
      const totalAmount = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      payments?.forEach(payment => {
        if (!paymentData[payment.payment_method]) {
          paymentData[payment.payment_method] = {
            payment_method: payment.payment_method,
            totalAmount: 0,
            transactionCount: 0,
            percentage: 0
          };
        }

        paymentData[payment.payment_method].totalAmount += payment.amount || 0;
        paymentData[payment.payment_method].transactionCount += 1;
      });

      const result = Object.values(paymentData).map(payment => ({
        ...payment,
        percentage: totalAmount > 0 ? (payment.totalAmount / totalAmount) * 100 : 0
      })).sort((a, b) => b.totalAmount - a.totalAmount);

      console.log('✅ [Sales] Payment method summary fetched:', result.length, 'methods');
      return result;
    } catch (error) {
      console.error('❌ [Sales] Error fetching payment method summary:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(
    limit: number = 20,
    branchId?: string
  ): Promise<POSTransaction[]> {
    try {
      console.log('📊 [Sales] Fetching recent transactions:', { limit, branchId });

      let query = supabase
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

  /**
   * Get transaction details with items and payments
   */
  async getTransactionDetails(transactionId: string): Promise<{
    transaction: POSTransaction;
    items: POSTransactionItem[];
    payments: POPayment[];
  } | null> {
    try {
      console.log('📊 [Sales] Fetching transaction details:', transactionId);

      // Get transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Get transaction items
      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select('*')
        .eq('transaction_id', transactionId);

      if (itemsError) {
        throw itemsError;
      }

      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('pos_payments')
        .select('*')
        .eq('transaction_id', transactionId);

      if (paymentsError) {
        throw paymentsError;
      }

      console.log('✅ [Sales] Transaction details fetched');
      return {
        transaction,
        items: items || [],
        payments: payments || []
      };
    } catch (error) {
      console.error('❌ [Sales] Error fetching transaction details:', error);
      throw error;
    }
  }

  /**
   * Get today's sales summary
   */
  async getTodaysSales(branchId?: string): Promise<SalesSummary> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSalesSummary(today, today, branchId);
  }

  /**
   * Get this month's sales summary
   */
  async getThisMonthsSales(branchId?: string): Promise<SalesSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return this.getSalesSummary(startOfMonth, endOfMonth, branchId);
  }

  /**
   * Get sales comparison (current vs previous period)
   */
  async getSalesComparison(
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string,
    branchId?: string
  ): Promise<{
    current: SalesSummary;
    previous: SalesSummary;
    growth: {
      salesGrowth: number;
      transactionGrowth: number;
      averageTransactionGrowth: number;
    };
  }> {
    try {
      console.log('📊 [Sales] Fetching sales comparison');

      const [current, previous] = await Promise.all([
        this.getSalesSummary(currentStart, currentEnd, branchId),
        this.getSalesSummary(previousStart, previousEnd, branchId)
      ]);

      const salesGrowth = previous.totalSales > 0 
        ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 
        : 0;

      const transactionGrowth = previous.totalTransactions > 0 
        ? ((current.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100 
        : 0;

      const averageTransactionGrowth = previous.averageTransactionValue > 0 
        ? ((current.averageTransactionValue - previous.averageTransactionValue) / previous.averageTransactionValue) * 100 
        : 0;

      return {
        current,
        previous,
        growth: {
          salesGrowth,
          transactionGrowth,
          averageTransactionGrowth
        }
      };
    } catch (error) {
      console.error('❌ [Sales] Error fetching sales comparison:', error);
      throw error;
    }
  }

  /**
   * Get hourly sales distribution for a specific date
   */
  async getHourlySales(date: string, branchId?: string): Promise<{ [hour: string]: number }> {
    try {
      console.log('📊 [Sales] Fetching hourly sales for:', date);

      let query = supabase
        .from('pos_transactions')
        .select('transaction_date, total_amount')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', `${date}T00:00:00`)
        .lte('transaction_date', `${date}T23:59:59`);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const hourlyData: { [hour: string]: number } = {};

      // Initialize all hours with 0
      for (let i = 0; i < 24; i++) {
        hourlyData[i.toString().padStart(2, '0')] = 0;
      }

      data?.forEach(transaction => {
        const hour = new Date(transaction.transaction_date).getHours().toString().padStart(2, '0');
        hourlyData[hour] += transaction.total_amount || 0;
      });

      console.log('✅ [Sales] Hourly sales fetched for', date);
      return hourlyData;
    } catch (error) {
      console.error('❌ [Sales] Error fetching hourly sales:', error);
      throw error;
    }
  }

  /**
   * Get low performing products (products with low sales)
   */
  async getLowPerformingProducts(
    startDate: string,
    endDate: string,
    threshold: number = 5,
    branchId?: string
  ): Promise<TopProduct[]> {
    try {
      console.log('📊 [Sales] Fetching low performing products');

      const allProducts = await this.getTopProducts(startDate, endDate, 1000, branchId);
      
      // Filter products with sales below threshold
      const lowPerforming = allProducts.filter(product => 
        product.totalQuantity < threshold || product.totalRevenue < (threshold * 10)
      );

      console.log('✅ [Sales] Low performing products fetched:', lowPerforming.length);
      return lowPerforming;
    } catch (error) {
      console.error('❌ [Sales] Error fetching low performing products:', error);
      throw error;
    }
  }

  /**
   * Get sales trends (daily sales for the last N days)
   */
  async getSalesTrends(days: number = 30, branchId?: string): Promise<SalesByPeriod[]> {
    try {
      console.log('📊 [Sales] Fetching sales trends for last', days, 'days');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      return this.getSalesByPeriod(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        'day',
        branchId
      );
    } catch (error) {
      console.error('❌ [Sales] Error fetching sales trends:', error);
      throw error;
    }
  }

  /**
   * Get customer purchase history
   */
  async getCustomerPurchaseHistory(
    customerId: string,
    limit: number = 20
  ): Promise<POSTransaction[]> {
    try {
      console.log('📊 [Sales] Fetching customer purchase history:', customerId);

      const { data, error } = await supabase
        .from('pos_transactions')
        .select(`
          *,
          users!inner(
            first_name,
            last_name
          ),
          branches!left(
            name
          )
        `)
        .eq('customer_id', customerId)
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      console.log('✅ [Sales] Customer purchase history fetched:', data?.length || 0, 'transactions');
      return data || [];
    } catch (error) {
      console.error('❌ [Sales] Error fetching customer purchase history:', error);
      throw error;
    }
  }

  /**
   * Get refund and return statistics
   */
  async getRefundStats(
    startDate: string,
    endDate: string,
    branchId?: string
  ): Promise<{
    totalRefunds: number;
    totalRefundAmount: number;
    totalReturns: number;
    totalReturnAmount: number;
    refundRate: number;
  }> {
    try {
      console.log('📊 [Sales] Fetching refund statistics');

      let refundsQuery = supabase
        .from('pos_transactions')
        .select('total_amount')
        .eq('transaction_type', 'return')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (branchId) {
        refundsQuery = refundsQuery.eq('branch_id', branchId);
      }

      const { data: refunds, error: refundsError } = await refundsQuery;

      if (refundsError) {
        throw refundsError;
      }

      // Get total sales for refund rate calculation
      const totalSales = await this.getSalesSummary(startDate, endDate, branchId);

      const totalRefunds = refunds?.length || 0;
      const totalRefundAmount = refunds?.reduce((sum, refund) => sum + (refund.total_amount || 0), 0) || 0;
      const totalReturns = totalRefunds; // Assuming returns are counted as refunds
      const totalReturnAmount = totalRefundAmount;
      const refundRate = totalSales.totalSales > 0 ? (totalRefundAmount / totalSales.totalSales) * 100 : 0;

      const stats = {
        totalRefunds,
        totalRefundAmount,
        totalReturns,
        totalReturnAmount,
        refundRate
      };

      console.log('✅ [Sales] Refund statistics fetched:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [Sales] Error fetching refund statistics:', error);
      throw error;
    }
  }
}

export const posSalesService = new POSSalesService();
