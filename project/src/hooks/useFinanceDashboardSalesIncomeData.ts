import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

interface SalesData {
  total: number;
  transactions: number;
  averageTicket: number;
}

interface PaymentMethod {
  method: string;
  amount: number;
  percentage: number;
  color: string;
}

interface BranchData {
  branch: string;
  sales: number;
  transactions: number;
  growth: string;
  positive: boolean;
}

interface CategoryData {
  category: string;
  sales: number;
  percentage: number;
  color: string;
}

interface RecentSale {
  id: string;
  time: string;
  amount: number;
  method: string;
  branch: string;
  items: number;
}

type Period = 'today' | 'week' | 'month';

interface UseFinanceDashboardSalesIncomeDataReturn {
  salesData: Record<Period, SalesData>;
  paymentMethods: PaymentMethod[];
  branchData: BranchData[];
  categoryData: CategoryData[];
  recentSales: RecentSale[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

// Color mapping for payment methods
const PAYMENT_METHOD_COLORS: Record<string, string> = {
  'cash': 'bg-green-500',
  'Cash': 'bg-green-500',
  'credit_card': 'bg-blue-500',
  'Credit Card': 'bg-blue-500',
  'gcash': 'bg-purple-500',
  'GCash': 'bg-purple-500',
  'paymaya': 'bg-purple-500',
  'PayMaya': 'bg-purple-500',
  'bank_transfer': 'bg-orange-500',
  'Bank Transfer': 'bg-orange-500',
  'digital': 'bg-purple-500',
  'other': 'bg-gray-500',
  'Other': 'bg-gray-500'
};

// Category colors mapping
const CATEGORY_COLORS = [
  'bg-amber-500',
  'bg-emerald-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-gray-500'
];

/**
 * Custom hook for fetching sales income summary data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users see only their branch data
 */
export const useFinanceDashboardSalesIncomeData = (): UseFinanceDashboardSalesIncomeDataReturn => {
  const [salesData, setSalesData] = useState<Record<Period, SalesData>>({
    today: { total: 0, transactions: 0, averageTicket: 0 },
    week: { total: 0, transactions: 0, averageTicket: 0 },
    month: { total: 0, transactions: 0, averageTicket: 0 }
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [branchData, setBranchData] = useState<BranchData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get RBAC filter configuration
  const getFilterConfig = useCallback(() => {
    const currentUser = simplifiedAuth.getCurrentUser();
    
    if (!currentUser) {
      return { 
        isSuperAdmin: false, 
        branchId: null,
        shouldFilter: false 
      };
    }

    const isSuperAdmin = currentUser.role_name === SYSTEM_ROLES.SUPER_ADMIN;
    const branchId = currentUser.branch_id || null;
    const shouldFilter = !isSuperAdmin && branchId !== null;

    return {
      isSuperAdmin,
      branchId,
      shouldFilter
    };
  }, []);

  // Get date range for a period
  const getDateRange = useCallback((period: Period): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start = new Date(now);

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end };
  }, []);

  // Fetch sales data for a specific period with RBAC filtering
  const fetchSalesData = useCallback(async (period: Period): Promise<SalesData> => {
    try {
      const filterConfig = getFilterConfig();
      const { start, end } = getDateRange(period);

      const startStr = start.toISOString();
      const endStr = end.toISOString();

      let query = supabase
        .from('pos_transactions')
        .select('total_amount, id')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', startStr)
        .lte('transaction_date', endStr);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;
      const transactions = data?.length || 0;
      const averageTicket = transactions > 0 ? total / transactions : 0;

      return { total, transactions, averageTicket };
    } catch (err) {
      console.error(`Error fetching ${period} sales data:`, err);
      return { total: 0, transactions: 0, averageTicket: 0 };
    }
  }, [getFilterConfig, getDateRange]);

  // Fetch payment methods breakdown with RBAC filtering
  const fetchPaymentMethods = useCallback(async (): Promise<PaymentMethod[]> => {
    try {
      const filterConfig = getFilterConfig();
      const { start } = getDateRange('today');
      const startStr = start.toISOString();

      // Get transactions for today
      let transactionsQuery = supabase
        .from('pos_transactions')
        .select('id, branch_id')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', startStr);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        transactionsQuery = transactionsQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: transactions, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;

      if (!transactions || transactions.length === 0) {
        return [];
      }

      const transactionIds = transactions.map(t => t.id);

      // Get payments for these transactions
      const { data: payments, error: paymentsError } = await supabase
        .from('pos_payments')
        .select('payment_method, payment_type, amount')
        .in('transaction_id', transactionIds)
        .eq('payment_status', 'completed');

      if (paymentsError) throw paymentsError;

      // Aggregate payment methods
      const methodMap: Record<string, number> = {};
      payments?.forEach(payment => {
        let methodName = 'Other';
        if (payment.payment_method === 'cash') {
          methodName = 'Cash';
        } else if (payment.payment_method === 'digital') {
          // Map payment_type to readable name
          if (payment.payment_type?.toLowerCase().includes('gcash')) {
            methodName = 'GCash';
          } else if (payment.payment_type?.toLowerCase().includes('paymaya')) {
            methodName = 'PayMaya';
          } else if (payment.payment_type?.toLowerCase().includes('credit') || payment.payment_type?.toLowerCase().includes('card')) {
            methodName = 'Credit Card';
          } else if (payment.payment_type?.toLowerCase().includes('bank') || payment.payment_type?.toLowerCase().includes('transfer')) {
            methodName = 'Bank Transfer';
          } else {
            methodName = payment.payment_type || 'Other';
          }
        }

        const amount = parseFloat(payment.amount?.toString() || '0') || 0;
        methodMap[methodName] = (methodMap[methodName] || 0) + amount;
      });

      const total = Object.values(methodMap).reduce((sum, val) => sum + val, 0);
      
      const paymentMethodsArray: PaymentMethod[] = Object.entries(methodMap)
        .map(([method, amount]) => ({
          method,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          color: PAYMENT_METHOD_COLORS[method] || 'bg-gray-500'
        }))
        .sort((a, b) => b.amount - a.amount);

      return paymentMethodsArray;
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      return [];
    }
  }, [getFilterConfig, getDateRange]);

  // Fetch branch performance data with RBAC filtering
  const fetchBranchData = useCallback(async (): Promise<BranchData[]> => {
    try {
      const filterConfig = getFilterConfig();
      const { start } = getDateRange('today');
      const startStr = start.toISOString();

      // If user is branch-based, only show their branch
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        // Get branch name
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('name')
          .eq('id', filterConfig.branchId)
          .single();

        if (branchError) throw branchError;

        // Get sales for this branch
        const { data: transactions, error: transactionsError } = await supabase
          .from('pos_transactions')
          .select('total_amount')
          .eq('branch_id', filterConfig.branchId)
          .eq('payment_status', 'completed')
          .eq('transaction_type', 'sale')
          .eq('status', 'active')
          .gte('transaction_date', startStr);

        if (transactionsError) throw transactionsError;

        const sales = transactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;
        const transactionCount = transactions?.length || 0;

        // For branch users, we don't calculate growth (no comparison data)
        return [{
          branch: branch?.name || 'Current Branch',
          sales,
          transactions: transactionCount,
          growth: '—',
          positive: true
        }];
      }

      // Super Admin: Get all branches
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (branchesError) throw branchesError;

      if (!branches || branches.length === 0) {
        return [];
      }

      const branchDataArray: BranchData[] = [];

      for (const branch of branches) {
        // Get today's sales
        const { data: todayTransactions, error: todayError } = await supabase
          .from('pos_transactions')
          .select('total_amount')
          .eq('branch_id', branch.id)
          .eq('payment_status', 'completed')
          .eq('transaction_type', 'sale')
          .eq('status', 'active')
          .gte('transaction_date', startStr);

        if (todayError) continue;

        const todaySales = todayTransactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;
        const todayCount = todayTransactions?.length || 0;

        // Get yesterday's sales for growth calculation
        const yesterday = new Date(start);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0] + 'T00:00:00';

        const { data: yesterdayTransactions } = await supabase
          .from('pos_transactions')
          .select('total_amount')
          .eq('branch_id', branch.id)
          .eq('payment_status', 'completed')
          .eq('transaction_type', 'sale')
          .eq('status', 'active')
          .gte('transaction_date', yesterdayStr)
          .lt('transaction_date', startStr);

        const yesterdaySales = yesterdayTransactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;

        let growth = '—';
        let positive = true;
        if (yesterdaySales > 0) {
          const change = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
          growth = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
          positive = change >= 0;
        }

        branchDataArray.push({
          branch: branch.name,
          sales: todaySales,
          transactions: todayCount,
          growth,
          positive
        });
      }

      return branchDataArray.sort((a, b) => b.sales - a.sales);
    } catch (err) {
      console.error('Error fetching branch data:', err);
      return [];
    }
  }, [getFilterConfig, getDateRange]);

