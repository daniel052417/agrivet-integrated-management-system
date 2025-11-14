import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  pendingApprovals: number;
  averageAttendance: number;
  leaveRequests: number;
}

interface UseHRDashboardDataReturn {
  hrMetrics: HRMetrics;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for fetching HR dashboard data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users (hr-staff) see only their branch data
 */
export const useHRDashboardData = (): UseHRDashboardDataReturn => {
  const [hrMetrics, setHrMetrics] = useState<HRMetrics>({
    totalEmployees: 0,
    activeEmployees: 0,
    newHires: 0,
    pendingApprovals: 0,
    averageAttendance: 0,
    leaveRequests: 0
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

  // Fetch HR metrics with RBAC filtering
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // Fetch staff count
      let staffQuery = supabase
        .from('staff')
        .select('id, is_active, hire_date, branch_id', { count: 'exact' });

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        staffQuery = staffQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: staffData, error: staffError } = await staffQuery;
      if (staffError) throw staffError;

      const totalEmployees = staffData?.length || 0;
      const activeEmployees = staffData?.filter(s => s.is_active).length || 0;

      // New hires in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newHires = staffData?.filter(s => {
        if (!s.hire_date) return false;
        const hireDate = new Date(s.hire_date);
        return hireDate >= thirtyDaysAgo;
      }).length || 0;

      // Fetch pending leave requests
      // First, get staff IDs for the branch if filtering
      let staffIds: string[] = [];
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        const { data: branchStaff } = await supabase
          .from('staff')
          .select('id')
          .eq('branch_id', filterConfig.branchId);
        staffIds = branchStaff?.map(s => s.id) || [];
      }

      let leaveQuery = supabase
        .from('leave_requests')
        .select('id, status, staff_id');

      if (filterConfig.shouldFilter && staffIds.length > 0) {
        leaveQuery = leaveQuery.in('staff_id', staffIds);
      } else if (filterConfig.shouldFilter && staffIds.length === 0) {
        // No staff in this branch, no leave requests
        leaveQuery = leaveQuery.eq('staff_id', 'no-staff-in-branch');
      }

      const { data: leaveData, error: leaveError } = await leaveQuery;
      if (leaveError) throw leaveError;

      const pendingApprovals = leaveData?.filter(l => l.status === 'pending').length || 0;
      const leaveRequests = leaveData?.filter(l => l.status === 'pending' || l.status === 'approved').length || 0;

      // Fetch attendance data for average attendance calculation
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Get staff IDs for the branch if filtering
      let attendanceStaffIds: string[] = [];
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        const { data: branchStaff } = await supabase
          .from('staff')
          .select('id')
          .eq('branch_id', filterConfig.branchId);
        attendanceStaffIds = branchStaff?.map(s => s.id) || [];
      }

      let attendanceQuery = supabase
        .from('attendance')
        .select('id, status, staff_id')
        .eq('attendance_date', currentDate);

      if (filterConfig.shouldFilter && attendanceStaffIds.length > 0) {
        attendanceQuery = attendanceQuery.in('staff_id', attendanceStaffIds);
      } else if (filterConfig.shouldFilter && attendanceStaffIds.length === 0) {
        // No staff in this branch, no attendance records
        attendanceQuery = attendanceQuery.eq('staff_id', 'no-staff-in-branch');
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const totalCount = attendanceData?.length || 0;
      const averageAttendance = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

      setHrMetrics({
        totalEmployees,
        activeEmployees,
        newHires,
        pendingApprovals,
        averageAttendance,
        leaveRequests
      });
    } catch (err: any) {
      console.error('Error fetching HR dashboard data:', err);
      setError(err.message || 'Failed to load HR dashboard data');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    hrMetrics,
    loading,
    error,
    refreshData: fetchMetrics
  };
};

