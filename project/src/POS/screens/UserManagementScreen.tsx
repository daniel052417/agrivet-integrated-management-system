import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  Clock,
  UserCheck,
  LogIn,
  LogOut,
  Filter,
  Download,
  Settings,
  AlertCircle
} from 'lucide-react';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  shiftStart?: string;
  shiftEnd?: string;
  isOnShift: boolean;
  permissions: string[];
  createdDate: string;
  lastActivity: string;
}

interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'overtime';
  salesCount: number;
  totalSales: number;
  notes?: string;
}

const UserManagementScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Mock users data
  const users: User[] = [
    {
      id: '1',
      name: 'John Cashier',
      email: 'john.cashier@agrivet.com',
      role: 'Cashier',
      status: 'active',
      lastLogin: '2024-01-15T08:30:00Z',
      shiftStart: '2024-01-15T08:00:00Z',
      shiftEnd: '2024-01-15T17:00:00Z',
      isOnShift: true,
      permissions: ['pos_access', 'sales_view', 'customer_management'],
      createdDate: '2023-06-15',
      lastActivity: '2024-01-15T14:30:00Z'
    },
    {
      id: '2',
      name: 'Maria Manager',
      email: 'maria.manager@agrivet.com',
      role: 'Manager',
      status: 'active',
      lastLogin: '2024-01-15T07:45:00Z',
      shiftStart: '2024-01-15T07:30:00Z',
      shiftEnd: '2024-01-15T18:00:00Z',
      isOnShift: true,
      permissions: ['pos_access', 'inventory_management', 'user_management', 'reports_view'],
      createdDate: '2023-05-20',
      lastActivity: '2024-01-15T15:00:00Z'
    },
    {
      id: '3',
      name: 'Pedro Inventory',
      email: 'pedro.inventory@agrivet.com',
      role: 'Inventory Clerk',
      status: 'active',
      lastLogin: '2024-01-14T16:20:00Z',
      isOnShift: false,
      permissions: ['inventory_management', 'stock_view'],
      createdDate: '2023-08-10',
      lastActivity: '2024-01-14T16:20:00Z'
    },
    {
      id: '4',
      name: 'Ana Admin',
      email: 'ana.admin@agrivet.com',
      role: 'Admin',
      status: 'active',
      lastLogin: '2024-01-15T09:15:00Z',
      isOnShift: false,
      permissions: ['all_permissions'],
      createdDate: '2023-01-01',
      lastActivity: '2024-01-15T12:00:00Z'
    },
    {
      id: '5',
      name: 'Carlos Temp',
      email: 'carlos.temp@agrivet.com',
      role: 'Cashier',
      status: 'suspended',
      lastLogin: '2024-01-10T10:00:00Z',
      isOnShift: false,
      permissions: ['pos_access'],
      createdDate: '2023-12-01',
      lastActivity: '2024-01-10T10:00:00Z'
    }
  ];

  // Mock shifts data
  const shifts: Shift[] = [
    {
      id: '1',
      userId: '1',
      userName: 'John Cashier',
      startTime: '2024-01-15T08:00:00Z',
      status: 'active',
      salesCount: 15,
      totalSales: 12500.00,
      notes: 'Regular shift'
    },
    {
      id: '2',
      userId: '2',
      userName: 'Maria Manager',
      startTime: '2024-01-15T07:30:00Z',
      status: 'active',
      salesCount: 8,
      totalSales: 8500.00,
      notes: 'Manager shift'
    },
    {
      id: '3',
      userId: '1',
      userName: 'John Cashier',
      startTime: '2024-01-14T08:00:00Z',
      endTime: '2024-01-14T17:00:00Z',
      status: 'completed',
      salesCount: 22,
      totalSales: 18750.00
    }
  ];

  const roles = ['all', 'Admin', 'Manager', 'Cashier', 'Inventory Clerk', 'HR Staff'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeUsers = users.filter(u => u.status === 'active').length;
  const onShiftUsers = users.filter(u => u.isOnShift).length;
  const totalUsers = users.length;
  const activeShifts = shifts.filter(s => s.status === 'active').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'overtime': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <TouchButton
              onClick={() => setShowShiftModal(true)}
              variant="outline"
              icon={Clock}
            >
              View Shifts
            </TouchButton>
            
            <TouchButton
              onClick={() => console.log('Export users')}
              variant="outline"
              icon={Download}
            >
              Export
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowAddUserModal(true)}
              variant="primary"
              icon={Plus}
            >
              Add User
            </TouchButton>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <LogIn className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Shift</p>
                <p className="text-2xl font-bold text-blue-600">{onShiftUsers}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Shifts</p>
                <p className="text-2xl font-bold text-purple-600">{activeShifts}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Users ({filteredUsers.length})</h2>
          <div className="flex space-x-2">
            <TouchButton
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
            >
              Grid
            </TouchButton>
            <TouchButton
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
            >
              Table
            </TouchButton>
          </div>
        </div>

        {/* Users Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4">
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.role}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status.toUpperCase()}
                        </span>
                        {user.isOnShift && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                            ON SHIFT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Last Login:</strong> {formatDate(user.lastLogin)}
                    </div>
                    {user.shiftStart && (
                      <div className="text-sm text-gray-600">
                        <strong>Shift:</strong> {formatTime(user.shiftStart)} - {user.shiftEnd ? formatTime(user.shiftEnd) : 'Ongoing'}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <strong>Permissions:</strong> {user.permissions.length} granted
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <TouchButton
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserDetailsModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      className="flex-1"
                    >
                      View
                    </TouchButton>
                    <TouchButton
                      onClick={() => console.log('Edit user:', user.id)}
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      className="flex-1"
                    >
                      Edit
                    </TouchButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isOnShift ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                            ON SHIFT
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                            OFF SHIFT
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetailsModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => console.log('Edit user:', user.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => console.log('Delete user:', user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={showUserDetailsModal}
          onClose={() => setShowUserDetailsModal(false)}
          title={selectedUser.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                  {selectedUser.status.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.lastLogin)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Activity</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.lastActivity)}</p>
              </div>
            </div>

            {/* Shift Information */}
            {selectedUser.shiftStart && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Shift</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <p className="mt-1 text-sm text-gray-900">{formatTime(selectedUser.shiftStart)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.shiftEnd ? formatTime(selectedUser.shiftEnd) : 'Ongoing'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUser.permissions.map(permission => (
                  <span key={permission} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {permission.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <TouchButton
                onClick={() => setShowUserDetailsModal(false)}
                variant="outline"
              >
                Close
              </TouchButton>
              <TouchButton
                onClick={() => console.log('Edit user:', selectedUser.id)}
                variant="primary"
                icon={Edit}
              >
                Edit User
              </TouchButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Shifts Modal */}
      <Modal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title="Shift Management"
        size="xl"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Current and Recent Shifts</h3>
            <TouchButton
              onClick={() => console.log('Start new shift')}
              variant="primary"
              icon={Clock}
            >
              Start New Shift
            </TouchButton>
          </div>

          <div className="space-y-4">
            {shifts.map(shift => (
              <div key={shift.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{shift.userName}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>Start: {formatTime(shift.startTime)}</div>
                      {shift.endTime && <div>End: {formatTime(shift.endTime)}</div>}
                      <div>Sales: {shift.salesCount} transactions</div>
                      <div>Total: ₱{shift.totalSales.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShiftStatusColor(shift.status)}`}>
                      {shift.status.toUpperCase()}
                    </span>
                    {shift.notes && (
                      <p className="text-xs text-gray-500 text-right">{shift.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <TouchButton
              onClick={() => setShowShiftModal(false)}
              variant="outline"
            >
              Close
            </TouchButton>
            <TouchButton
              onClick={() => console.log('Export shifts')}
              variant="primary"
              icon={Download}
            >
              Export Shifts
            </TouchButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementScreen;















