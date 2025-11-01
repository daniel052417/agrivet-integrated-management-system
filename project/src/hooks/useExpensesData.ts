import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';
import type { SimplifiedUser } from '../lib/simplifiedAuth';
import type { 
  Expense, 
  ExpenseRequest, 
  ExpenseCategory, 
  Branch, 
  ExpenseWithRelations,
  ExpenseRequestWithRelations
} from '../lib/supabase';

interface UseExpensesDataReturn {
  expenses: ExpenseWithRelations[];
  expenseRequests: ExpenseRequestWithRelations[];
  payrollRequests: any[];
  categories: ExpenseCategory[];
  branches: Branch[];
  totalSales: number;
  previousPeriodTotalSales: number;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  fetchPayrollRequestItems: (requestId: string) => Promise<any[]>;
}

/**
 * Custom hook for fetching expenses data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users see only their branch data
 */
export const useExpensesData = (): UseExpensesDataReturn => {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequestWithRelations[]>([]);
  const [payrollRequests, setPayrollRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [previousPeriodTotalSales, setPreviousPeriodTotalSales] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user and determine filtering rules
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

  // Fetch categories (no branch filtering needed)
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  }, []);

  // Fetch branches (filtered for branch users)
  const fetchBranches = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();
      let query = supabase
        .from('branches')
        .select('*');

      // Branch users only see their own branch
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('id', filterConfig.branchId);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setBranches(data || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  }, [getFilterConfig]);

  // Fetch expenses with RBAC filtering
  const fetchExpenses = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();
      
      let query = supabase
        .from('expenses')
        .select(`
          *,
          expense_categories(id, name),
          branches(id, name),
          users(id, first_name, last_name, email)
        `);

      // Apply branch filter for non-super-admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
    }
  }, [getFilterConfig]);

  // Fetch expense requests with RBAC filtering
  const fetchExpenseRequests = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();
      
      let query = supabase
        .from('expense_requests')
        .select(`
          *,
          expense_categories(id, name),
          branches(id, name),
          users(id, first_name, last_name, email),
          expense_request_attachments(*),
          approvals(*, users(id, first_name, last_name, email))
        `);

      // Apply branch filter for non-super-admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });
      
      if (error) throw error;
      setExpenseRequests(data || []);
    } catch (err) {
      console.error('Error fetching expense requests:', err);
      setError('Failed to load expense requests');
    }
  }, [getFilterConfig]);

  // Fetch payroll requests with RBAC filtering
  const fetchPayrollRequests = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();
      
      let query = supabase
        .from('payroll_requests')
        .select(`
          id, period_id, scope, branch_id, total_employees, total_gross, total_deductions, total_net,
          status, requested_by, notes, created_at, updated_at
        `);

      // Apply branch filter for non-super-admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const periodIds = Array.from(new Set((data || []).map(r => r.period_id).filter(Boolean)));
      const branchIds = Array.from(new Set((data || []).map(r => r.branch_id).filter(Boolean)));

      let periodsMap: Record<string, any> = {};
      let branchesMap: Record<string, any> = {};

      if (periodIds.length > 0) {
        const { data: periodRows } = await supabase
          .from('payroll_periods')
          .select('id,name')
          .in('id', periodIds);
        (periodRows || []).forEach(p => { periodsMap[p.id] = p; });
      }
      if (branchIds.length > 0) {
        const { data: branchRows } = await supabase
          .from('branches')
          .select('id,branch_name')
          .in('id', branchIds);
        (branchRows || []).forEach(b => { branchesMap[b.id] = b; });
      }

      const enriched = (data || []).map(r => ({
        ...r,
        period_name: periodsMap[r.period_id]?.name || '—',
        branch_name: r.branch_id ? (branchesMap[r.branch_id]?.branch_name || '—') : 'All'
      }));

      setPayrollRequests(enriched);
    } catch (err) {
      console.error('Error fetching payroll requests:', err);
      setError('Failed to load payroll requests');
    }
  }, [getFilterConfig]);

  // Fetch payroll request items (no branch filtering needed, already filtered by request)
  const fetchPayrollRequestItems = useCallback(async (requestId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('payroll_request_items')
        .select(`id, payroll_record_id, employee_id, gross_pay, total_deductions, net_pay, status, created_at`)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const recordIds = Array.from(new Set((data || []).map(i => i.payroll_record_id)));
      let recordMap: Record<string, any> = {};
      
      if (recordIds.length > 0) {
        const { data: recRows } = await supabase
          .from('payroll_records')
          .select('id, employee_id, staff_name, position, branch_name')
          .in('id', recordIds);
        (recRows || []).forEach(r => { recordMap[r.id] = r; });
      }
      
      const withLabels = (data || []).map(i => ({
        ...i,
        record: recordMap[i.payroll_record_id] || null
      }));
      
      return withLabels;
    } catch (err) {
      console.error('Error fetching payroll request items:', err);
      setError('Failed to load payroll request items');
      return [];
    }
  }, []);

  // Fetch total sales for Net Income calculation (with branch filtering)
  const fetchTotalSales = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // Build base query for current month sales
      let currentQuery = supabase
        .from('pos_transactions')
        .select('total_amount, branch_id')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', monthStart.toISOString().split('T')[0]);

      // Apply branch filter for non-super-admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        currentQuery = currentQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: currentData, error: currentError } = await currentQuery;
      
      if (currentError) throw currentError;
      
      // Build base query for previous month sales
      let previousQuery = supabase
        .from('pos_transactions')
        .select('total_amount, branch_id')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', previousMonthStart.toISOString().split('T')[0])
        .lte('transaction_date', previousMonthEnd.toISOString().split('T')[0]);

      // Apply branch filter for non-super-admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        previousQuery = previousQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: previousData, error: previousError } = await previousQuery;
      
      if (previousError) throw previousError;
      
      const currentSales = currentData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const previousSales = previousData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      
      setTotalSales(currentSales);
      setPreviousPeriodTotalSales(previousSales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setTotalSales(0);
      setPreviousPeriodTotalSales(0);
    }
  }, [getFilterConfig]);

  // Main refresh function
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCategories(),
        fetchBranches(),
        fetchExpenses(),
        fetchExpenseRequests(),
        fetchPayrollRequests(),
        fetchTotalSales()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchBranches, fetchExpenses, fetchExpenseRequests, fetchPayrollRequests, fetchTotalSales]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    expenses,
    expenseRequests,
    payrollRequests,
    categories,
    branches,
    totalSales,
    previousPeriodTotalSales,
    loading,
    error,
    refreshData,
    fetchPayrollRequestItems
  };
};



