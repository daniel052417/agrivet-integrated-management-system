import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

interface CashFlowData {
  currentBalance: number;
  netCashFlow: number;
  totalInflow: number;
  totalOutflow: number;
  workingCapital: number;
}

interface DailyCashFlow {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface CashFlowCategory {
  category: string;
  amount: number;
  percentage: number;
  trend: string;
  positive: boolean;
}

interface CashFlowCategories {
  inflow: CashFlowCategory[];
  outflow: CashFlowCategory[];
}

interface RecentTransaction {
  id: number;
  type: 'inflow' | 'outflow';
  description: string;
  amount: number;
  time: string;
  category: string;
}

type Period = 'week' | 'month' | 'quarter' | 'year';

interface UseCashFlowDataReturn {
  cashFlowData: CashFlowData;
  dailyCashFlow: DailyCashFlow[];
  cashFlowCategories: CashFlowCategories;
  recentTransactions: RecentTransaction[];
  loading: boolean;
  error: string | null;
  refreshData: (period: Period) => Promise<void>;
}

/**
 * Custom hook for fetching cash flow data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users see only their branch data
 */
export const useCashFlowData = (): UseCashFlowDataReturn => {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData>({
    currentBalance: 0,
    netCashFlow: 0,
    totalInflow: 0,
    totalOutflow: 0,
    workingCapital: 0
  });
  const [dailyCashFlow, setDailyCashFlow] = useState<DailyCashFlow[]>([]);
  const [cashFlowCategories, setCashFlowCategories] = useState<CashFlowCategories>({
    inflow: [],
    outflow: []
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
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

  // Get date range based on selected period
  const getDateRange = useCallback((period: Period) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  }, []);

  // Helper function to get time ago string
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  // Helper function to get time from "ago" string (for sorting)
  const getTimeFromAgo = (timeAgo: string): number => {
    const match = timeAgo.match(/(\d+)\s+(minute|hour|day)/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'minute') return value * 60000;
    if (unit === 'hour') return value * 3600000;
    if (unit === 'day') return value * 86400000;
    return 0;
  };

  // Fetch total inflow (from pos_transactions) with RBAC filtering
  const fetchTotalInflow = useCallback(async (startDate: string, endDate: string): Promise<number> => {
    try {
      const filterConfig = getFilterConfig();
      
      let query = supabase
        .from('pos_transactions')
        .select('total_amount')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', `${startDate}T00:00:00`)
        .lte('transaction_date', `${endDate}T23:59:59`);

      // Apply branch filter for non-super-admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const total = data?.reduce((sum, t) => {
        const amount = parseFloat(t.total_amount?.toString() || '0') || 0;
        return sum + amount;
      }, 0) || 0;
      
      return total;
    } catch (err) {
      console.error('Error fetching total inflow:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch total outflow (from expenses and payroll) with RBAC filtering
  const fetchTotalOutflow = useCallback(async (startDate: string, endDate: string): Promise<number> => {
    try {
      const filterConfig = getFilterConfig();
      
      // Get expenses with branch filtering
      let expensesQuery = supabase
        .from('expenses')
        .select('amount')
        .in('status', ['approved'])
        .gte('date', startDate)
        .lte('date', endDate);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        expensesQuery = expensesQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: expensesData, error: expensesError } = await expensesQuery;
      
      if (expensesError) throw expensesError;
      
      // Get payroll requests with branch filtering
      let payrollQuery = supabase
        .from('payroll_requests')
        .select('total_net')
        .in('status', ['approved', 'processed'])
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        payrollQuery = payrollQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: payrollData, error: payrollError } = await payrollQuery;
      
      if (payrollError) throw payrollError;
      
      const expensesTotal = expensesData?.reduce((sum, e) => {
        const amount = parseFloat(e.amount?.toString() || '0') || 0;
        return sum + amount;
      }, 0) || 0;
      
      const payrollTotal = payrollData?.reduce((sum, p) => {
        const amount = parseFloat(p.total_net?.toString() || '0') || 0;
        return sum + amount;
      }, 0) || 0;
      
      return expensesTotal + payrollTotal;
    } catch (err) {
      console.error('Error fetching total outflow:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch current balance (from latest POS session) with RBAC filtering
  const fetchCurrentBalance = useCallback(async (): Promise<number> => {
    try {
      const filterConfig = getFilterConfig();
      
      // Get the most recent closed POS session with branch filtering
      let closedSessionQuery = supabase
        .from('pos_sessions')
        .select('ending_cash, starting_cash, total_sales, closed_at')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(1);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        closedSessionQuery = closedSessionQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: sessionData, error } = await closedSessionQuery.single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (sessionData) {
        const balance = parseFloat(sessionData.ending_cash?.toString() || '0') || 0;
        return balance;
      }
      
      // If no closed session, try to get current balance from open session
      let openSessionQuery = supabase
        .from('pos_sessions')
        .select('starting_cash, total_sales, opened_at')
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        openSessionQuery = openSessionQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: openSession } = await openSessionQuery.single();
      
      if (openSession) {
        const startCash = parseFloat(openSession.starting_cash?.toString() || '0') || 0;
        const sales = parseFloat(openSession.total_sales?.toString() || '0') || 0;
        return startCash + sales;
      }
      
      return 0;
    } catch (err) {
      console.error('Error fetching current balance:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch daily cash flow with RBAC filtering
  const fetchDailyCashFlow = useCallback(async (startDate: string, endDate: string): Promise<DailyCashFlow[]> => {
    try {
      const filterConfig = getFilterConfig();
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days: DailyCashFlow[] = [];
      
      // Generate all days in range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          inflow: 0,
          outflow: 0,
          net: 0
        });
      }
      
      // Fetch inflow (sales transactions) with branch filtering
      let inflowQuery = supabase
        .from('pos_transactions')
        .select('transaction_date, total_amount')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', `${startDate}T00:00:00`)
        .lte('transaction_date', `${endDate}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        inflowQuery = inflowQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: inflowData, error: inflowError } = await inflowQuery;
      
      if (inflowError) throw inflowError;
      
      // Fetch outflow (expenses) with branch filtering
      let expensesQuery = supabase
        .from('expenses')
        .select('date, amount')
        .in('status', ['approved'])
        .gte('date', startDate)
        .lte('date', endDate);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        expensesQuery = expensesQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: expensesData, error: expensesError } = await expensesQuery;
      
      if (expensesError) throw expensesError;
      
      // Fetch payroll outflow with branch filtering
      let payrollQuery = supabase
        .from('payroll_requests')
        .select('created_at, total_net')
        .in('status', ['approved', 'processed'])
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        payrollQuery = payrollQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: payrollData, error: payrollError } = await payrollQuery;
      
      if (payrollError) throw payrollError;
      
      // Aggregate inflow by date
      inflowData?.forEach(transaction => {
        const date = new Date(transaction.transaction_date).toISOString().split('T')[0];
        const day = days.find(d => d.date === date);
        if (day) {
          const amount = parseFloat(transaction.total_amount?.toString() || '0') || 0;
          day.inflow += amount;
        }
      });
      
      // Aggregate expenses by date
      expensesData?.forEach(expense => {
        const day = days.find(d => d.date === expense.date);
        if (day) {
          const amount = parseFloat(expense.amount?.toString() || '0') || 0;
          day.outflow += amount;
        }
      });
      
      // Aggregate payroll by date
      payrollData?.forEach(payroll => {
        const date = new Date(payroll.created_at).toISOString().split('T')[0];
        const day = days.find(d => d.date === date);
        if (day) {
          const amount = parseFloat(payroll.total_net?.toString() || '0') || 0;
          day.outflow += amount;
        }
      });
      
      // Calculate net for each day
      days.forEach(day => {
        day.net = day.inflow - day.outflow;
      });
      
      return days;
    } catch (err) {
      console.error('Error fetching daily cash flow:', err);
      return [];
    }
  }, [getFilterConfig]);

  // Fetch cash flow categories with RBAC filtering
  const fetchCashFlowCategories = useCallback(async (startDate: string, endDate: string): Promise<CashFlowCategories> => {
    try {
      const filterConfig = getFilterConfig();
      
      // Fetch inflow by source with branch filtering
      let inflowQuery = supabase
        .from('pos_transactions')
        .select('transaction_source, total_amount')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', `${startDate}T00:00:00`)
        .lte('transaction_date', `${endDate}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        inflowQuery = inflowQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: inflowData } = await inflowQuery;
      
      // Fetch outflow by expense category with branch filtering
      let expensesQuery = supabase
        .from('expenses')
        .select('amount, expense_categories(name)')
        .in('status', ['approved'])
        .gte('date', startDate)
        .lte('date', endDate);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        expensesQuery = expensesQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: expensesData } = await expensesQuery;
      
      // Fetch payroll with branch filtering
      let payrollQuery = supabase
        .from('payroll_requests')
        .select('total_net')
        .in('status', ['approved', 'processed'])
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        payrollQuery = payrollQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: payrollData } = await payrollQuery;
      
      // Categorize inflow
      const inflowMap = new Map<string, number>();
      const inflowSourceNames: Record<string, string> = {
        'pos': 'Retail Sales',
        'pwa': 'PWA Sales',
        'delivery': 'Delivery Sales',
        'online': 'Online Sales'
      };
      
      inflowData?.forEach(transaction => {
        const source = transaction.transaction_source || 'pos';
        const sourceName = inflowSourceNames[source] || 'Other Sales';
        const amount = parseFloat(transaction.total_amount?.toString() || '0') || 0;
        inflowMap.set(sourceName, (inflowMap.get(sourceName) || 0) + amount);
      });
      
      // Categorize outflow
      const outflowMap = new Map<string, number>();
      
      expensesData?.forEach(expense => {
        const categoryName = (expense.expense_categories as any)?.name || 'Uncategorized';
        const amount = parseFloat(expense.amount?.toString() || '0') || 0;
        outflowMap.set(categoryName, (outflowMap.get(categoryName) || 0) + amount);
      });
      
      // Add payroll
      const payrollTotal = payrollData?.reduce((sum, p) => sum + (parseFloat(p.total_net?.toString() || '0') || 0), 0) || 0;
      if (payrollTotal > 0) {
        outflowMap.set('Payroll & Benefits', (outflowMap.get('Payroll & Benefits') || 0) + payrollTotal);
      }
      
      // Convert to arrays with percentages and trends
      const totalInflow = Array.from(inflowMap.values()).reduce((sum, val) => sum + val, 0);
      const totalOutflow = Array.from(outflowMap.values()).reduce((sum, val) => sum + val, 0);
      
      const inflowCategories: CashFlowCategory[] = Array.from(inflowMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalInflow > 0 ? (amount / totalInflow) * 100 : 0,
        trend: '+0%',
        positive: true
      })).sort((a, b) => b.amount - a.amount);
      
      const outflowCategories: CashFlowCategory[] = Array.from(outflowMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0,
        trend: '+0%',
        positive: false
      })).sort((a, b) => b.amount - a.amount);
      
      return {
        inflow: inflowCategories,
        outflow: outflowCategories
      };
    } catch (err) {
      console.error('Error fetching cash flow categories:', err);
      return { inflow: [], outflow: [] };
    }
  }, [getFilterConfig]);

  // Fetch recent transactions with RBAC filtering
  const fetchRecentTransactions = useCallback(async (limit: number = 10): Promise<RecentTransaction[]> => {
    try {
      const filterConfig = getFilterConfig();
      
      const transactions: RecentTransaction[] = [];
      
      // Fetch recent sales (inflow) with branch filtering
      let salesQuery = supabase
        .from('pos_transactions')
        .select('id, transaction_date, total_amount, transaction_source, branches(name)')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        salesQuery = salesQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: salesData } = await salesQuery;
      
      salesData?.forEach(sale => {
        const source = sale.transaction_source || 'pos';
        const sourceName = source === 'pos' ? 'Retail' : source === 'pwa' ? 'PWA' : source === 'delivery' ? 'Delivery' : 'Online';
        const branchName = (sale.branches as any)?.name || '';
        const timeAgo = getTimeAgo(new Date(sale.transaction_date));
        
        transactions.push({
          id: parseInt(sale.id.substring(0, 8), 16),
          type: 'inflow',
          description: `${sourceName} sales${branchName ? ` - ${branchName}` : ''}`,
          amount: parseFloat(sale.total_amount?.toString() || '0') || 0,
          time: timeAgo,
          category: 'Sales'
        });
      });
      
      // Fetch recent expenses (outflow) with branch filtering
      let expensesQuery = supabase
        .from('expenses')
        .select('id, date, amount, description, expense_categories(name)')
        .in('status', ['approved'])
        .order('date', { ascending: false })
        .limit(limit);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        expensesQuery = expensesQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: expensesData } = await expensesQuery;
      
      expensesData?.forEach(expense => {
        const categoryName = (expense.expense_categories as any)?.name || 'Expense';
        const timeAgo = getTimeAgo(new Date(expense.date));
        
        transactions.push({
          id: parseInt(expense.id.substring(0, 8), 16),
          type: 'outflow',
          description: expense.description || categoryName,
          amount: parseFloat(expense.amount?.toString() || '0') || 0,
          time: timeAgo,
          category: categoryName
        });
      });
      
      // Sort by time and limit
      transactions.sort((a, b) => {
        const timeA = getTimeFromAgo(a.time);
        const timeB = getTimeFromAgo(b.time);
        return timeB - timeA;
      });
      
      return transactions.slice(0, limit);
    } catch (err) {
      console.error('Error fetching recent transactions:', err);
      return [];
    }
  }, [getFilterConfig]);

  // Main refresh function
  const refreshData = useCallback(async (period: Period) => {
    setLoading(true);
    setError(null);
    
    try {
      const { start, end } = getDateRange(period);
      
      // Fetch all data in parallel
      const [
        totalInflow,
        totalOutflow,
        currentBalance,
        dailyFlow,
        categories,
        recent
      ] = await Promise.all([
        fetchTotalInflow(start, end),
        fetchTotalOutflow(start, end),
        fetchCurrentBalance(),
        fetchDailyCashFlow(start, end),
        fetchCashFlowCategories(start, end),
        fetchRecentTransactions(10)
      ]);
      
      const netCashFlow = totalInflow - totalOutflow;
      const workingCapital = currentBalance;
      
      setCashFlowData({
        currentBalance,
        netCashFlow,
        totalInflow,
        totalOutflow,
        workingCapital
      });
      
      setDailyCashFlow(dailyFlow);
      setCashFlowCategories(categories);
      setRecentTransactions(recent);
    } catch (err) {
      console.error('Error fetching cash flow data:', err);
      setError('Failed to load cash flow data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getDateRange, fetchTotalInflow, fetchTotalOutflow, fetchCurrentBalance, fetchDailyCashFlow, fetchCashFlowCategories, fetchRecentTransactions]);

  return {
    cashFlowData,
    dailyCashFlow,
    cashFlowCategories,
    recentTransactions,
    loading,
    error,
    refreshData
  };
};







