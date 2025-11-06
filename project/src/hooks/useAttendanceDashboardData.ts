import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';
import { settingsService } from '../lib/settingsService';

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  branch_id: string;
  branch_name: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  is_late: boolean;
  late_minutes: number | null;
  notes: string | null;
  location: string | null;
  check_in_method: 'manual' | 'pin' | 'qr' | 'biometric';
  corrected_by: string | null;
  correction_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffSummary {
  staff_id: string;
  staff_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  total_hours: number;
  overtime_hours: number;
  allowance_eligible_days: number;
}

export interface AttendanceStats {
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  averageHours: number;
  totalOvertime: number;
  attendanceRate: number;
}

interface UseAttendanceDashboardDataReturn {
  attendanceRecords: AttendanceRecord[];
  staffSummaries: StaffSummary[];
  stats: AttendanceStats;
  branches: Array<{ id: string; name: string }>;
  staffList: Array<{ id: string; name: string; pin: string }>;
  hrSettings: any;
  loading: boolean;
  error: string | null;
  success: string | null;
  refreshData: (date: string) => Promise<void>;
  refreshSummary: (startDate: string, endDate: string) => Promise<void>;
  loadHRSettings: () => Promise<void>;
  loadInitialData: () => Promise<void>;
}

/**
 * Custom hook for fetching attendance dashboard data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users (hr-staff) see only their branch data
 */
