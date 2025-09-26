import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Shield, Users, Settings, Eye, Edit, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type StaffRow = { 
  id: string; 
  first_name: string | null; 
  last_name: string | null; 
  email: string | null; 
  role: string | null; 
  is_active: boolean;
  employee_id: string | null;
  position: string | null;
  department: string | null;
};

type PermissionTriple = { view: boolean; edit: boolean; delete: boolean };
type RolePermissions = Record<string, PermissionTriple>;

type RoleDefinition = {
  id: string; // UUID
  role_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type RolePermission = {
  id: string;
  role_id: string;
  permission_name: string;
  resource: string;
  action: string;
  granted: boolean;
};

const RolesPermissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignments'>('roles');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Roles state
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState({
    role_name: '',
    description: ''
  });

  // Permissions state
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    permission_name: '',
    resource: '',
    action: '',
    granted: true
  });

  // Staff assignments state
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [staffRoleAssignments, setStaffRoleAssignments] = useState<Record<string, string>>({});
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    staff_id: '',
    role_id: ''
  });

  const resourceCategories = [
    'dashboard', 'inventory', 'sales', 'hr', 'marketing', 'reports', 'settings', 'staff', 'users'
  ];

  const actions = ['view', 'edit', 'delete', 'admin'];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('role_name');

      if (rolesError) throw rolesError;

      // Load permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, role, is_active, employee_id, position, department')
        .eq('is_active', true);

      if (staffError) throw staffError;

      setRoles(rolesData || []);
      setPermissions(permissionsData || []);
      setStaff(staffData || []);

      // Process role permissions
      const rolePerms: RolePermissions = {};
      permissionsData?.forEach(perm => {
        if (!rolePerms[perm.role_id]) {
          rolePerms[perm.role_id] = { view: false, edit: false, delete: false };
        }
        
        if (perm.action === 'view') rolePerms[perm.role_id].view = perm.granted;
        if (perm.action === 'edit') rolePerms[perm.role_id].edit = perm.granted;
        if (perm.action === 'delete') rolePerms[perm.role_id].delete = perm.granted;
      });

      setRolePermissions(rolePerms);

      // Process staff role assignments
      const assignments: Record<string, string> = {};
      staffData?.forEach(staffMember => {
        if (staffMember.role) {
          assignments[staffMember.id] = staffMember.role;
        }
      });
      setStaffRoleAssignments(assignments);

    } catch (err: any) {
      console.error('Error loading roles and permissions data:', err);
      setError(err.message || 'Failed to load roles and permissions data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!roleForm.role_name.trim()) {
        alert('Role name is required');
        return;
      }

      const { error } = await supabase
        .from('roles')
        .insert({
          role_name: roleForm.role_name.trim(),
          description: roleForm.description.trim() || null
        });

      if (error) throw error;

      setRoleForm({ role_name: '', description: '' });
      setShowRoleModal(false);
      loadAllData();

    } catch (err: any) {
      console.error('Error creating role:', err);
      alert(err.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    try {
      if (!editingRole || !roleForm.role_name.trim()) {
        alert('Role name is required');
        return;
      }

      const { error } = await supabase
        .from('roles')
        .update({
          role_name: roleForm.role_name.trim(),
          description: roleForm.description.trim() || null
        })
        .eq('id', editingRole.id);

      if (error) throw error;

      setEditingRole(null);
      setRoleForm({ role_name: '', description: '' });
      setShowRoleModal(false);
      loadAllData();

    } catch (err: any) {
      console.error('Error updating role:', err);
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('role_id', roleId);

      if (error) throw error;

      loadAllData();

    } catch (err: any) {
      console.error('Error deleting role:', err);
      alert(err.message || 'Failed to delete role');
    }
  };

  const handleCreatePermission = async () => {
    try {
      if (!permissionForm.permission_name.trim() || !permissionForm.resource || !permissionForm.action) {
        alert('All permission fields are required');
        return;
      }

      const { error } = await supabase
        .from('role_permissions')
        .insert({
          role_id: selectedRole?.role_id.toString() || '',
          permission_name: permissionForm.permission_name.trim(),
          resource: permissionForm.resource,
          action: permissionForm.action,
          granted: permissionForm.granted
        });

      if (error) throw error;

      setPermissionForm({ permission_name: '', resource: '', action: '', granted: true });
      setShowPermissionModal(false);
      loadAllData();

    } catch (err: any) {
      console.error('Error creating permission:', err);
      alert(err.message || 'Failed to create permission');
    }
  };

  const handleAssignRole = async () => {
    try {
      if (!assignmentForm.staff_id || !assignmentForm.role_id) {
        alert('Please select both staff member and role');
        return;
      }

      const { error } = await supabase
        .from('staff')
        .update({ role: assignmentForm.role_id })
        .eq('id', assignmentForm.staff_id);

      if (error) throw error;

      setAssignmentForm({ staff_id: '', role_id: '' });
      setShowAssignmentModal(false);
      loadAllData();

    } catch (err: any) {
      console.error('Error assigning role:', err);
      alert(err.message || 'Failed to assign role');
    }
  };

  const getRolePermissions = (roleId: string) => {
    return rolePermissions[roleId] || { view: false, edit: false, delete: false };
  };

  const getStaffRole = (staffId: string) => {
    return staffRoleAssignments[staffId] || 'No Role';
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.role_id.toString() === roleId);
    return role?.role_name || 'Unknown Role';
  };

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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Roles and Permissions</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="roles-permissions">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Roles & Permissions Management</h1>
          <p className="text-gray-600">Manage user roles, permissions, and access control</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { id: 'roles', label: 'Roles', icon: Shield },
              { id: 'permissions', label: 'Permissions', icon: Settings },
              { id: 'assignments', label: 'Assignments', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Roles Management</h2>
              <button
                onClick={() => {
                  setEditingRole(null);
                  setRoleForm({ role_name: '', description: '' });
                  setShowRoleModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Role</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map(role => (
                <div key={role.role_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.role_name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{role.description || 'No description'}</p>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(role.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingRole(role);
                          setRoleForm({ role_name: role.role_name, description: role.description || '' });
                          setShowRoleModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.role_id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Permissions Management</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedRole?.role_id || ''}
                  onChange={(e) => {
                    const role = roles.find(r => r.role_id.toString() === e.target.value);
                    setSelectedRole(role || null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                  ))}
                </select>
                {selectedRole && (
                  <button
                    onClick={() => setShowPermissionModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Permission</span>
                  </button>
                )}
              </div>
            </div>

            {selectedRole && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Permissions for {selectedRole.role_name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resourceCategories.map(resource => (
                    <div key={resource} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">{resource}</h4>
                      <div className="space-y-2">
                        {actions.map(action => {
                          const permission = permissions.find(p => 
                            p.role_id === selectedRole.role_id.toString() && 
                            p.resource === resource && 
                            p.action === action
                          );
                          return (
                            <div key={action} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 capitalize">{action}</span>
                              <div className="flex items-center space-x-2">
                                {permission ? (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    permission.granted 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {permission.granted ? 'Granted' : 'Denied'}
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                    Not Set
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Role Assignments</h2>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Role</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff.map(staffMember => (
                      <tr key={staffMember.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {`${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim() || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">{staffMember.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {staffMember.position || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {staffMember.department || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getRoleName(getStaffRole(staffMember.id))}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setAssignmentForm({ staff_id: staffMember.id, role_id: getStaffRole(staffMember.id) });
                              setShowAssignmentModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Assignment"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                    <input
                      type="text"
                      value={roleForm.role_name}
                      onChange={(e) => setRoleForm({ ...roleForm, role_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter role name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter role description"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingRole ? handleUpdateRole : handleCreateRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingRole ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permission Modal */}
        {showPermissionModal && selectedRole && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Permission</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name</label>
                    <input
                      type="text"
                      value={permissionForm.permission_name}
                      onChange={(e) => setPermissionForm({ ...permissionForm, permission_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter permission name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                    <select
                      value={permissionForm.resource}
                      onChange={(e) => setPermissionForm({ ...permissionForm, resource: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Resource</option>
                      {resourceCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <select
                      value={permissionForm.action}
                      onChange={(e) => setPermissionForm({ ...permissionForm, action: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Action</option>
                      {actions.map(action => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="granted"
                      checked={permissionForm.granted}
                      onChange={(e) => setPermissionForm({ ...permissionForm, granted: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="granted" className="ml-2 block text-sm text-gray-900">
                      Grant Permission
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowPermissionModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePermission}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Permission
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Role</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                    <select
                      value={assignmentForm.staff_id}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, staff_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Staff Member</option>
                      {staff.map(staffMember => (
                        <option key={staffMember.id} value={staffMember.id}>
                          {`${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim() || 'Unknown'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={assignmentForm.role_id}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, role_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Assign Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default RolesPermissions;

