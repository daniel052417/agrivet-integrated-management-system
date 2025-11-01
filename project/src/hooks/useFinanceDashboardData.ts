import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

interface TodayStats {
  totalSales: number;
  totalExpenses: number;
  cashBalance: number;
  profit: number;
}

interface MonthlyData {
  month: string;
  sales: number;
  expenses: number;
}

interface PreviousPeriodStats {
  yesterdaySales: number;
  yesterdayExpenses: number;
  previousMonthSales: number;
  previousMonthExpenses: number;
}

interface UseFinanceDashboardDataReturn {
  todayStats: TodayStats;
  monthlyData: MonthlyData[];
  previousPeriodStats: PreviousPeriodStats;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for fetching finance dashboard data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users see only their branch data
 */
export const useFinanceDashboardData = (): UseFinanceDashboardDataReturn => {
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalSales: 0,
    totalExpenses: 0,
    cashBalance: 0,
    profit: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [previousPeriodStats, setPreviousPeriodStats] = useState<PreviousPeriodStats>({
    yesterdaySales: 0,
    yesterdayExpenses: 0,
    previousMonthSales: 0,
    previousMonthExpenses: 0
  });
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

  // Fetch today's sales with RBAC filtering
  const fetchTodaySales = useCallback(async (): Promise<number> => {
    try {
      const filterConfig = getFilterConfig();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString().split('T')[0];
      const todayEnd = new Date(today).setHours(23, 59, 59, 999);
      const todayEndStr = new Date(todayEnd).toISOString().split('T')[0];

      let query = supabase
        .from('pos_transactions')
        .select('total_amount')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', `${todayStart}T00:00:00`)
        .lte('transaction_date', `${todayEndStr}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;
    } catch (err) {
      console.error('Error fetching today sales:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch yesterday's sales with RBAC filtering
  const fetchYesterdaySales = useCallback(async (): Promise<number> => {
    try {
      const filterConfig = getFilterConfig();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStart = yesterday.toISOString().split('T')[0];
      const yesterdayEnd = new Date(yesterday).setHours(23, 59, 59, 999);
      const yesterdayEndStr = new Date(yesterdayEnd).toISOString().split('T')[0];

      let query = supabase
        .from('pos_transactions')
        .select('total_amount')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', `${yesterdayStart}T00:00:00`)
        .lte('transaction_date', `${yesterdayEndStr}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;
    } catch (err) {
      console.error('Error fetching yesterday sales:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch today's expenses with RBAC filtering
  const fetchTodayExpenses = useCallback(async (): Promise<number> => {
    try {
      const filterConfig = getFilterConfig();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString().split('T')[0];

      let query = supabase
        .from('expenses')
        .select('amount')
        .in('status', ['approved', 'paid', 'processed'])
        .eq('date', todayStart);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const expensesTotal = data?.reduce((sum, e) => sum + (parseFloat(e.amount?.toString() || '0') || 0), 0) || 0;

      // Also include payroll for today
      let payrollQuery = supabase
        .from('payroll_requests')
        .select('total_net')
        .in('status', ['approved', 'processed'])
        .gte('created_at', `${todayStart}T00:00:00`)
        .lte('created_at', `${todayStart}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        payrollQuery = payrollQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: payrollData } = await payrollQuery;
      const payrollTotal = payrollData?.reduce((sum, p) => sum + (parseFloat(p.total_net?.toString() || '0') || 0), 0) || 0;

      return expensesTotal + payrollTotal;
    } catch (err) {
      console.error('Error fetching today expenses:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch yesterday's expenses with RBAC filtering
  const fetchYesterdayExpenses = useCallback(async (): Promise<number> => {
    try {
      const filterConfig = getFilterConfig();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStart = yesterday.toISOString().split('T')[0];

      let query = supabase
        .from('expenses')
        .select('amount')
        .in('status', ['approved', 'paid', 'processed'])
        .eq('date', yesterdayStart);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const expensesTotal = data?.reduce((sum, e) => sum + (parseFloat(e.amount?.toString() || '0') || 0), 0) || 0;

      // Also include payroll for yesterday
      let payrollQuery = supabase
        .from('payroll_requests')
        .select('total_net')
        .in('status', ['approved', 'processed'])
        .gte('created_at', `${yesterdayStart}T00:00:00`)
        .lte('created_at', `${yesterdayStart}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        payrollQuery = payrollQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: payrollData } = await payrollQuery;
      const payrollTotal = payrollData?.reduce((sum, p) => sum + (parseFloat(p.total_net?.toString() || '0') || 0), 0) || 0;

      return expensesTotal + payrollTotal;
    } catch (err) {
      console.error('Error fetching yesterday expenses:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch current cash balance with RBAC filtering
  const fetchCashBalance = useCallback(async (): Promise<number> => {
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
        return parseFloat(sessionData.ending_cash?.toString() || '0') || 0;
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
      console.error('Error fetching cash balance:', err);
      return 0;
    }
  }, [getFilterConfig]);

  // Fetch monthly data for last 6 months with RBAC filtering
  const fetchMonthlyData = useCallback(async (): Promise<MonthlyData[]> => {
    try {
      const filterConfig = getFilterConfig();
      const now = new Date();
      const monthlyDataArray: MonthlyData[] = [];

      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];
        const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short' });

        // Fetch sales for this month
        let salesQuery = supabase
          .from('pos_transactions')
          .select('total_amount')
          .eq('payment_status', 'completed')
          .eq('transaction_type', 'sale')
          .eq('status', 'active')
          .gte('transaction_date', `${monthStartStr}T00:00:00`)
          .lte('transaction_date', `${monthEndStr}T23:59:59`);

        if (filterConfig.shouldFilter && filterConfig.branchId) {
          salesQuery = salesQuery.eq('branch_id', filterConfig.branchId);
        }

        const { data: salesData, error: salesError } = await salesQuery;
        if (salesError) throw salesError;

        const sales = salesData?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;

        // Fetch expenses for this month
        let expensesQuery = supabase
          .from('expenses')
          .select('amount')
          .in('status', ['approved', 'paid', 'processed'])
          .gte('date', monthStartStr)
          .lte('date', monthEndStr);

        if (filterConfig.shouldFilter && filterConfig.branchId) {
          expensesQuery = expensesQuery.eq('branch_id', filterConfig.branchId);
        }

        const { data: expensesData, error: expensesError } = await expensesQuery;
        if (expensesError) throw expensesError;

        let expenses = expensesData?.reduce((sum, e) => sum + (parseFloat(e.amount?.toString() || '0') || 0), 0) || 0;

        // Also include payroll for this month
        let payrollQuery = supabase
          .from('payroll_requests')
          .select('total_net')
          .in('status', ['approved', 'processed'])
          .gte('created_at', `${monthStartStr}T00:00:00`)
          .lte('created_at', `${monthEndStr}T23:59:59`);

        if (filterConfig.shouldFilter && filterConfig.branchId) {
          payrollQuery = payrollQuery.eq('branch_id', filterConfig.branchId);
        }

        const { data: payrollData } = await payrollQuery;
        const payrollTotal = payrollData?.reduce((sum, p) => sum + (parseFloat(p.total_net?.toString() || '0') || 0), 0) || 0;
        
        expenses += payrollTotal;

        monthlyDataArray.push({
          month: monthLabel,
          sales,
          expenses
        });
      }

      return monthlyDataArray;
    } catch (err) {
      console.error('Error fetching monthly data:', err);
      return [];
    }
  }, [getFilterConfig]);

  // Fetch previous month totals for trend calculation
  const fetchPreviousMonthStats = useCallback(async (): Promise<{ sales: number; expenses: number }> => {
    try {
      const filterConfig = getFilterConfig();
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
      const previousMonthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);

      const monthStartStr = previousMonthStart.toISOString().split('T')[0];
      const monthEndStr = previousMonthEnd.toISOString().split('T')[0];

      // Fetch previous month sales
      let salesQuery = supabase
        .from('pos_transactions')
        .select('total_amount')
        .eq('payment_status', 'completed')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .gte('transaction_date', `${monthStartStr}T00:00:00`)
        .lte('transaction_date', `${monthEndStr}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        salesQuery = salesQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      const sales = salesData?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;

      // Fetch previous month expenses
      let expensesQuery = supabase
        .from('expenses')
        .select('amount')
        .in('status', ['approved', 'paid', 'processed'])
        .gte('date', monthStartStr)
        .lte('date', monthEndStr);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        expensesQuery = expensesQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: expensesData, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;

      let expenses = expensesData?.reduce((sum, e) => sum + (parseFloat(e.amount?.toString() || '0') || 0), 0) || 0;

      // Also include payroll for previous month
      let payrollQuery = supabase
        .from('payroll_requests')
        .select('total_net')
        .in('status', ['approved', 'processed'])
        .gte('created_at', `${monthStartStr}T00:00:00`)
        .lte('created_at', `${monthEndStr}T23:59:59`);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        payrollQuery = payrollQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: payrollData } = await payrollQuery;
      const payrollTotal = payrollData?.reduce((sum, p) => sum + (parseFloat(p.total_net?.toString() || '0') || 0), 0) || 0;
      
      expenses += payrollTotal;

      return { sales, expenses };
    } catch (err) {
      console.error('Error fetching previous month stats:', err);
      return { sales: 0, expenses: 0 };
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
        yesterdaySales,
        todayExpenses,
        yesterdayExpenses,
        cashBalance,
        monthly,
        previousMonth
      ] = await Promise.all([
        fetchTodaySales(),
        fetchYesterdaySales(),
        fetchTodayExpenses(),
        fetchYesterdayExpenses(),
        fetchCashBalance(),
        fetchMonthlyData(),
        fetchPreviousMonthStats()
      ]);

      const profit = todaySales - todayExpenses;

      setTodayStats({
        totalSales: todaySales,
        totalExpenses: todayExpenses,
        cashBalance,
        profit
      });

      setMonthlyData(monthly);
      setPreviousPeriodStats({
        yesterdaySales,
        yesterdayExpenses,
        previousMonthSales: previousMonth.sales,
        previousMonthExpenses: previousMonth.expenses
      });
    } catch (err) {
      console.error('Error fetching finance dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchTodaySales, fetchYesterdaySales, fetchTodayExpenses, fetchYesterdayExpenses, fetchCashBalance, fetchMonthlyData, fetchPreviousMonthStats]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    todayStats,
    monthlyData,
    previousPeriodStats,
    loading,
    error,
    refreshData
  };
};