export const useAttendanceDashboardData = (): UseAttendanceDashboardDataReturn => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
    averageHours: 0,
    totalOvertime: 0,
    attendanceRate: 0
  });
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; pin: string }>>([]);
  const [hrSettings, setHrSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Load initial data (branches and staff list)
  const loadInitialData = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();

      // Load branches
      let branchesQuery = supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        branchesQuery = branchesQuery.eq('id', filterConfig.branchId);
      }

      const { data: branchesData } = await branchesQuery.order('name');
      setBranches(branchesData || []);

      // Load staff list
      let staffQuery = supabase
        .from('staff')
        .select('id, first_name, last_name, attendance_id')
        .eq('is_active', true);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        staffQuery = staffQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: staffData } = await staffQuery.order('first_name');
      
      setStaffList(staffData?.map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        pin: s.attendance_id || ''
      })) || []);
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message);
    }
  }, [getFilterConfig]);

  // Load attendance data for a specific date
  const refreshData = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      let query = supabase
        .from('attendance')
        .select(`
          *,
          staff:staff_id (
            id,
            first_name,
            last_name,
            position,
            department,
            branch_id,
            branches:branch_id (
              id,
              name
            )
          )
        `)
        .eq('attendance_date', date)
        .order('time_in', { ascending: true });

      // Filter by staff's branch_id for non-super-admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        // We need to filter through the staff relationship
        // Since Supabase doesn't support filtering nested relationships directly,
        // we'll filter after fetching or use a different approach
        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        // Filter in-memory based on staff's branch_id
        const filteredData = (data || []).filter((record: any) => 
          record.staff?.branch_id === filterConfig.branchId
        );

        const transformedData: AttendanceRecord[] = filteredData.map((record: any) => ({
          id: record.id,
          staff_id: record.staff_id,
          staff_name: `${record.staff.first_name} ${record.staff.last_name}`,
          position: record.staff.position || 'N/A',
          department: record.staff.department || 'N/A',
          branch_id: record.staff.branch_id,
          branch_name: record.staff.branches?.name || 'Unknown',
          attendance_date: record.attendance_date,
          time_in: record.time_in,
          time_out: record.time_out,
          break_start: record.break_start,
          break_end: record.break_end,
          total_hours: record.total_hours,
          overtime_hours: record.overtime_hours,
          status: record.status,
          is_late: record.is_late || false,
          late_minutes: record.late_minutes,
          notes: record.notes,
          location: record.location,
          check_in_method: record.check_in_method || 'manual',
          corrected_by: record.corrected_by,
          correction_reason: record.correction_reason,
          created_at: record.created_at,
          updated_at: record.updated_at
        }));

        setAttendanceRecords(transformedData);

        // Calculate stats
        const totalStaff = transformedData.length;
        const presentToday = transformedData.filter(r => r.status === 'present').length;
        const absentToday = transformedData.filter(r => r.status === 'absent').length;
        const lateToday = transformedData.filter(r => r.is_late).length;
        const onLeaveToday = transformedData.filter(r => r.status === 'on_leave').length;
        const totalHoursWorked = transformedData.reduce((sum, r) => sum + (r.total_hours || 0), 0);
        const averageHours = totalStaff > 0 ? totalHoursWorked / totalStaff : 0;
        const totalOvertime = transformedData.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
        const attendanceRate = totalStaff > 0 ? (presentToday / totalStaff) * 100 : 0;

        setStats({
          totalStaff,
          presentToday,
          absentToday,
          lateToday,
          onLeaveToday,
          averageHours,
          totalOvertime,
          attendanceRate
        });
      } else {
        // Super admin sees all data
        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        const transformedData: AttendanceRecord[] = (data || []).map((record: any) => ({
          id: record.id,
          staff_id: record.staff_id,
          staff_name: `${record.staff.first_name} ${record.staff.last_name}`,
          position: record.staff.position || 'N/A',
          department: record.staff.department || 'N/A',
          branch_id: record.staff.branch_id,
          branch_name: record.staff.branches?.name || 'Unknown',
          attendance_date: record.attendance_date,
          time_in: record.time_in,
          time_out: record.time_out,
          break_start: record.break_start,
          break_end: record.break_end,
          total_hours: record.total_hours,
          overtime_hours: record.overtime_hours,
          status: record.status,
          is_late: record.is_late || false,
          late_minutes: record.late_minutes,
          notes: record.notes,
          location: record.location,
          check_in_method: record.check_in_method || 'manual',
          corrected_by: record.corrected_by,
          correction_reason: record.correction_reason,
          created_at: record.created_at,
          updated_at: record.updated_at
        }));

        setAttendanceRecords(transformedData);

        // Calculate stats
        const totalStaff = transformedData.length;
        const presentToday = transformedData.filter(r => r.status === 'present').length;
        const absentToday = transformedData.filter(r => r.status === 'absent').length;
        const lateToday = transformedData.filter(r => r.is_late).length;
        const onLeaveToday = transformedData.filter(r => r.status === 'on_leave').length;
        const totalHoursWorked = transformedData.reduce((sum, r) => sum + (r.total_hours || 0), 0);
        const averageHours = totalStaff > 0 ? totalHoursWorked / totalStaff : 0;
        const totalOvertime = transformedData.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
        const attendanceRate = totalStaff > 0 ? (presentToday / totalStaff) * 100 : 0;

        setStats({
          totalStaff,
          presentToday,
          absentToday,
          lateToday,
          onLeaveToday,
          averageHours,
          totalOvertime,
          attendanceRate
        });
      }
    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  // Load attendance summary for date range
  const refreshSummary = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // If using RPC function, we might need to pass branch_id as parameter
      // For now, fetch all and filter client-side, or modify RPC to accept branch_id
      const { data, error: fetchError } = await supabase
        .rpc('get_attendance_summary', {
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (fetchError) throw fetchError;

      // Filter by branch_id if needed
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        // Note: This requires the RPC function to return branch_id in the summary
        // If not available, we'd need to filter differently
        // For now, filter if branch_id is available in the result
        const filteredData = (data || []).filter((summary: any) => {
          // If summary includes branch_id or staff info with branch_id, filter it
          return summary.branch_id === filterConfig.branchId || 
                 summary.staff?.branch_id === filterConfig.branchId;
        });
        setStaffSummaries(filteredData);
      } else {
        setStaffSummaries(data || []);
      }
    } catch (err: any) {
      console.error('Error loading attendance summary:', err);
      setError(err.message || 'Failed to load attendance summary');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  return {
    attendanceRecords,
    staffSummaries,
    stats,
    branches,
    staffList,
    hrSettings,
    loading,
    error,
    success,
    refreshData,
    refreshSummary,
    loadHRSettings,
    loadInitialData
  };
};









