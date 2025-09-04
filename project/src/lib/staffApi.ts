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
  user_account_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Enhanced Staff with User Account Information
export interface StaffWithAccount extends Staff {
  userAccount?: User;
  linkStatus?: 'active' | 'inactive' | 'transferred';
  linkedAt?: string;
  workflowStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  accountCreationMethod?: 'manual' | 'email_invite' | 'auto_create';
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

// Enhanced Staff Creation with Account Option
export interface CreateStaffWithAccountData extends CreateStaffData {
  createUserAccount: boolean;
  accountDetails?: {
    username?: string;
    password?: string;
    role: string;
    sendEmailInvite: boolean;
  };
}

// Staff-User Link Types
export interface StaffUserLink {
  id: string;
  staff_id: string;
  user_id: string;
  link_status: 'active' | 'inactive' | 'transferred';
  linked_at: string;
  unlinked_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Account Creation Workflow Types
export interface AccountCreationWorkflow {
  id: string;
  staff_id: string;
  workflow_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  account_creation_method?: 'manual' | 'email_invite' | 'auto_create';
  email_invite_sent_at?: string;
  account_created_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Email Invitation Types
export interface EmailInvitation {
  id: string;
  staff_id: string;
  email: string;
  invitation_token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  accepted_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Audit Log Types
export interface AccountAuditLog {
  id: string;
  actor_email?: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'suspend' | 'link' | 'unlink' | 'transfer';
  target_user_email: string;
  target_user_id?: string;
  target_staff_id?: string;
  details?: Record<string, any>;
  created_at: string;
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
    // For staff account creation, we'll create a regular user record
    // without Supabase Auth integration to avoid circular dependencies
    
