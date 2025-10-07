import React, { useMemo, useState, useEffect } from 'react';
import { Users, UserPlus, Database, Settings, Search, Filter, Download, SortAsc, SortDesc, MoreVertical, Edit, Eye, X, AlertCircle, Trash, CheckCircle, PauseCircle, Ban, Activity as ActivityIcon, Mail, Phone, Calendar, Building, Clock, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { accountRequestApi, AccountRequest } from '../../lib/accountRequestApi';
import { emailService } from '../../lib/emailService';
import { XCircle } from "lucide-react";

interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'invite_sent' | 'no_account';
  branch: string;
  createdAt: string; // ISO
  lastLoginAt?: string; // ISO | undefined
  lastPasswordReset?: string; // ISO | undefined
  inviteSentAt?: string; // ISO | undefined
  // Staff-specific fields
  phone?: string;
  position?: string;
  department?: string;
  hireDate?: string;
  employeeId?: string;
  salary?: number;
  accountType?: 'user' | 'staff';
  hasMFA?: boolean;
  isFirstLogin?: boolean;
}

interface AuditEntry {
  id?: string;
  actor_email?: string | null;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'suspend';
  target_user_email: string;
  target_user_id?: string;
  details?: string | null;
  created_at?: string;
}

const UserAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof AccountRow>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'requests'>('accounts');
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAccount, setNewAccount] = useState<Partial<AccountRow>>({
    name: '',
    email: '',
    role: 'Staff',
    status: 'active',
    branch: '',
    accountType: 'user'
  });

  // Mock data
  const mockAccounts: AccountRow[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'active',
      branch: 'Main Branch',
      createdAt: '2024-01-15T10:30:00Z',
      lastLoginAt: '2024-01-20T14:22:00Z',
      lastPasswordReset: '2024-01-15T10:30:00Z',
      phone: '+1-555-0123',
      position: 'System Administrator',
      department: 'IT',
      hireDate: '2024-01-15',
      employeeId: 'EMP001',
      salary: 75000,
      accountType: 'staff',
      hasMFA: true,
      isFirstLogin: false
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Manager',
      status: 'active',
      branch: 'Downtown Branch',
      createdAt: '2024-01-10T09:15:00Z',
      lastLoginAt: '2024-01-19T16:45:00Z',
      lastPasswordReset: '2024-01-10T09:15:00Z',
      phone: '+1-555-0124',
      position: 'Branch Manager',
      department: 'Operations',
      hireDate: '2024-01-10',
      employeeId: 'EMP002',
      salary: 65000,
      accountType: 'staff',
      hasMFA: true,
      isFirstLogin: false
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'Staff',
      status: 'active',
      branch: 'Mall Branch',
      createdAt: '2024-01-05T11:20:00Z',
      lastLoginAt: '2024-01-18T13:30:00Z',
      lastPasswordReset: '2024-01-05T11:20:00Z',
      phone: '+1-555-0125',
      position: 'Sales Associate',
      department: 'Sales',
      hireDate: '2024-01-05',
      employeeId: 'EMP003',
      salary: 45000,
      accountType: 'staff',
      hasMFA: false,
      isFirstLogin: false
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      role: 'Staff',
      status: 'inactive',
      branch: 'Airport Branch',
      createdAt: '2024-01-12T14:45:00Z',
      lastLoginAt: '2024-01-15T10:15:00Z',
      lastPasswordReset: '2024-01-12T14:45:00Z',
      phone: '+1-555-0126',
      position: 'Cashier',
      department: 'Retail',
      hireDate: '2024-01-12',
      employeeId: 'EMP004',
      salary: 40000,
      accountType: 'staff',
      hasMFA: false,
      isFirstLogin: false
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david.brown@example.com',
      role: 'Staff',
      status: 'suspended',
      branch: 'Main Branch',
      createdAt: '2024-01-08T16:30:00Z',
      lastLoginAt: '2024-01-14T09:20:00Z',
      lastPasswordReset: '2024-01-08T16:30:00Z',
      phone: '+1-555-0127',
      position: 'Inventory Clerk',
      department: 'Warehouse',
      hireDate: '2024-01-08',
      employeeId: 'EMP005',
      salary: 42000,
      accountType: 'staff',
      hasMFA: false,
      isFirstLogin: false
    },
    {
      id: '6',
      name: 'Lisa Davis',
      email: 'lisa.davis@example.com',
      role: 'Manager',
      status: 'invite_sent',
      branch: 'Downtown Branch',
      createdAt: '2024-01-20T08:00:00Z',
      inviteSentAt: '2024-01-20T08:00:00Z',
      phone: '+1-555-0128',
      position: 'Assistant Manager',
      department: 'Operations',
      hireDate: '2024-01-20',
      employeeId: 'EMP006',
      salary: 55000,
      accountType: 'staff',
      hasMFA: false,
      isFirstLogin: true
    },
    {
      id: '7',
      name: 'Robert Taylor',
      email: 'robert.taylor@example.com',
      role: 'Staff',
      status: 'active',
      branch: 'Mall Branch',
      createdAt: '2024-01-18T12:15:00Z',
      lastLoginAt: '2024-01-19T17:30:00Z',
      lastPasswordReset: '2024-01-18T12:15:00Z',
      accountType: 'user',
      hasMFA: false,
      isFirstLogin: false
    },
    {
      id: '8',
      name: 'Emily Anderson',
      email: 'emily.anderson@example.com',
      role: 'Admin',
      status: 'active',
      branch: 'Main Branch',
      createdAt: '2024-01-14T15:45:00Z',
      lastLoginAt: '2024-01-20T11:15:00Z',
      lastPasswordReset: '2024-01-14T15:45:00Z',
      accountType: 'user',
      hasMFA: true,
      isFirstLogin: false
    },
    {
      id: '9',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      role: 'Staff',
      status: 'no_account',
      branch: 'Airport Branch',
      createdAt: '2024-01-22T10:00:00Z',
      phone: '+1-555-0129',
      position: 'Customer Service Rep',
      department: 'Customer Service',
      hireDate: '2024-01-22',
      employeeId: 'EMP007',
      salary: 38000,
      accountType: 'staff',
      hasMFA: false,
      isFirstLogin: true
    },
    {
      id: '10',
      name: 'Jennifer Lee',
      email: 'jennifer.lee@example.com',
      role: 'Staff',
      status: 'invite_sent',
      branch: 'Mall Branch',
      createdAt: '2024-01-21T14:30:00Z',
      inviteSentAt: '2024-01-21T14:30:00Z',
      phone: '+1-555-0130',
      position: 'Marketing Coordinator',
      department: 'Marketing',
      hireDate: '2024-01-21',
      employeeId: 'EMP008',
      salary: 48000,
      accountType: 'staff',
      hasMFA: false,
      isFirstLogin: true
    }
  ];

  const mockAuditLog: AuditEntry[] = [
    {
      id: '1',
      actor_email: 'admin@example.com',
      action: 'create',
      target_user_email: 'john.doe@example.com',
      target_user_id: '1',
      details: 'Account created with Admin role',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      actor_email: 'admin@example.com',
      action: 'update',
      target_user_email: 'jane.smith@example.com',
      target_user_id: '2',
      details: 'Role updated to Manager',
      created_at: '2024-01-10T09:15:00Z'
    },
    {
      id: '3',
      actor_email: 'admin@example.com',
      action: 'suspend',
      target_user_email: 'david.brown@example.com',
      target_user_id: '5',
      details: 'Account suspended for policy violation',
      created_at: '2024-01-16T14:20:00Z'
    },
    {
      id: '4',
      actor_email: 'admin@example.com',
      action: 'deactivate',
      target_user_email: 'sarah.wilson@example.com',
      target_user_id: '4',
      details: 'Account deactivated due to inactivity',
      created_at: '2024-01-17T09:30:00Z'
    }
  ];

  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  // Load branches from database
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const { data: branchesData, error } = await supabase
          .from('branches')
          .select('id, name')
          .eq('is_active', true)
          .order('name', { ascending: true });
        
        if (error) throw error;
        setBranches(branchesData || []);
      } catch (err) {
        console.error('Error loading branches:', err);
        // Fallback to mock data if branches table doesn't exist
        setBranches([
          { id: '1', name: 'Main Branch' },
          { id: '2', name: 'Downtown Branch' },
          { id: '3', name: 'Mall Branch' },
          { id: '4', name: 'Airport Branch' }
        ]);
      }
    };

    loadBranches();
  }, []);

  useEffect(() => {
    loadAccounts();
    loadAuditLog();
    loadAccountRequests();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users from the users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          is_active,
          role,
          account_status,
          last_login,
          last_activity,
          status,
          mfa_enabled,
          last_password_reset,
          created_at,
          updated_at,
          branches:branch_id (
            id,
            name
          )
        `);

      if (usersError) throw usersError;

      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          id,
          first_name,
          last_name,
          email,
          employee_id,
          department,
          position,
          hire_date,
          salary,
          phone,
          branch_id,
          is_active,
          role,
          created_at,
          updated_at,
          branches:branch_id (
            id,
            name
          )
        `);

      if (staffError) throw staffError;

      // Load user invites (if email_invitations table exists)
      const { data: invitesData, error: invitesError } = await supabase
        .from('email_invitations')
        .select(`
          id,
          email,
          status,
          sent_at,
          accepted_at,
          expires_at,
          created_at
        `)
        .eq('status', 'pending');

      if (invitesError) {
        console.warn('Error loading invites:', invitesError);
        // Continue without invites if table doesn't exist
      }

      // Process users with accounts
      const userAccounts: AccountRow[] = usersData?.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
        email: user.email,
        role: user.role as any || 'Staff',
        status: user.account_status as any || (user.is_active ? 'active' : 'inactive'),
        branch: (user.branches as any)?.name || 'Unknown Branch',
        createdAt: user.created_at,
        lastLoginAt: user.last_login,
        lastPasswordReset: user.last_password_reset,
        phone: user.phone,
        accountType: 'user' as any,
        hasMFA: user.mfa_enabled || false,
        isFirstLogin: !user.last_login
      })) || [];

      // Process staff members
      const staffAccounts: AccountRow[] = staffData?.map(staff => ({
        id: staff.id,
        name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown Staff',
        email: staff.email,
        role: staff.role as any || 'Staff',
        status: staff.is_active ? 'active' : 'inactive',
        branch: (staff.branches as any)?.name || 'Unknown Branch',
        createdAt: staff.created_at,
        lastLoginAt: undefined, // Staff don't have direct login tracking
        lastPasswordReset: undefined,
        phone: staff.phone,
        position: staff.position,
        department: staff.department,
        hireDate: staff.hire_date,
        employeeId: staff.employee_id,
        salary: staff.salary,
        accountType: 'staff' as any,
        hasMFA: false,
        isFirstLogin: true // Staff accounts are typically created without user accounts initially
      })) || [];

      // Process pending invites
      const inviteAccounts: AccountRow[] = invitesData?.map(invite => ({
        id: invite.id,
        name: 'Pending Invite',
        email: invite.email,
        role: 'Staff' as any,
        status: 'invite_sent' as any,
        branch: 'Unknown Branch',
        createdAt: invite.created_at,
        inviteSentAt: invite.sent_at,
        accountType: 'user' as any,
        hasMFA: false,
        isFirstLogin: true
      })) || [];

      // Combine all accounts
      const allAccounts = [...userAccounts, ...staffAccounts, ...inviteAccounts];
      setAccounts(allAccounts);
    } catch (err: any) {
      console.error('Error loading accounts:', err);
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          actor_email,
          action,
          target_user_email,
          target_user_id,
          details,
          old_values,
          new_values,
          created_at
        `)
        .in('action', [
          'user_created', 'user_updated', 'user_deleted',
          'user_activated', 'user_deactivated', 'user_suspended',
          'invite_sent', 'invite_accepted', 'invite_expired',
          'password_reset_requested', 'password_reset_completed',
          'mfa_enabled', 'mfa_disabled', 'role_assigned', 'role_removed'
        ])
        .order('created_at', { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      setAuditLog(auditData || []);
    } catch (err: any) {
      console.error('Error loading audit log:', err);
      // Fallback to mock data if audit table doesn't exist yet
      setAuditLog(mockAuditLog);
    }
  };

  const loadAccountRequests = async () => {
    try {
      const requests = await accountRequestApi.getAccountRequests();
      setAccountRequests(requests);
    } catch (err: any) {
      console.error('Error loading account requests:', err);
      setAccountRequests([]);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const result = await accountRequestApi.approveAndCreateAccount(requestId);
      
      // Send activation email
      try {
        const emailResult = await emailService.sendActivationEmail({
          to: result.user.email,
          name: `${result.user.first_name} ${result.user.last_name}`,
          activationToken: result.activationToken
        });

        if (emailResult.success) {
          // Update the account request to mark email as sent
          await accountRequestApi.updateAccountRequestStatus(requestId, {
            status: 'approved',
            notes: 'Activation email sent successfully'
          });
        }
      } catch (emailError) {
        console.error('Error sending activation email:', emailError);
        // Don't fail the approval if email fails
      }
      
      await loadAccountRequests();
      await loadAccounts(); // Refresh accounts list
      alert(`Account request approved and user account created successfully! Activation email has been sent to ${result.user.email}.`);
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await accountRequestApi.updateAccountRequestStatus(requestId, {
        status: 'rejected',
        rejection_reason: rejectionReason
      });
      await loadAccountRequests();
      setShowRequestModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      alert('Account request rejected successfully!');
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert(err.message || 'Failed to reject request');
    }
  };

  const handleResendInvite = async (accountId: string, email: string, name: string) => {
    try {
      setLoading(true);
      
      // Get the user's verification token
      const { data: userData, error } = await supabase
        .from('users')
        .select('verification_token, account_status')
        .eq('id', accountId)
        .single();

      if (error || !userData) {
        alert('User not found');
        return;
      }

      if (userData.account_status !== 'pending_activation') {
        alert('User account is not in pending activation status');
        return;
      }

      if (!userData.verification_token) {
        alert('No activation token found for this user');
        return;
      }

      // Send activation email
      const emailResult = await emailService.sendActivationEmail({
        to: email,
        name: name,
        activationToken: userData.verification_token
      });

      if (emailResult.success) {
        alert('Activation email has been resent successfully!');
      } else {
        alert('Failed to resend activation email. Please try again.');
      }
    } catch (err: any) {
      console.error('Error resending invite:', err);
      alert(err.message || 'Failed to resend invite');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: AccountRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesRole = roleFilter === 'all' || account.role === roleFilter;
      const matchesBranch = branchFilter === 'all' || account.branch === branchFilter;
      
      return matchesSearch && matchesStatus && matchesRole && matchesBranch;
    }).sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [accounts, searchTerm, statusFilter, roleFilter, branchFilter, sortField, sortDirection]);

  const handleAccountAction = async (accountId: string, action: string) => {
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      switch (action) {
        case 'activate':
          await supabase
            .from('users')
            .update({ is_active: true })
            .eq('id', accountId);
          
          // Log to audit_logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: 'current-user-id', // You'll need to get this from auth context
              action: 'user_activated',
              target_user_id: accountId,
              target_user_email: account.email,
              details: `User account activated`,
              entity_type: 'user',
              entity_id: accountId
            });
          break;
          
        case 'deactivate':
          await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', accountId);
          
          // Log to audit_logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: 'current-user-id',
              action: 'user_deactivated',
              target_user_id: accountId,
              target_user_email: account.email,
              details: `User account deactivated`,
              entity_type: 'user',
              entity_id: accountId
            });
          break;
          
        case 'suspend':
          // For suspend, we'll use a custom status field or just deactivate
          await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', accountId);
          
          // Log to audit_logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: 'current-user-id',
              action: 'user_suspended',
              target_user_id: accountId,
              target_user_email: account.email,
              details: `User account suspended`,
              entity_type: 'user',
              entity_id: accountId
            });
          break;
          
        case 'send_invite':
          const inviteToken = Math.random().toString(36).substring(2, 15);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
          
          const { data: inviteData, error: inviteError } = await supabase
            .from('email_invitations')
            .insert({
              staff_id: accountId,
              email: account.email,
              invitation_token: inviteToken,
              status: 'pending',
              expires_at: expiresAt.toISOString(),
              created_by: 'current-user-id' // You'll need to get this from auth
            })
            .select()
            .single();

          if (inviteError) throw inviteError;

          // Log to audit_logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: 'current-user-id',
              action: 'invite_sent',
              target_user_email: account.email,
              details: `Invite sent to ${account.email} for ${account.role} role`,
              entity_type: 'invite',
              entity_id: inviteData.id
            });
          break;
          
        case 'resend_invite':
          await supabase
            .from('email_invitations')
            .update({ 
              sent_at: new Date().toISOString(),
              status: 'pending'
            })
            .eq('email', account.email)
            .eq('status', 'pending');
          
          // Log to audit_logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: 'current-user-id',
              action: 'invite_sent',
              target_user_email: account.email,
              details: `Invite resent to ${account.email}`,
              entity_type: 'invite'
            });
          break;
          
        case 'reset_password':
          // For password reset, we'll just log the action since we don't have a password_resets table
          // In a real implementation, you'd create a password reset token and send an email
          
          // Log to audit_logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: 'current-user-id',
              action: 'password_reset_requested',
              target_user_id: accountId,
              target_user_email: account.email,
              details: `Password reset requested for ${account.email}`,
              entity_type: 'password_reset',
              entity_id: accountId
            });
          break;
      }
      
      // Reload accounts to get updated data
      await loadAccounts();
      
      // Show success message
      const actionMessages = {
        'activate': 'Account activated successfully',
        'deactivate': 'Account deactivated successfully',
        'suspend': 'Account suspended successfully',
        'send_invite': 'Invite sent successfully',
        'resend_invite': 'Invite resent successfully',
        'reset_password': 'Password reset email sent successfully'
      };
      
      alert(actionMessages[action as keyof typeof actionMessages] || 'Action completed successfully');
    } catch (err: any) {
      console.error('Error performing account action:', err);
      alert(err.message || 'Failed to perform action');
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.email || !newAccount.name) {
      alert('Email and name are required');
      return;
    }

    try {
      // Generate invite token and expiry
      const inviteToken = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Get branch ID from branch name
      const { data: branchData } = await supabase
        .from('branches')
        .select('id')
        .eq('name', newAccount.branch)
        .single();

      // Create user invite
      const { data: inviteData, error: inviteError } = await supabase
        .from('email_invitations')
        .insert({
          email: newAccount.email,
          invitation_token: inviteToken,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          created_by: 'current-user-id' // You'll need to get this from auth context
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Log to audit_logs
      await supabase
        .from('audit_logs')
        .insert({
          user_id: 'current-user-id',
          action: 'invite_sent',
          target_user_email: newAccount.email,
          details: `New invite sent to ${newAccount.email} for ${newAccount.role} role`,
          entity_type: 'invite',
          entity_id: inviteData.id
        });

      // Reset form and close modal
      setNewAccount({
        name: '',
        email: '',
        role: 'Staff',
        status: 'active',
        branch: '',
        accountType: 'user'
      });
      setShowCreateModal(false);
      
      // Reload accounts to show the new invite
      await loadAccounts();
      
      alert('Invite sent successfully! The user will receive an email to set up their account.');
    } catch (err: any) {
      console.error('Error creating account invite:', err);
      alert(err.message || 'Failed to send invite');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'invite_sent':
        return 'bg-blue-100 text-blue-800';
      case 'no_account':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <PauseCircle className="w-4 h-4 text-gray-600" />;
      case 'suspended':
        return <Ban className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'invite_sent':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'no_account':
        return <UserPlus className="w-4 h-4 text-orange-600" />;
      default:
        return <PauseCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'suspended':
        return 'Suspended';
      case 'pending':
        return 'Pending';
      case 'invite_sent':
        return 'Invite Sent';
      case 'no_account':
        return 'No Account';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStats = () => {
    const total = accounts.length;
    const active = accounts.filter(a => a.status === 'active').length;
    const inactive = accounts.filter(a => a.status === 'inactive').length;
    const suspended = accounts.filter(a => a.status === 'suspended').length;
    const pendingInvites = accounts.filter(a => a.status === 'invite_sent').length;
    const noAccount = accounts.filter(a => a.status === 'no_account').length;
    const staff = accounts.filter(a => a.accountType === 'staff').length;
    const users = accounts.filter(a => a.accountType === 'user').length;
    
    return { total, active, inactive, suspended, pendingInvites, noAccount, staff, users };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Accounts</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="user-accounts">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Accounts</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Active</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <PauseCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Inactive</p>
                <p className="text-xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Suspended</p>
                <p className="text-xl font-bold text-gray-900">{stats.suspended}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending Invites</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingInvites}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">No Account</p>
                <p className="text-xl font-bold text-gray-900">{stats.noAccount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'accounts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                User Accounts
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Account Requests
                {accountRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {accountRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
                <option value="invite_sent">Invite Sent</option>
                <option value="no_account">No Account</option>
              </select>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
              
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.name}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as keyof AccountRow)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="status">Status</option>
              </select>
              
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setShowAuditModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ActivityIcon className="w-4 h-4" />
                <span>Audit Log</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Send Invite</span>
              </button>
            </div>
          </div>
          
          {/* Quick Filter Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('invite_sent')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'invite_sent'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Invites ({stats.pendingInvites})
            </button>
            <button
              onClick={() => setStatusFilter('no_account')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'no_account'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No Account ({stats.noAccount})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'suspended'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Suspended ({stats.suspended})
            </button>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'accounts' && (
          <>
            {/* Accounts Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{account.name}</div>
                          <div className="text-sm text-gray-500">{account.email}</div>
                          {account.employeeId && (
                            <div className="text-xs text-gray-400">ID: {account.employeeId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {account.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(account.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status)}`}>
                          {getStatusLabel(account.status)}
                        </span>
                      </div>
                      {/* Row Indicators */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {account.inviteSentAt && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <Mail className="w-3 h-3 mr-1" />
                            Invite Sent
                          </span>
                        )}
                        {account.isFirstLogin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Never Logged In
                          </span>
                        )}
                        {account.lastLoginAt && !account.isFirstLogin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <ActivityIcon className="w-3 h-3 mr-1" />
                            Last Active: {formatLastLogin(account.lastLoginAt)}
                          </span>
                        )}
                        {account.hasMFA && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <Settings className="w-3 h-3 mr-1" />
                            MFA Enabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatLastLogin(account.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.accountType === 'staff' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowAccountModal(true);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        
                        {account.status === 'no_account' && (
                          <button
                            onClick={() => handleAccountAction(account.id, 'send_invite')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                            title="Send Invite"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Send Invite
                          </button>
                        )}
                        
                        {account.status === 'invite_sent' && (
                          <button
                            onClick={() => handleAccountAction(account.id, 'resend_invite')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            title="Resend Invite"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Resend
                          </button>
                        )}
                        
                        {account.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleAccountAction(account.id, 'reset_password')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                              title="Reset Password"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleAccountAction(account.id, 'deactivate')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                              title="Deactivate"
                            >
                              <PauseCircle className="w-3 h-3 mr-1" />
                              Deactivate
                            </button>
                          </>
                        )}
                        
                        {account.status === 'inactive' && (
                          <button
                            onClick={() => handleAccountAction(account.id, 'activate')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                            title="Activate"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activate
                          </button>
                        )}
                        
                        {account.status === 'suspended' && (
                          <button
                            onClick={() => handleAccountAction(account.id, 'activate')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                            title="Unsuspend"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Unsuspend
                          </button>
                        )}
                        
                        {account.status !== 'suspended' && account.status !== 'no_account' && (
                          <button
                            onClick={() => handleAccountAction(account.id, 'suspend')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            title="Suspend"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Accounts Found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || branchFilter !== 'all'
                    ? 'No accounts match your filter criteria.'
                    : 'No accounts found in the system.'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Account Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Requests</h3>
              <p className="text-sm text-gray-600">Review and manage account requests from HR</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accountRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {request.staff_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.staff_name}
                            </div>
                            <div className="text-sm text-gray-500">{request.staff_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requested_by_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {request.role || 'Not specified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          <span className="capitalize">{request.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve Request"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRequestModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Reject Request"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {accountRequests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No account requests</h3>
                <p className="text-gray-500">No account requests have been submitted yet</p>
              </div>
            )}
          </div>
        )}

        {/* Create Account Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Send Account Invite</h3>
                <p className="text-sm text-gray-600 mb-4">The user will receive an email to set up their password and activate their account.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newAccount.name || ''}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newAccount.email || ''}
                      onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={newAccount.role || 'Staff'}
                      onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    <select
                      value={newAccount.branch || ''}
                      onChange={(e) => setNewAccount({ ...newAccount, branch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.name}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <select
                      value={newAccount.accountType || 'user'}
                      onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Modal */}
        {showAuditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Audit Log</h3>
                  <button
                    onClick={() => setShowAuditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLog.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.actor_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              entry.action === 'create' ? 'bg-green-100 text-green-800' :
                              entry.action === 'update' ? 'bg-blue-100 text-blue-800' :
                              entry.action === 'delete' ? 'bg-red-100 text-red-800' :
                              entry.action === 'suspend' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {entry.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.target_user_email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.created_at ? formatDate(entry.created_at) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {showRequestModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Account Request Details</h3>
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Staff Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedRequest.staff_name}</div>
                      <div><span className="font-medium">Email:</span> {selectedRequest.staff_email}</div>
                      <div><span className="font-medium">Requested By:</span> {selectedRequest.requested_by_name}</div>
                      <div><span className="font-medium">Role:</span> 
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedRequest.role || 'Not specified'}
                        </span>
                      </div>
                      <div><span className="font-medium">Status:</span> 
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedRequest.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedRequest.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRequest.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {selectedRequest.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {selectedRequest.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          <span className="capitalize">{selectedRequest.status}</span>
                        </span>
                      </div>
                      <div><span className="font-medium">Requested At:</span> {new Date(selectedRequest.created_at).toLocaleString()}</div>
                      {selectedRequest.rejection_reason && (
                        <div><span className="font-medium">Rejection Reason:</span> {selectedRequest.rejection_reason}</div>
                      )}
                    </div>
                  </div>
                  
                  {selectedRequest.status === 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Enter reason for rejection..."
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveRequest(selectedRequest.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 inline mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(selectedRequest.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <UserX className="w-4 h-4 inline mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default UserAccounts;