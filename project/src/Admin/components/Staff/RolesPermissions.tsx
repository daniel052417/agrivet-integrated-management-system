import React, { useState } from 'react';
import { Shield, Users, Settings, Eye, Edit, Plus, Trash2, Check, X, Lock, Unlock } from 'lucide-react';

const RolesPermissions: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('store-manager');

  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access with all permissions',
      userCount: 2,
      color: 'bg-red-600',
      permissions: {
        dashboard: { view: true, edit: true, delete: true },
        sales: { view: true, edit: true, delete: true },
        inventory: { view: true, edit: true, delete: true },
        staff: { view: true, edit: true, delete: true },
        reports: { view: true, edit: true, delete: true },
        settings: { view: true, edit: true, delete: true }
      }
    },
    {
      id: 'store-manager',
      name: 'Store Manager',
      description: 'Manage store operations, staff, and inventory',
      userCount: 3,
      color: 'bg-blue-600',
      permissions: {
        dashboard: { view: true, edit: true, delete: false },
        sales: { view: true, edit: true, delete: false },
        inventory: { view: true, edit: true, delete: false },
        staff: { view: true, edit: true, delete: false },
        reports: { view: true, edit: false, delete: false },
        settings: { view: true, edit: false, delete: false }
      }
    },
    {
      id: 'veterinarian',
      name: 'Veterinarian',
      description: 'Access to veterinary services and medical inventory',
      userCount: 4,
      color: 'bg-green-600',
      permissions: {
        dashboard: { view: true, edit: false, delete: false },
        sales: { view: true, edit: true, delete: false },
        inventory: { view: true, edit: true, delete: false },
        staff: { view: false, edit: false, delete: false },
        reports: { view: true, edit: false, delete: false },
        settings: { view: false, edit: false, delete: false }
      }
    },
    {
      id: 'sales-associate',
      name: 'Sales Associate',
      description: 'Handle sales transactions and customer service',
      userCount: 8,
      color: 'bg-purple-600',
      permissions: {
        dashboard: { view: true, edit: false, delete: false },
        sales: { view: true, edit: true, delete: false },
        inventory: { view: true, edit: false, delete: false },
        staff: { view: false, edit: false, delete: false },
        reports: { view: true, edit: false, delete: false },
        settings: { view: false, edit: false, delete: false }
      }
    },
    {
      id: 'inventory-clerk',
      name: 'Inventory Clerk',
      description: 'Manage inventory, stock levels, and warehouse operations',
      userCount: 4,
      color: 'bg-orange-600',
      permissions: {
        dashboard: { view: true, edit: false, delete: false },
        sales: { view: true, edit: false, delete: false },
        inventory: { view: true, edit: true, delete: false },
        staff: { view: false, edit: false, delete: false },
        reports: { view: true, edit: false, delete: false },
        settings: { view: false, edit: false, delete: false }
      }
    }
  ];

  const permissionModules = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Access to main dashboard and analytics',
      icon: Settings
    },
    {
      id: 'sales',
      name: 'Sales & POS',
      description: 'Sales transactions, records, and POS system',
      icon: Settings
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Product management, stock control, and categories',
      icon: Settings
    },
    {
      id: 'staff',
      name: 'Staff Management',
      description: 'Employee records, attendance, and HR functions',
      icon: Users
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      description: 'Generate and view business reports',
      icon: Settings
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'System configuration and administrative settings',
      icon: Settings
    }
  ];

  const staffByRole = [
    { name: 'Maria Santos', role: 'Store Manager', email: 'maria.santos@agrivet.com', status: 'Active' },
    { name: 'Juan Dela Cruz', role: 'Veterinarian', email: 'juan.delacruz@agrivet.com', status: 'Active' },
    { name: 'Ana Rodriguez', role: 'Sales Associate', email: 'ana.rodriguez@agrivet.com', status: 'Active' },
    { name: 'Carlos Martinez', role: 'Inventory Clerk', email: 'carlos.martinez@agrivet.com', status: 'On Leave' }
  ];

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">Manage user roles and system access permissions</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div 
            key={role.id} 
            className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200 ${
              selectedRole === role.id ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole(role.id)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${role.color} bg-opacity-10`}>
                  <Shield className={`w-6 h-6 ${role.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">{role.userCount}</span>
                  <p className="text-sm text-gray-500">users</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.name}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors">
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      {selectedRoleData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Permissions for {selectedRoleData.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{selectedRoleData.description}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${selectedRoleData.color}`}>
              {selectedRoleData.userCount} users
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delete
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissionModules.map((module) => {
                  const permissions = selectedRoleData.permissions[module.id as keyof typeof selectedRoleData.permissions];
                  const Icon = module.icon;
                  return (
                    <tr key={module.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{module.name}</div>
                            <div className="text-sm text-gray-500">{module.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getPermissionIcon(permissions.view)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getPermissionIcon(permissions.edit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getPermissionIcon(permissions.delete)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Members by Role */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Staff Members</h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffByRole.map((staff, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                  <p className="text-xs text-gray-500">{staff.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {staff.status}
                </span>
                <div className="flex items-center space-x-1">
                  <button className="text-blue-600 hover:text-blue-800 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-800 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Create New Role</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Assign Bulk Roles</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Shield className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Permission Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;