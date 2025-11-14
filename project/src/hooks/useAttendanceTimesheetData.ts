import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: string;
  notes: string | null;
}

export interface StaffInfo {
  name: string;
  position: string;
  department: string;
  active: boolean;
}

interface UseAttendanceTimesheetDataReturn {
  staffById: Map<string, StaffInfo>;
  staffOptions: Array<{ id: string; name: string }>;
  departmentOptions: string[];
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  refreshData: (selectedDate: string) => Promise<void>;
}

/**
 * Custom hook for fetching attendance timesheet data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users (hr-staff) see only their branch data
 */
export const useAttendanceTimesheetData = (): UseAttendanceTimesheetDataReturn => {
  const [staffById, setStaffById] = useState<Map<string, StaffInfo>>(new Map());
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(['all']);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
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

  // Helper functions for date range calculation
  const startOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const endOfWeek = (date: Date): Date => {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // Fetch data
  const refreshData = useCallback(async (selectedDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // Get staff IDs for the branch if filtering
      let staffIds: string[] = [];
      let staffQuery = supabase
        .from('staff')
        .select('id, first_name, last_name, position, department, is_active, branch_id');

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        staffQuery = staffQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: staffRows, error: staffErr } = await staffQuery.order('first_name', { ascending: true });
      if (staffErr) throw staffErr;

      const sMap = new Map<string, StaffInfo>();
      const deptSet = new Set<string>();

      (staffRows || []).forEach(s => {
        sMap.set(s.id, { 
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim(), 
          position: s.position || '', 
          department: s.department || '—', 
          active: !!s.is_active 
        });
        if (s.department) deptSet.add(s.department);
        
        // Collect staff IDs for filtering attendance records
        if (!filterConfig.shouldFilter || s.branch_id === filterConfig.branchId) {
          staffIds.push(s.id);
        }
      });

      setStaffById(sMap);
      setStaffOptions((staffRows || []).map(s => ({ 
        id: s.id, 
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() 
      })));
      setDepartmentOptions(['all', ...Array.from(deptSet.values())]);

      // Fetch attendance records for the week window
      const d = new Date(`${selectedDate}T00:00:00.000Z`);
      const start = startOfWeek(d);
      const end = endOfWeek(d);

      // Fetch attendance records
      let attendanceQuery = supabase
        .from('attendance_records')
        .select('id, staff_id, attendance_date, time_in, time_out, break_start, break_end, total_hours, overtime_hours, status, notes')
        .gte('attendance_date', start.toISOString())
        .lt('attendance_date', end.toISOString())
        .order('attendance_date', { ascending: true });

      // Filter by staff IDs if needed
      if (filterConfig.shouldFilter && staffIds.length > 0) {
        attendanceQuery = attendanceQuery.in('staff_id', staffIds);
      } else if (filterConfig.shouldFilter && staffIds.length === 0) {
        // No staff in this branch, return empty results
        attendanceQuery = attendanceQuery.eq('staff_id', 'no-staff-in-branch');
      }

      const { data: recs, error: recErr } = await attendanceQuery;
      if (recErr) throw recErr;

      setRecords(recs || []);
    } catch (e: any) {
      console.error('Failed to load attendance', e);
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  return {
    staffById,
    staffOptions,
    departmentOptions,
    records,
    loading,
    error,
    refreshData
  };
};

