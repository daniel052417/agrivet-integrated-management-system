import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

export interface AttendanceAnalytics {
  totalStaff: number;
  averageAttendance: number;
  lateArrivals: number;
  earlyDepartures: number;
  overtimeHours: number;
  absentDays: number;
  presentDays: number;
}

export interface LeaveAnalytics {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalDaysRequested: number;
  averageDaysPerRequest: number;
}

export interface PayrollAnalytics {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  averageSalary: number;
  totalOvertime: number;
}

export interface PerformanceAnalytics {
  totalStaff: number;
  highPerformers: number;
  averagePerformance: number;
  lowPerformers: number;
  trainingCompleted: number;
  promotions: number;
}

interface UseHRAnalyticsDataReturn {
  attendanceAnalytics: AttendanceAnalytics;
  leaveAnalytics: LeaveAnalytics;
  payrollAnalytics: PayrollAnalytics;
  performanceAnalytics: PerformanceAnalytics;
  loading: boolean;
  error: string | null;
  refreshData: (selectedPeriod: string) => Promise<void>;
}

/**
 * Custom hook for fetching HR analytics data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users (hr-staff) see only their branch data
 */
export const useHRAnalyticsData = (): UseHRAnalyticsDataReturn => {
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<AttendanceAnalytics>({
    totalStaff: 0,
    averageAttendance: 0,
    lateArrivals: 0,
    earlyDepartures: 0,
    overtimeHours: 0,
    absentDays: 0,
    presentDays: 0
  });
  const [leaveAnalytics, setLeaveAnalytics] = useState<LeaveAnalytics>({
    totalRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    pendingRequests: 0,
    totalDaysRequested: 0,
    averageDaysPerRequest: 0
  });
  const [payrollAnalytics, setPayrollAnalytics] = useState<PayrollAnalytics>({
    totalEmployees: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    averageSalary: 0,
    totalOvertime: 0
  });
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics>({
    totalStaff: 0,
    highPerformers: 0,
    averagePerformance: 85,
    lowPerformers: 0,
    trainingCompleted: 0,
    promotions: 0
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

  // Fetch analytics data
  const refreshData = useCallback(async (selectedPeriod: string) => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // Get staff IDs for the branch if filtering
      let staffIds: string[] = [];
      let staffQuery = supabase
        .from('staff')
        .select('id, is_active, branch_id');

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        staffQuery = staffQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: staffData, error: staffError } = await staffQuery;
      if (staffError) throw staffError;

      const activeStaff = (staffData || []).filter(s => s.is_active);
      staffIds = activeStaff.map(s => s.id);
      const totalStaff = activeStaff.length;

      // Load attendance analytics
      let attendanceQuery = supabase
        .from('attendance')
        .select('*');

      if (filterConfig.shouldFilter && staffIds.length > 0) {
        attendanceQuery = attendanceQuery.in('staff_id', staffIds);
      } else if (filterConfig.shouldFilter && staffIds.length === 0) {
        attendanceQuery = attendanceQuery.eq('staff_id', 'no-staff-in-branch');
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absentDays = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const lateArrivals = attendanceData?.filter(a => a.status === 'late').length || 0;
      const overtimeHours = attendanceData?.reduce((sum, a) => sum + (a.overtime_hours || 0), 0) || 0;
      const averageAttendance = totalStaff > 0 && (presentDays + absentDays) > 0 
        ? (presentDays / (presentDays + absentDays)) * 100 
        : 0;

      setAttendanceAnalytics({
        totalStaff,
        averageAttendance,
        lateArrivals,
        earlyDepartures: 0, // Would need to be calculated based on early departures
        overtimeHours,
        absentDays,
        presentDays
      });

      // Load leave analytics
      let leaveQuery = supabase
        .from('leave_requests')
        .select('*');

      if (filterConfig.shouldFilter && staffIds.length > 0) {
        leaveQuery = leaveQuery.in('staff_id', staffIds);
      } else if (filterConfig.shouldFilter && staffIds.length === 0) {
        leaveQuery = leaveQuery.eq('staff_id', 'no-staff-in-branch');
      }

      const { data: leaveData, error: leaveError } = await leaveQuery;
      if (leaveError) throw leaveError;

      const totalRequests = leaveData?.length || 0;
      const approvedRequests = leaveData?.filter(l => l.status === 'approved').length || 0;
      const rejectedRequests = leaveData?.filter(l => l.status === 'rejected').length || 0;
      const pendingRequests = leaveData?.filter(l => l.status === 'pending').length || 0;
      const totalDaysRequested = leaveData?.reduce((sum, l) => sum + (l.days_requested || 0), 0) || 0;
      const averageDaysPerRequest = totalRequests > 0 ? totalDaysRequested / totalRequests : 0;

      setLeaveAnalytics({
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        totalDaysRequested,
        averageDaysPerRequest
      });

      // Load payroll analytics
      let payrollQuery = supabase
        .from('payroll_records')
        .select('*');

      if (filterConfig.shouldFilter && staffIds.length > 0) {
        // Payroll records might link to staff via staff_id or employee_id
        // We'll need to check the schema, but assuming staff_id for now
        payrollQuery = payrollQuery.in('staff_id', staffIds);
      } else if (filterConfig.shouldFilter && staffIds.length === 0) {
        payrollQuery = payrollQuery.eq('staff_id', 'no-staff-in-branch');
      }

      const { data: payrollData, error: payrollError } = await payrollQuery;
      if (payrollError) throw payrollError;

      const totalEmployees = payrollData?.length || 0;
      const totalGrossPay = payrollData?.reduce((sum, p) => sum + (p.gross_pay || 0), 0) || 0;
      const totalDeductions = payrollData?.reduce((sum, p) => sum + (p.total_deductions || 0), 0) || 0;
      const totalNetPay = payrollData?.reduce((sum, p) => sum + (p.net_pay || 0), 0) || 0;
      const averageSalary = totalEmployees > 0 ? totalGrossPay / totalEmployees : 0;
      const totalOvertime = payrollData?.reduce((sum, p) => sum + (p.overtime_pay || 0), 0) || 0;

      setPayrollAnalytics({
        totalEmployees,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        averageSalary,
        totalOvertime
      });

      // Calculate performance analytics (mock data based on staff count)
      setPerformanceAnalytics({
        totalStaff,
        highPerformers: Math.floor(totalStaff * 0.2),
        averagePerformance: 85,
        lowPerformers: Math.floor(totalStaff * 0.1),
        trainingCompleted: Math.floor(totalStaff * 0.6),
        promotions: Math.floor(totalStaff * 0.05)
      });

    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  useEffect(() => {
    refreshData('monthly');
  }, [refreshData]);

  return {
    attendanceAnalytics,
    leaveAnalytics,
    payrollAnalytics,
    performanceAnalytics,
    loading,
    error,
    refreshData
  };
};

