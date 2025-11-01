import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

export interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  employee_id: string;
  position: string;
  department: string;
  branch: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity' | 'study' | 'bereavement';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_date: string;
  applied_by: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Staff {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  branch: string;
}

interface UseLeaveManagementDataReturn {
  leaveRequests: LeaveRequest[];
  staffList: Staff[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for fetching leave management data with RBAC-based filtering
 * - Super Admin sees all leave requests
 * - Branch-based users (hr-staff) see only their branch leave requests
 */
export const useLeaveManagementData = (): UseLeaveManagementDataReturn => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
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

  // Load data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // Fetch staff list
      let staffQuery = supabase
        .from('staff')
        .select('id, employee_id, first_name, last_name, position, department, branch_id');

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        staffQuery = staffQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: staffData, error: staffError } = await staffQuery.order('first_name');
      if (staffError) throw staffError;

      // Transform staff data to include branch name
      const transformedStaff = await Promise.all(
        (staffData || []).map(async (staff) => {
          let branchName = 'Unknown';
          if (staff.branch_id) {
            const { data: branchData } = await supabase
              .from('branches')
              .select('name')
              .eq('id', staff.branch_id)
              .single();
            branchName = branchData?.name || 'Unknown';
          }
          return {
            id: staff.id,
            employee_id: staff.employee_id || '',
            first_name: staff.first_name,
            last_name: staff.last_name,
            position: staff.position || '',
            department: staff.department || '',
            branch: branchName
          };
        })
      );
      setStaffList(transformedStaff);

      // Fetch leave requests with staff information
      let leaveQuery = supabase
        .from('leave_requests')
        .select(`
          *,
          staff:staff_id (
            employee_id,
            first_name,
            last_name,
            position,
            department,
            branch_id
          )
        `)
        .order('created_at', { ascending: false });

      const { data: leaveData, error: leaveError } = await leaveQuery;
      if (leaveError) throw leaveError;

      // Transform and filter leave requests
      let transformedLeaves = (leaveData || []).map((leave: any) => {
        // Get branch name for staff
        let branchName = 'Unknown';
        if (leave.staff?.branch_id) {
          // We'll need to fetch branch name or include it in the query
          // For now, use branch_id lookup
        }

        return {
          ...leave,
          staff_name: `${leave.staff?.first_name || ''} ${leave.staff?.last_name || ''}`.trim(),
          employee_id: leave.staff?.employee_id || '',
          position: leave.staff?.position || '',
          department: leave.staff?.department || '',
          branch: branchName,
          branch_id: leave.staff?.branch_id || null
        };
      });

      // Filter by branch_id if needed
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        transformedLeaves = transformedLeaves.filter((leave: any) => 
          leave.branch_id === filterConfig.branchId
        );
      }

      // Fetch branch names for transformed leaves
      const branchIds = [...new Set(transformedLeaves.map((l: any) => l.branch_id).filter(Boolean))];
      if (branchIds.length > 0) {
        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, name')
          .in('id', branchIds);

        const branchMap = new Map(branchesData?.map(b => [b.id, b.name]) || []);

        transformedLeaves = transformedLeaves.map((leave: any) => ({
          ...leave,
          branch: branchMap.get(leave.branch_id) || 'Unknown'
        }));
      }

      setLeaveRequests(transformedLeaves);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    leaveRequests,
    staffList,
    loading,
    error,
    refreshData
  };
};

