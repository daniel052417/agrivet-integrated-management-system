import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Link, Unlink, Search, Filter, Download, 
  MoreVertical, Edit, Eye, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Plus, Settings, UserCheck, UserX, Mail, Shield, ArrowLeft
} from 'lucide-react';
import { staffManagementApi, Staff, StaffWithAccount, User } from '../../../lib/staffApi';

interface StaffUserManagementProps {
  onBack?: () => void;
}

const StaffUserManagement: React.FC<StaffUserManagementProps> = ({ onBack }) => {
  const [staff, setStaff] = useState<StaffWithAccount[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_account' | 'without_account'>('all');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedStaffForLink, setSelectedStaffForLink] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [staffData, usersData] = await Promise.all([
        staffManagementApi.staff.getAllStaff(),
        staffManagementApi.users.getAllUsers()
      ]);
      
      // Enhance staff data with account information
      const enhancedStaff: StaffWithAccount[] = staffData.map(staffMember => {
        const linkedUser = usersData.find(user => user.id === staffMember.user_account_id);
        return {
          ...staffMember,
          userAccount: linkedUser,
          linkStatus: linkedUser ? 'active' : undefined
        };
      });
      
      setStaff(enhancedStaff);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load staff and user data');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    let filtered = staff;
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter === 'with_account') {
      filtered = filtered.filter(s => s.userAccount);
    } else if (statusFilter === 'without_account') {
      filtered = filtered.filter(s => !s.userAccount);
    }
    
    return filtered;
  }, [staff, searchTerm, statusFilter]);

  const handleBulkCreateAccounts = async () => {
    if (selectedStaff.length === 0) return;
    
    try {
      setLoading(true);
      const result = await staffManagementApi.enhancedStaff.bulkCreateAccountsForStaff(selectedStaff);
      
      if (result.success.length > 0) {
        setSuccess(`Successfully created accounts for ${result.success.length} staff members`);
        await fetchData(); // Refresh data
      }
      
      if (result.failed.length > 0) {
        setError(`Failed to create accounts for ${result.failed.length} staff members`);
      }
      
      setSelectedStaff([]);
      setShowBulkActions(false);
    } catch (err) {
      console.error('Failed to create accounts:', err);
      setError('Failed to create accounts for selected staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountForStaff = async (staffId: string) => {
    try {
      setLoading(true);
      const staffMember = staff.find(s => s.id === staffId);
      if (!staffMember) return;
      
      const userData = {
        email: staffMember.email,
        first_name: staffMember.first_name,
        last_name: staffMember.last_name,
        role: staffMember.role,
        is_active: staffMember.is_active,
        phone: staffMember.phone
      };
      
      await staffManagementApi.staffUser.createUserForStaff(staffId, userData);
      setSuccess(`Account created successfully for ${staffMember.first_name} ${staffMember.last_name}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to create account:', err);
      setError('Failed to create account for staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkAccount = async (staffId: string, userId: string) => {
    try {
      setLoading(true);
      await staffManagementApi.staffUser.unlinkStaffFromUser(staffId, userId);
      setSuccess('Account unlinked successfully');
      await fetchData();
    } catch (err) {
      console.error('Failed to unlink account:', err);
      setError('Failed to unlink account');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === filteredStaff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(filteredStaff.map(s => s.id));
    }
  };

  const getStatusIcon = (staffMember: StaffWithAccount) => {
    if (staffMember.userAccount) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (staffMember: StaffWithAccount) => {
    if (staffMember.userAccount) {
      return 'Has Account';
    }
    return 'No Account';
  };

  const getStatusColor = (staffMember: StaffWithAccount) => {
    if (staffMember.userAccount) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const stats = {
    totalStaff: staff.length,
    withAccounts: staff.filter(s => s.userAccount).length,
    withoutAccounts: staff.filter(s => !s.userAccount).length,
    selectedCount: selectedStaff.length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Staff-User Account Management
            </h1>
            <p className="text-gray-600 mt-1">Manage staff members and their system accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateAccountModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <UserPlus className="w-4 h-4" />
            Create Accounts
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withAccounts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserX className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Without Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withoutAccounts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Settings className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.selectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Staff</option>
              <option value="with_account">With Accounts</option>
              <option value="without_account">Without Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStaff.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-800">
              {selectedStaff.length} staff member{selectedStaff.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkCreateAccounts}
                disabled={loading}
                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                Create Accounts
              </button>
              <button
                onClick={() => setSelectedStaff([])}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedStaff.length === filteredStaff.length && filteredStaff.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((staffMember) => (
                <tr key={staffMember.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(staffMember.id)}
                      onChange={() => handleStaffSelection(staffMember.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-3 text-sm font-semibold">
                        {staffMember.first_name[0]}{staffMember.last_name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {staffMember.first_name} {staffMember.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{staffMember.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.position}</div>
                    <div className="text-sm text-gray-500">{staffMember.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staffMember)}`}>
                      {getStatusIcon(staffMember)}
                      {getStatusText(staffMember)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staffMember.userAccount?.last_login ? 
                      new Date(staffMember.userAccount.last_login).toLocaleDateString() : 
                      'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {staffMember.userAccount ? (
                        <>
                          <button 
                            onClick={() => handleUnlinkAccount(staffMember.id, staffMember.userAccount!.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Unlink Account"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleCreateAccountForStaff(staffMember.id)}
                          className="text-emerald-600 hover:text-emerald-800"
                          title="Create Account"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStaff.length === 0 && (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No staff found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No staff members have been added yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffUserManagement;
