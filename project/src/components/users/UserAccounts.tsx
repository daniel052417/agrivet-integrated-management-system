import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Users, Search, Mail, X, CheckCircle, PauseCircle, Ban, Settings, Filter, ChevronDown, AlertCircle, UserPlus, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { emailService } from '../../lib/emailService';
import { customAuth } from '../../lib/customAuth';

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

const UserAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<Record<string, boolean>>({});
  const actionMenuRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [newAccount, setNewAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'staff',
    branchId: ''
  });


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
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!showFilterDropdown && !Object.values(actionMenuOpen).some(v => v)) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close filter dropdown
      if (showFilterDropdown) {
        const clickedInsideFilter = target.closest('.relative')?.querySelector('button[class*="Filter"]')?.parentElement ||
                                    target.closest('.absolute[class*="top-full"]');
        if (!clickedInsideFilter) {
          setShowFilterDropdown(false);
        }
      }
      
      // Close action menus
      Object.keys(actionMenuOpen).forEach(accountId => {
        if (actionMenuOpen[accountId]) {
          const menuElement = actionMenuRef.current[accountId];
          const relativeContainer = menuElement?.closest('.relative');
          if (menuElement && relativeContainer && !relativeContainer.contains(target as Node)) {
            setActionMenuOpen(prev => ({ ...prev, [accountId]: false }));
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown, actionMenuOpen]);

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





  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesRole = roleFilter === 'all' || account.role === roleFilter;
      const matchesBranch = branchFilter === 'all' || account.branch === branchFilter;
      
      return matchesSearch && matchesStatus && matchesRole && matchesBranch;
    });
  }, [accounts, searchTerm, statusFilter, roleFilter, branchFilter]);

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
    if (!newAccount.email || !newAccount.firstName || !newAccount.lastName) {
      alert('Name and email are required');
      return;
    }

    if (!newAccount.branchId) {
      alert('Branch is required');
      return;
    }

    try {
      setLoading(true);

      // Generate verification token (UUID)
      const activationToken = crypto.randomUUID();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours from now

      const currentUser = customAuth.getCurrentUser();

      // Create user account with Pending Activation status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: newAccount.email,
          first_name: newAccount.firstName,
          last_name: newAccount.lastName,
          phone: '',
          role: newAccount.role,
          branch_id: newAccount.branchId,
          is_active: true,
          account_status: 'pending_activation',
          user_type: 'user',
          password_hash: null,
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
      const { data: allRoles, error: allRolesError } = await supabase
        .from('roles')
        .select('id, name, display_name')
        .eq('is_active', true);

      if (!allRolesError && allRoles && allRoles.length > 0) {
        const targetRole = allRoles.find(role => 
          role.name === newAccount.role || 
          role.name === 'staff' || 
          role.name === 'user'
        );

        const roleToAssign = targetRole || allRoles[0];
        
        if (roleToAssign) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: userData.id,
              role_id: roleToAssign.id,
              assigned_at: new Date().toISOString()
            });
        }
      }

      // Send activation email
      try {
        const emailResult = await emailService.sendActivationEmail({
          to: newAccount.email,
          name: `${newAccount.firstName} ${newAccount.lastName}`,
          activationToken: activationToken
        });

        if (emailResult.success) {
          // Log to audit_logs
          if (currentUser) {
            await supabase
              .from('audit_logs')
              .insert({
                user_id: currentUser.id,
                action: 'user_created',
                target_user_email: newAccount.email,
                target_user_id: userData.id,
                details: `User account created and activation email sent to ${newAccount.email}`,
                entity_type: 'user',
                entity_id: userData.id
              });
          }

          // Reset form and close modal
          setNewAccount({
            firstName: '',
            lastName: '',
            email: '',
            role: 'staff',
            branchId: ''
          });
          setShowCreateModal(false);
          
          // Reload accounts to show the new account
          await loadAccounts();
          
          alert(`Account created successfully! Activation email has been sent to ${newAccount.email}.`);
        } else {
          throw new Error('Failed to send activation email');
        }
      } catch (emailError: any) {
        console.error('Error sending activation email:', emailError);
        alert(`Account created successfully! However, the activation email could not be sent. Please send the activation link manually.`);
        await loadAccounts();
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      alert(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
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
    const suspended = accounts.filter(a => a.status === 'suspended').length;
    
    return { total, active, suspended };
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <div className="p-2 bg-red-100 rounded-lg">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Suspended</p>
                <p className="text-xl font-bold text-gray-900">{stats.suspended}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
              
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-50 min-w-[200px]">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="pending">Pending</option>
                          <option value="invite_sent">Invite Sent</option>
                          <option value="no_account">No Account</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Roles</option>
                          <option value="Admin">Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
                        <select
                          value={branchFilter}
                          onChange={(e) => setBranchFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Branches</option>
                          {branches.map(branch => (
                            <option key={branch.id} value={branch.name}>{branch.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {(statusFilter !== 'all' || roleFilter !== 'all' || branchFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setStatusFilter('all');
                            setRoleFilter('all');
                            setBranchFilter('all');
                          }}
                          className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span title={account.lastLoginAt ? `Last Active: ${formatLastLogin(account.lastLoginAt)}` : 'Never logged in'}>
                        {formatLastLogin(account.lastLoginAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(prev => ({ ...prev, [account.id]: !prev[account.id] }))}
                          className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {actionMenuOpen[account.id] && (
                          <div 
                            ref={el => actionMenuRef.current[account.id] = el}
                            className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                          >
                            <div className="py-1">
                              {/* Create New Account - Always available */}
                              <button
                                onClick={() => {
                                  setShowCreateModal(true);
                                  setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2 border-b border-gray-200"
                              >
                                <Mail className="w-4 h-4" />
                                Create Account
                              </button>
                              
                              {account.status === 'no_account' && (
                                <button
                                  onClick={() => {
                                    handleAccountAction(account.id, 'send_invite');
                                    setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                                >
                                  <Mail className="w-4 h-4" />
                                  Send Invite
                                </button>
                              )}
                              
                              {account.status === 'invite_sent' && (
                                <button
                                  onClick={() => {
                                    handleAccountAction(account.id, 'resend_invite');
                                    setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                >
                                  <Mail className="w-4 h-4" />
                                  Resend Invite
                                </button>
                              )}
                              
                              {account.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => {
                                      handleAccountAction(account.id, 'reset_password');
                                      setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                  >
                                    <Settings className="w-4 h-4" />
                                    Reset Password
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleAccountAction(account.id, 'deactivate');
                                      setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                  >
                                    <PauseCircle className="w-4 h-4" />
                                    Deactivate
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleAccountAction(account.id, 'suspend');
                                      setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2"
                                  >
                                    <Ban className="w-4 h-4" />
                                    Suspend
                                  </button>
                                </>
                              )}
                              
                              {account.status === 'inactive' && (
                                <button
                                  onClick={() => {
                                    handleAccountAction(account.id, 'activate');
                                    setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Activate
                                </button>
                              )}
                              
                              {account.status === 'suspended' && (
                                <button
                                  onClick={() => {
                                    handleAccountAction(account.id, 'activate');
                                    setActionMenuOpen(prev => ({ ...prev, [account.id]: false }));
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Unsuspend
                                </button>
                              )}
                            </div>
                          </div>
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

        {/* Create Account Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Create User Account</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                The user will receive an activation email with a magic link to set their password and activate their account.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={newAccount.firstName}
                      onChange={(e) => setNewAccount({ ...newAccount, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={newAccount.lastName}
                      onChange={(e) => setNewAccount({ ...newAccount, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>
                  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={newAccount.role}
                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="staff">Staff</option>
                    <option value="hr-admin">HR Admin</option>
                    <option value="hr-staff">HR Staff</option>
                    <option value="finance-staff">Finance Staff</option>
                    <option value="inventory-clerk">Inventory Clerk</option>
                    <option value="cashier">Cashier</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>
                  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                  <select
                    value={newAccount.branchId}
                    onChange={(e) => setNewAccount({ ...newAccount, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAccount({
                      firstName: '',
                      lastName: '',
                      email: '',
                      role: 'staff',
                      branchId: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create & Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  };

export default UserAccounts;