    // Prepare payload - let the database auto-generate the ID
    const payload = {
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone_number: userData.phone,
      role: userData.role,
      is_active: userData.is_active ?? true,
      // Don't include password_hash for now - can be set later if needed
      // Don't include id - let database auto-generate
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

// Staff-User Account Linking API
export const staffUserApi = {
  // Link existing staff to existing user account
  async linkStaffToUser(staffId: string, userId: string): Promise<StaffUserLink> {
    const { data, error } = await supabase.rpc('create_staff_user_link', {
      p_staff_id: staffId,
      p_user_id: userId
    });
    
    if (error) throw error;
    
    // Get the created link
    const { data: linkData, error: linkError } = await supabase
      .from('staff_user_links')
      .select('*')
      .eq('staff_id', staffId)
      .eq('user_id', userId)
      .single();
    
    if (linkError) throw linkError;
    return linkData;
  },

  // Create user account for existing staff
  async createUserForStaff(staffId: string, userData: CreateUserData): Promise<{ user: User; link: StaffUserLink }> {
    // First create the user account
    const user = await userApi.createUser(userData);
    
    // Then link it to the staff
    const link = await this.linkStaffToUser(staffId, user.id);
    
    return { user, link };
  },

  // Get staff with linked user account info
  async getStaffWithUserAccount(staffId: string): Promise<StaffWithAccount | null> {
    const { data, error } = await supabase
      .from('staff_with_accounts')
      .select('*')
      .eq('id', staffId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all staff without user accounts
  async getStaffWithoutAccounts(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .is('user_account_id', null)
      .eq('is_active', true)
      .order('hire_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Unlink staff from user account
  async unlinkStaffFromUser(staffId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('unlink_staff_user', {
      p_staff_id: staffId,
      p_user_id: userId
    });
    
    if (error) throw error;
  },

  // Transfer staff account to different user
  async transferStaffAccount(staffId: string, newUserId: string): Promise<void> {
    // First get the current link
    const { data: currentLink, error: linkError } = await supabase
      .from('staff_user_links')
      .select('*')
      .eq('staff_id', staffId)
      .eq('link_status', 'active')
      .single();
    
    if (linkError) throw linkError;
    
    if (currentLink) {
      // Unlink from current user
      await this.unlinkStaffFromUser(staffId, currentLink.user_id);
    }
    
    // Link to new user
    await this.linkStaffToUser(staffId, newUserId);
  }
};

// Enhanced Staff Creation API
export const enhancedStaffApi = {
  // Create staff with optional user account creation
  async createStaffWithAccount(
    staffData: CreateStaffWithAccountData
  ): Promise<{ staff: Staff; user?: User; workflow?: AccountCreationWorkflow }> {
    // Create the staff record first
    const { createUserAccount, accountDetails, ...baseStaffData } = staffData;
    const staff = await staffApi.createStaff(baseStaffData);
    
    let user: User | undefined;
    let workflow: AccountCreationWorkflow | undefined;
    
    if (createUserAccount && accountDetails) {
      // Create workflow record
      const { data: workflowData, error: workflowError } = await supabase
        .from('account_creation_workflow')
        .insert({
          staff_id: staff.id,
          workflow_status: 'in_progress',
          account_creation_method: accountDetails.sendEmailInvite ? 'email_invite' : 'manual'
        })
        .select()
        .single();
      
      if (workflowError) throw workflowError;
      workflow = workflowData;
      
      if (accountDetails.sendEmailInvite) {
        // Create email invitation
        await emailInvitationApi.sendAccountInvitation(staff.id, staff.email);
      } else {
        // Create user account immediately
        const userData: CreateUserData = {
          email: staff.email,
          first_name: staff.first_name,
          last_name: staff.last_name,
          role: accountDetails.role,
          is_active: staff.is_active,
          phone: staff.phone,
          password: accountDetails.password
        };
        
        const result = await staffUserApi.createUserForStaff(staff.id, userData);
        user = result.user;
        
        // Update workflow status
        await supabase
          .from('account_creation_workflow')
          .update({
            workflow_status: 'completed',
            account_created_at: new Date().toISOString()
          })
          .eq('id', workflow.id);
      }
    }
    
    return { staff, user, workflow };
  },

  // Bulk create user accounts for existing staff
  async bulkCreateAccountsForStaff(staffIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];
    
    for (const staffId of staffIds) {
      try {
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('id', staffId)
          .single();
        
        if (staffError) throw staffError;
        
        // Create user account with same role as staff
        const userData: CreateUserData = {
          email: staff.email,
          first_name: staff.first_name,
          last_name: staff.last_name,
          role: staff.role,
          is_active: staff.is_active,
          phone: staff.phone
        };
        
        await staffUserApi.createUserForStaff(staffId, userData);
        success.push(staffId);
      } catch (error) {
        console.error(`Failed to create account for staff ${staffId}:`, error);
        failed.push(staffId);
      }
    }
    
    return { success, failed };
  },

  // Get account creation workflow status
  async getAccountCreationStatus(staffId: string): Promise<AccountCreationWorkflow | null> {
    const { data, error } = await supabase
      .from('account_creation_workflow')
      .select('*')
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }
};

// Email Invitation API
export const emailInvitationApi = {
  // Send account creation invitation
  async sendAccountInvitation(staffId: string, email: string): Promise<EmailInvitation> {
    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invitation_token');
    if (tokenError) throw tokenError;
    
    const invitationToken = tokenData;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    
    const { data, error } = await supabase
      .from('email_invitations')
      .insert({
        staff_id: staffId,
        email,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // TODO: Send actual email here
    // For now, we'll just log the invitation
    console.log(`Invitation sent to ${email} with token: ${invitationToken}`);
    
    return data;
  },

  // Verify invitation token and create account
  async verifyInvitationAndCreateAccount(token: string, password: string): Promise<User> {
    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('email_invitations')
      .select('*, staff:staff_id(*)')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();
    
    if (invitationError) throw new Error('Invalid or expired invitation');
    
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    // Create user account
    const userData: CreateUserData = {
      email: invitation.email,
      first_name: invitation.staff.first_name,
      last_name: invitation.staff.last_name,
      role: invitation.staff.role,
      is_active: true,
      phone: invitation.staff.phone,
      password
    };
    
    const result = await staffUserApi.createUserForStaff(invitation.staff_id, userData);
    
    // Update invitation status
    await supabase
      .from('email_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);
    
    return result.user;
  },

  // Resend invitation
  async resendInvitation(staffId: string): Promise<EmailInvitation> {
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('email')
      .eq('id', staffId)
      .single();
    
    if (staffError) throw staffError;
    
    // Cancel existing invitations
    await supabase
      .from('email_invitations')
      .update({ status: 'cancelled' })
      .eq('staff_id', staffId)
      .eq('status', 'pending');
    
    // Send new invitation
    return await this.sendAccountInvitation(staffId, staff.email);
  }
};

// Audit API
export const auditApi = {
  // Write audit log entry
  async writeAuditLog(entry: Omit<AccountAuditLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('user_account_audit')
      .insert(entry);
    
    if (error) throw error;
  },

  // Get audit logs
  async getAuditLogs(limit: number = 50): Promise<AccountAuditLog[]> {
    const { data, error } = await supabase
      .from('user_account_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
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
  branches: branchApi,
  staffUser: staffUserApi,
  enhancedStaff: enhancedStaffApi,
  emailInvitations: emailInvitationApi,
  audit: auditApi
};


