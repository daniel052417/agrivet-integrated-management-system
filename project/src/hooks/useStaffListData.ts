import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  department: string;
  position: string;
  branch_id: string;
  is_active: boolean;
  role: string;
  phone: string;
  hire_date: string;
  salary: number;
  daily_allowance: number;
  employment_status: 'active' | 'resigned' | 'terminated' | 'on-leave';
  employment_type: 'regular' | 'probationary' | 'part-time' | 'contractual';
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  resignation_date?: string;
  termination_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  branches?: {
    id: string;
    name: string;
  };
}

export interface EmploymentHistory {
  id: string;
  staff_id: string;
  change_type: 'position' | 'branch' | 'salary' | 'status' | 'type';
  old_value: string;
  new_value: string;
  effective_date: string;
  notes?: string;
  changed_by: string;
  created_at: string;
}

interface UseStaffListDataReturn {
  staffMembers: StaffMember[];
  branches: Array<{ id: string; name: string }>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  loadBranches: () => Promise<void>;
  loadEmploymentHistory: (staffId: string) => Promise<EmploymentHistory[]>;
}

/**
 * Custom hook for fetching staff list data with RBAC-based filtering
 * - Super Admin sees all staff
 * - Branch-based users (hr-staff) see only their branch staff
 */
export const useStaffListData = (): UseStaffListDataReturn => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
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

  // Load staff members
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      let query = supabase
        .from('staff')
        .select(`
          id,
          first_name,
          last_name,
          email,
          employee_id,
          department,
          position,
          branch_id,
          is_active,
          role,
          phone,
          hire_date,
          salary,
          daily_allowance,
          employment_status,
          employment_type,
          address,
          emergency_contact,
          emergency_phone,
          resignation_date,
          termination_date,
          notes,
          created_at,
          updated_at,
          branches:branch_id (
            id,
            name
          )
        `);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      const { data: staffData, error: staffError } = await query.order('created_at', { ascending: false });

      if (staffError) throw staffError;
      setStaffMembers(staffData || []);
    } catch (err: any) {
      console.error('Error loading staff members:', err);
      setError(err.message || 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  // Load employment history for a specific staff member
  const loadEmploymentHistory = useCallback(async (staffId: string): Promise<EmploymentHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('employment_history')
        .select('*')
        .eq('staff_id', staffId)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error loading employment history:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    refreshData();
    loadBranches();
  }, [refreshData, loadBranches]);

  return {
    staffMembers,
    branches,
    loading,
    error,
    refreshData,
    loadBranches,
    loadEmploymentHistory
  };
};