  // Fetch category sales data with RBAC filtering
  const fetchCategoryData = useCallback(async (): Promise<CategoryData[]> => {
    try {
      const filterConfig = getFilterConfig();
      const { start } = getDateRange('today');
      const startStr = start.toISOString();

      // Get transactions
      let transactionsQuery = supabase
        .from('pos_transactions')
        .select('id, branch_id')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', startStr);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        transactionsQuery = transactionsQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: transactions, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;

      if (!transactions || transactions.length === 0) {
        return [];
      }

      const transactionIds = transactions.map(t => t.id);

      // Get transaction items with product category info
      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select('transaction_id, line_total, product_id')
        .in('transaction_id', transactionIds);

      if (itemsError) throw itemsError;

      // Get product categories
      const productIds = [...new Set(items?.map(i => i.product_id).filter(Boolean) || [])];
      
      if (productIds.length === 0) {
        return [];
      }

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, category_id')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Get category names
      const categoryIds = [...new Set(products?.map(p => p.category_id).filter(Boolean) || [])];
      
      if (categoryIds.length === 0) {
        return [];
      }

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds);

      if (categoriesError) throw categoriesError;

      // Create product to category map
      const productCategoryMap: Record<string, string> = {};
      products?.forEach(product => {
        if (product.category_id) {
          productCategoryMap[product.id] = product.category_id;
        }
      });

      // Create category name map
      const categoryNameMap: Record<string, string> = {};
      categories?.forEach(cat => {
        categoryNameMap[cat.id] = cat.name;
      });

      // Aggregate sales by category
      const categoryMap: Record<string, number> = {};
      
      items?.forEach(item => {
        const productId = item.product_id;
        const categoryId = productCategoryMap[productId];
        if (categoryId) {
          const categoryName = categoryNameMap[categoryId] || 'Others';
          const amount = parseFloat(item.line_total?.toString() || '0') || 0;
          categoryMap[categoryName] = (categoryMap[categoryName] || 0) + amount;
        }
      });

      const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

      const categoryDataArray: CategoryData[] = Object.entries(categoryMap)
        .map(([category, sales], index) => ({
          category,
          sales,
          percentage: total > 0 ? (sales / total) * 100 : 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        }))
        .sort((a, b) => b.sales - a.sales);

      return categoryDataArray;
    } catch (err) {
      console.error('Error fetching category data:', err);
      return [];
    }
  }, [getFilterConfig, getDateRange]);

  // Fetch recent sales with RBAC filtering
  const fetchRecentSales = useCallback(async (): Promise<RecentSale[]> => {
    try {
      const filterConfig = getFilterConfig();
      
      let query = supabase
        .from('pos_transactions')
        .select(`
          id,
          transaction_number,
          transaction_date,
          total_amount,
          branch_id,
          branches:branch_id(name)
        `)
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data: transactions, error: transactionsError } = await query;
      if (transactionsError) throw transactionsError;

      if (!transactions || transactions.length === 0) {
        return [];
      }

      const transactionIds = transactions.map(t => t.id);

      // Get payment methods for these transactions
      const { data: payments, error: paymentsError } = await supabase
        .from('pos_payments')
        .select('transaction_id, payment_method, payment_type')
        .in('transaction_id', transactionIds);

      if (paymentsError) throw paymentsError;

      // Get item counts
      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select('transaction_id')
        .in('transaction_id', transactionIds);

      if (itemsError) throw itemsError;

      // Create maps
      const paymentMap: Record<string, { method: string; type: string | null }> = {};
      payments?.forEach(payment => {
        paymentMap[payment.transaction_id] = {
          method: payment.payment_method === 'cash' ? 'Cash' : (payment.payment_type || 'Digital'),
          type: payment.payment_type
        };
      });

      const itemCountMap: Record<string, number> = {};
      items?.forEach(item => {
        itemCountMap[item.transaction_id] = (itemCountMap[item.transaction_id] || 0) + 1;
      });

      // Format recent sales
      const recentSalesArray: RecentSale[] = transactions.map(transaction => {
        const payment = paymentMap[transaction.id];
        const method = payment?.method || 'Unknown';
        const date = new Date(transaction.transaction_date);
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const branchName = (transaction.branches as any)?.name || (transaction.branch_id ? 'Branch' : 'Unknown Branch');
        const items = itemCountMap[transaction.id] || 0;

        return {
          id: transaction.transaction_number || `#${transaction.id.substring(0, 8)}`,
          time,
          amount: parseFloat(transaction.total_amount?.toString() || '0') || 0,
          method,
          branch: branchName,
          items
        };
      });

      return recentSalesArray;
    } catch (err) {
      console.error('Error fetching recent sales:', err);
      return [];
    }
  }, [getFilterConfig]);

  // Main refresh function
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [
        todaySales,
        weekSales,
        monthSales,
        payments,
        branches,
        categories,
        recent
      ] = await Promise.all([
        fetchSalesData('today'),
        fetchSalesData('week'),
        fetchSalesData('month'),
        fetchPaymentMethods(),
        fetchBranchData(),
        fetchCategoryData(),
        fetchRecentSales()
      ]);

      setSalesData({
        today: todaySales,
        week: weekSales,
        month: monthSales
      });

      setPaymentMethods(payments);
      setBranchData(branches);
      setCategoryData(categories);
      setRecentSales(recent);
    } catch (err) {
      console.error('Error fetching sales income data:', err);
      setError('Failed to load sales income data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchSalesData, fetchPaymentMethods, fetchBranchData, fetchCategoryData, fetchRecentSales]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    salesData,
    paymentMethods,
    branchData,
    categoryData,
    recentSales,
    loading,
    error,
    refreshData
  };
};

