import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Clock, Shield, Bell, 
  Search, Filter, MoreVertical, Edit, Lock, Unlock,
  Eye, Mail, Phone, MapPin, Calendar, Activity,
  TrendingUp, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Download, Plus, Settings
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin: string;
  profilePicture?: string;
  phone?: string;
  location?: string;
  isOnline: boolean;
  sessionDuration?: number;
  loginCount: number;
  lastActivity: string;
  permissions: string[];
  verificationStatus: 'verified' | 'unverified' | 'pending';
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
}

const ActiveUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@agrivet.com',
        role: 'Admin',
        status: 'active',
        lastLogin: '2024-01-15T10:30:00Z',
        profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY',
        isOnline: true,
        sessionDuration: 45,
        loginCount: 156,
        lastActivity: '2 minutes ago',
        permissions: ['admin', 'inventory', 'sales', 'reports'],
        verificationStatus: 'verified',
        twoFactorEnabled: true,
        failedLoginAttempts: 0
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@agrivet.com',
        role: 'Manager',
        status: 'active',
        lastLogin: '2024-01-15T09:15:00Z',
        profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        phone: '+1 (555) 234-5678',
        location: 'Los Angeles, CA',
        isOnline: true,
        sessionDuration: 120,
        loginCount: 89,
        lastActivity: '15 minutes ago',
        permissions: ['inventory', 'sales', 'reports'],
        verificationStatus: 'verified',
        twoFactorEnabled: false,
        failedLoginAttempts: 1
      },
      {
        id: '3',
        name: 'Mike Davis',
        email: 'mike.davis@agrivet.com',
        role: 'Staff',
        status: 'active',
        lastLogin: '2024-01-15T08:45:00Z',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        phone: '+1 (555) 345-6789',
        location: 'Chicago, IL',
        isOnline: false,
        sessionDuration: 0,
        loginCount: 67,
        lastActivity: '1 hour ago',
        permissions: ['inventory', 'sales'],
        verificationStatus: 'verified',
        twoFactorEnabled: false,
        failedLoginAttempts: 0
      },
      {
        id: '4',
        name: 'Emily Wilson',
        email: 'emily.wilson@agrivet.com',
        role: 'Staff',
        status: 'pending',
        lastLogin: '2024-01-14T16:20:00Z',
        profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        phone: '+1 (555) 456-7890',
        location: 'Miami, FL',
        isOnline: false,
        sessionDuration: 0,
        loginCount: 12,
        lastActivity: '1 day ago',
        permissions: ['inventory'],
        verificationStatus: 'pending',
        twoFactorEnabled: false,
        failedLoginAttempts: 2
      },
      {
        id: '5',
        name: 'David Brown',
        email: 'david.brown@agrivet.com',
        role: 'Manager',
        status: 'suspended',
        lastLogin: '2024-01-10T14:30:00Z',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        phone: '+1 (555) 567-8901',
        location: 'Seattle, WA',
        isOnline: false,
        sessionDuration: 0,
        loginCount: 234,
        lastActivity: '5 days ago',
        permissions: ['inventory', 'sales'],
        verificationStatus: 'verified',
        twoFactorEnabled: true,
        failedLoginAttempts: 5
      }
    ];
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'suspended': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = (action: string) => {
    // Implement bulk actions
    console.log(`Performing ${action} on users:`, selectedUsers);
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    onlineUsers: users.filter(u => u.isOnline).length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    suspendedUsers: users.filter(u => u.status === 'suspended').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Users</h1>
          <p className="text-gray-600 mt-1">Manage and monitor user accounts and activities</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online Now</p>
              <p className="text-2xl font-bold text-gray-900">{stats.onlineUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspendedUsers}</p>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="space-y-1 w-4 h-4">
                <div className="bg-current rounded-sm h-0.5"></div>
                <div className="bg-current rounded-sm h-0.5"></div>
                <div className="bg-current rounded-sm h-0.5"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-800">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUsers.includes(user.id)}
              onSelect={() => handleUserSelection(user.id)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              formatLastLogin={formatLastLogin}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onSelect={() => handleUserSelection(user.id)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    formatLastLogin={formatLastLogin}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new user.'}
          </p>
        </div>
      )}
    </div>
  );
};

// User Card Component
const UserCard: React.FC<{
  user: User;
  isSelected: boolean;
  onSelect: () => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatLastLogin: (dateString: string) => string;
}> = ({ user, isSelected, onSelect, getStatusColor, getStatusIcon, formatLastLogin }) => {
  return (
    <div className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* User Info */}
        <div className="text-center mb-4">
          <div className="w-20 h-20 mx-auto mb-3">
            <img
              src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff&size=80`}
              alt={user.name}
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{user.email}</p>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
            {getStatusIcon(user.status)}
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium text-gray-900">{user.role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Last Login:</span>
            <span className="font-medium text-gray-900">{formatLastLogin(user.lastLogin)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Login Count:</span>
            <span className="font-medium text-gray-900">{user.loginCount}</span>
          </div>
          {user.isOnline && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Session:</span>
              <span className="font-medium text-emerald-600">{user.sessionDuration} min</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
            <Eye className="w-4 h-4" />
            View
          </button>
          <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700">
            <Bell className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>
    </div>
  );
};

// User Row Component
const UserRow: React.FC<{
  user: User;
  isSelected: boolean;
  onSelect: () => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatLastLogin: (dateString: string) => string;
}> = ({ user, isSelected, onSelect, getStatusColor, getStatusIcon, formatLastLogin }) => {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-emerald-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff&size=40`}
            alt={user.name}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{user.role}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
          {getStatusIcon(user.status)}
          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatLastLogin(user.lastLogin)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-900">
            {user.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button className="text-emerald-600 hover:text-emerald-900">
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-blue-600 hover:text-blue-900">
            <Edit className="w-4 h-4" />
          </button>
          <button className="text-gray-600 hover:text-gray-900">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ActiveUsers;

