import { supabase } from './supabase';

// Types for Staff Management
export interface Staff {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  branch_id?: string;
  hire_date: string;
  salary?: number;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  branch_id?: string;
  hire_date: string;
  salary?: number;
  is_active: boolean;
  role: string;
  employee_id?: string;
}

export interface UpdateStaffData extends Partial<CreateStaffData> {
  id: string;
}

// Types for User Management
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  password?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

// Types for Attendance
export interface AttendanceRecord {
  id: string;
  staff_id: string;
  attendance_date: string;
  time_in?: string;
  time_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  overtime_hours: number;
  status: string;
  notes: string;
  created_at: string;
}

export interface CreateAttendanceData {
  staff_id: string;
  attendance_date: string;
  time_in?: string;
  time_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  overtime_hours?: number;
  status?: string;
  notes?: string;
}

// Types for Leave Requests
export interface LeaveRequest {
  id: string;
  staff_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  approved_by?: string;
  approved_date?: string;
  emergency_contact: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequestData {
  staff_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  emergency_contact: string;
  days_requested?: number;
}

// Staff API Functions
export const staffApi = {
  // Get all staff members
  async getAllStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('hire_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get staff by ID
  async getStaffById(id: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new staff member
  async createStaff(staffData: CreateStaffData): Promise<Staff> {
    const payload = {
      ...staffData,
      employee_id: staffData.employee_id || `EMP-${Date.now()}`,
    };

    const { data, error } = await supabase
      .from('staff')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update staff member
  async updateStaff(staffData: UpdateStaffData): Promise<Staff> {
    const { id, ...updateData } = staffData;
    
    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete staff member
  async deleteStaff(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Search staff members
  async searchStaff(query: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,position.ilike.%${query}%`)
      .order('hire_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get staff by department
  async getStaffByDepartment(department: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('department', department)
      .order('first_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get staff by role
  async getStaffByRole(role: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('role', role)
      .order('first_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get active staff count
  async getActiveStaffCount(): Promise<number> {
    const { count, error } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (error) throw error;
    return count || 0;
  }
};

// User API Functions
export const userApi = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    // First create auth user if password is provided
    let authUserId: string | undefined;
    if (userData.password) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password
        });
        
        if (authError) throw authError;
        authUserId = authData.user?.id;
      } catch (authErr) {
        console.warn('Auth signup failed:', authErr);
      }
    }

    const payload = {
      ...userData,
      id: authUserId,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user
  async updateUser(userData: UpdateUserData): Promise<User> {
    const { id, ...updateData } = userData;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Update user status
  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Search users
  async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Attendance API Functions
export const attendanceApi = {
  // Get attendance records for a date range
  async getAttendanceRecords(startDate: string, endDate: string, staffId?: string): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .order('attendance_date', { ascending: true });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Create attendance record
  async createAttendanceRecord(attendanceData: CreateAttendanceData): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendanceData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update attendance record
  async updateAttendanceRecord(id: string, attendanceData: Partial<CreateAttendanceData>): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(attendanceData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get attendance summary for a date
  async getAttendanceSummary(date: string): Promise<{
    present: number;
    late: number;
    absent: number;
    totalHours: number;
  }> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('status, total_hours')
      .eq('attendance_date', date);
    
    if (error) throw error;

    const summary = {
      present: 0,
      late: 0,
      absent: 0,
      totalHours: 0
    };

    data?.forEach(record => {
      switch (record.status) {
        case 'present':
          summary.present++;
          break;
        case 'late':
          summary.late++;
          break;
        case 'absent':
          summary.absent++;
          break;
      }
      summary.totalHours += record.total_hours || 0;
    });

    return summary;
  }
};

// Leave Request API Functions
export const leaveRequestApi = {
  // Get leave requests for a date range
  async getLeaveRequests(startDate: string, endDate: string, status?: string): Promise<LeaveRequest[]> {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Create leave request
  async createLeaveRequest(leaveData: CreateLeaveRequestData): Promise<LeaveRequest> {
    const payload = {
      ...leaveData,
      status: 'pending',
      days_requested: leaveData.days_requested || this.calculateDays(leaveData.start_date, leaveData.end_date)
    };

    const { data, error } = await supabase
      .from('leave_requests')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update leave request status
  async updateLeaveRequestStatus(id: string, status: string, approvedBy?: string): Promise<LeaveRequest> {
    const updateData: any = { status };
    
    if (status === 'approved') {
      updateData.approved_date = new Date().toISOString();
      if (approvedBy) updateData.approved_by = approvedBy;
    } else if (status === 'rejected') {
      updateData.approved_date = null;
      updateData.approved_by = null;
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get leave requests by staff member
  async getLeaveRequestsByStaff(staffId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Calculate days between dates
  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  },

  // Get leave summary by type
  async getLeaveSummary(startDate: string, endDate: string): Promise<Record<string, { total: number; approved: number }>> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('leave_type, days_requested, status')
      .gte('start_date', startDate)
      .lte('start_date', endDate);
    
    if (error) throw error;

    const summary: Record<string, { total: number; approved: number }> = {};

    data?.forEach(record => {
      const type = record.leave_type;
      if (!summary[type]) {
        summary[type] = { total: 0, approved: 0 };
      }
      
      summary[type].total += record.days_requested || 0;
      if (record.status === 'approved') {
        summary[type].approved += record.days_requested || 0;
      }
    });

    return summary;
  }
};

// Branch API Functions
export const branchApi = {
  // Get all branches
  async getAllBranches(): Promise<Array<{ id: string; name: string; address: string; city: string; phone: string; manager_name: string; is_active: boolean }>> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};

// Export all APIs
export const staffManagementApi = {
  staff: staffApi,
  users: userApi,
  attendance: attendanceApi,
  leaveRequests: leaveRequestApi,
  branches: branchApi
};

