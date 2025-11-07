import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';
import { settingsService } from '../lib/settingsService';

export interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  period_type: 'monthly' | 'semi-monthly';
  status: 'draft' | 'processing' | 'completed' | 'cancelled';
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  employee_id: string;
  position: string;
  department: string;
  branch_id: string;
  branch_name: string;
  base_salary: number;
  days_present: number;
  daily_allowance: number;
  total_allowance: number;
  overtime_pay: number;
  bonuses: number;
  other_earnings: number;
  gross_pay: number;
  tax_deduction: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  cash_advances: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  period_id: string;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
  updated_at: string;
  adjustments?: any[];
}

interface UsePayrollCompensationDataReturn {
  payrollPeriods: PayrollPeriod[];
  payrollRecords: PayrollRecord[];
  branches: Array<{ id: string; name: string }>;
  hrSettings: any;
  loading: boolean;
  error: string | null;
  refreshPeriods: () => Promise<void>;
  refreshRecords: (periodId: string) => Promise<void>;
  loadBranches: () => Promise<void>;
  loadHRSettings: () => Promise<void>;
}

/**
 * Custom hook for fetching payroll compensation data with RBAC-based filtering
 * - Super Admin sees all payroll data
 * - Branch-based users (hr-staff) see only their branch payroll data
 */
export const usePayrollCompensationData = (): UsePayrollCompensationDataReturn => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [hrSettings, setHrSettings] = useState<any>(null);
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

  // Load HR settings
  const loadHRSettings = useCallback(async () => {
    try {
      const settings = await settingsService.getHRSettings();
      setHrSettings(settings);
    } catch (err: any) {
      console.error('Error loading HR settings:', err);
    }
  }, []);

  // Load branches
  const loadBranches = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();
      let query = supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('id', filterConfig.branchId);
      }

      const { data, error: fetchError } = await query.order('name');
      
      if (fetchError) throw fetchError;
      setBranches(data || []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  }, [getFilterConfig]);

  // Load payroll periods (no filtering - periods are global)
  const refreshPeriods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPayrollPeriods(data || []);
    } catch (err: any) {
      console.error('Error loading payroll data:', err);
      setError(err.message || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load payroll records for a specific period with RBAC filtering
  const refreshRecords = useCallback(async (periodId: string) => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // Fetch payroll records via RPC function
      const { data, error: rpcError } = await supabase
        .rpc('get_payroll_records_with_attendance', {
          p_period_id: periodId
        });

      if (rpcError) throw rpcError;

      // Filter by branch_id if needed (client-side filtering since RPC might not support branch filtering)
      let filteredRecords = data || [];
      
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        filteredRecords = filteredRecords.filter((record: any) => 
          record.branch_id === filterConfig.branchId
        );
      }

      setPayrollRecords(filteredRecords);
    } catch (err: any) {
      console.error('Error loading payroll records:', err);
      setError(err.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  useEffect(() => {
    loadBranches();
    loadHRSettings();
    refreshPeriods();
  }, [loadBranches, loadHRSettings, refreshPeriods]);

  return {
    payrollPeriods,
    payrollRecords,
    branches,
    hrSettings,
    loading,
    error,
    refreshPeriods,
    refreshRecords,
    loadBranches,
    loadHRSettings
  };
};










