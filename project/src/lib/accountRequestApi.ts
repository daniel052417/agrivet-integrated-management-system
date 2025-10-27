import { supabase } from './supabase';
import { customAuth } from './customAuth';

export interface AccountRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_email: string;
  requested_by: string;
  requested_by_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  email_sent: boolean;
  notes?: string;
  role?: string;
  staff?: {
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
    created_at: string;
    branches?: {
      id: string;
      name: string;
    };
  } | null;
}

export interface CreateAccountRequestData {
  staff_id: string;
  staff_name: string;
  staff_email: string;
  notes?: string;
}

export interface UpdateAccountRequestData {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
  notes?: string;
}

export const accountRequestApi = {
  // Get all account requests
  async getAccountRequests(): Promise<AccountRequest[]> {
    const { data, error } = await supabase
      .from('account_requests')
      .select(`
        id,
        staff_id,
        staff_name,
        staff_email,
        requested_by,
        requested_by_name,
        status,
        created_at,
        approved_at,
        rejected_at,
        approved_by,
        rejected_by,
        rejection_reason,
        email_sent,
        notes,
        role,
        staff:staff_id (
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
          created_at,
          branches:branch_id (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => {
      const staffData = Array.isArray(item.staff) ? item.staff[0] : item.staff;
      return {
        ...item,
        staff: staffData ? {
          ...staffData,
          branches: Array.isArray(staffData.branches) ? staffData.branches[0] || null : staffData.branches
        } : null
      };
    });
  },

  // Get account requests by status
  async getAccountRequestsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<AccountRequest[]> {
    const { data, error } = await supabase
      .from('account_requests')
      .select(`
        id,
        staff_id,
        staff_name,
        staff_email,
        requested_by,
        requested_by_name,
        status,
        created_at,
        approved_at,
        rejected_at,
        approved_by,
        rejected_by,
        rejection_reason,
        email_sent,
        notes,
        role,
        staff:staff_id (
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
          created_at,
          branches:branch_id (
            id,
            name
          )
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => {
      const staffData = Array.isArray(item.staff) ? item.staff[0] : item.staff;
      return {
        ...item,
        staff: staffData ? {
          ...staffData,
          branches: Array.isArray(staffData.branches) ? staffData.branches[0] || null : staffData.branches
        } : null
      };
    });
  },

  // Create account request
  async createAccountRequest(data: CreateAccountRequestData): Promise<AccountRequest> {
    const currentUser = customAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const { data: requestData, error } = await supabase
      .from('account_requests')
      .insert({
        staff_id: data.staff_id,
        staff_name: data.staff_name,
        staff_email: data.staff_email,
        requested_by: currentUser.id,
        requested_by_name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Unknown User',
        status: 'pending',
        email_sent: false,
        notes: data.notes
      })
      .select()
      .single();

    if (error) throw error;

    // NOTE: No audit logging for account requests
    // Audit logs are only created when accounts are actually approved and created
    // This prevents cluttering the audit log with request-only actions
    // The actual account creation will be logged in the approveAndCreateAccount function

    return requestData;
  },

  // Update account request status
  async updateAccountRequestStatus(
    requestId: string, 
    data: UpdateAccountRequestData
  ): Promise<AccountRequest> {
    const currentUser = customAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const updateData: any = {
      status: data.status,
      notes: data.notes
    };

    if (data.status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = currentUser.id;
    } else if (data.status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = currentUser.id;
      updateData.rejection_reason = data.rejection_reason;
    }

    const { data: requestData, error } = await supabase
      .from('account_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // Only log rejections to audit_logs, not approvals
    // Approvals will be logged when the actual user account is created
    // This prevents duplicate logging and keeps audit logs focused on actual account actions
    if (data.status === 'rejected') {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          action: 'account_request_rejected',
          target_user_id: requestData.staff_id,
          target_user_email: requestData.staff_email,
          details: `Account request rejected${data.rejection_reason ? `: ${data.rejection_reason}` : ''}`,
          entity_type: 'account_request',
          entity_id: requestId,
          module: 'hr'
        });
    }
    // NOTE: No audit logging for 'approved' status here
    // The actual account creation will be logged in approveAndCreateAccount function

    return requestData;
  },

  // Approve account request and create user account with activation flow
  async approveAndCreateAccount(requestId: string): Promise<{ request: AccountRequest; user: any; activationToken: string }> {
    const currentUser = customAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get the request details
    const { data: requestData, error: requestError } = await supabase
      .from('account_requests')
      .select(`
        *,
        staff:staff_id (
          id,
          first_name,
          last_name,
          email,
          employee_id,
          department,
          position,
          branch_id,
          role,
          branches:branch_id (
            id,
            name
          )
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    const staff = requestData.staff;
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Generate verification token (UUID)
    const activationToken = crypto.randomUUID();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours from now

    // Create user account with Pending Activation status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: staff.email,
        first_name: staff.first_name,
        last_name: staff.last_name,
        phone: '', // Will be updated when staff provides it
        role: requestData.role || 'staff',
        branch_id: staff.branch_id,
        is_active: true,
        account_status: 'pending_activation', // New status for activation flow
        user_type: 'staff',
        password_hash: null, // No password until activation
        email_verified: false,
        verification_token: activationToken,
        token_expiry: tokenExpiry.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) throw userError;

    // Assign role to the user
    console.log('🔗 Assigning role to user:', { userId: userData.id, role: requestData.role || 'staff' });
    
    // First, let's check what roles exist in the database
    const { data: allRoles, error: allRolesError } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .eq('is_active', true);

    console.log('📋 Available roles in database:', allRoles);

    if (allRolesError) {
      console.error('❌ Error fetching roles:', allRolesError);
      // Continue without role assignment - user will get default role in authentication
    } else if (!allRoles || allRoles.length === 0) {
      console.warn('⚠️ No roles found in database, skipping role assignment');
      // Continue without role assignment - user will get default role in authentication
    } else {
      // Try to find the role
      const targetRole = allRoles.find(role => 
        role.name === (requestData.role || 'staff') || 
        role.name === 'staff' || 
        role.name === 'user'
      );

      if (!targetRole) {
        console.warn('⚠️ No matching role found, using first available role:', allRoles[0]);
        // Use the first available role as fallback
        const fallbackRole = allRoles[0];
        
        const { error: userRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userData.id,
            role_id: fallbackRole.id,
            assigned_at: new Date().toISOString()
          });

        if (userRoleError) {
          console.error('❌ Error assigning fallback role:', userRoleError);
        } else {
          console.log('✅ Fallback role assigned successfully to user:', userData.id);
        }
      } else {
        console.log('✅ Found matching role:', { roleId: targetRole.id, roleName: targetRole.name });
        
        // Insert role assignment
        const { error: userRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userData.id,
            role_id: targetRole.id,
            assigned_at: new Date().toISOString()
          });

        if (userRoleError) {
          console.error('❌ Error assigning role:', userRoleError);
          // Continue - user will get default role in authentication
        } else {
          console.log('✅ Role assigned successfully to user:', userData.id);
        }
      }
    }

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('account_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: currentUser.id,
        email_sent: false // Will be set to true after email is sent
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log account creation to audit_logs
    // This is the ONLY place where account creation is logged
    // We log here because this is when the actual user record is created in the users table
    await supabase
      .from('audit_logs')
      .insert({
        user_id: currentUser.id,
        action: 'account_created',
        target_user_id: userData.id,
        target_user_email: userData.email,
        details: `User account created with pending activation for ${staff.first_name} ${staff.last_name}. Activation token generated.`,
        entity_type: 'user',
        entity_id: userData.id,
        module: 'hr'
      });

    return {
      request: updatedRequest,
      user: userData,
      activationToken
    };
  },

  // Delete account request
  async deleteAccountRequest(requestId: string): Promise<void> {
    const currentUser = customAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('account_requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;

    // NOTE: No audit logging for account request deletion
    // This is just a request management action, not an actual account action
    // Audit logs are only created for actual user account operations
  }
};
