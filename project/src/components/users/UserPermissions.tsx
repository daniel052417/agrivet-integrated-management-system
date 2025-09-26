import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Key, Search, Download, SortAsc, SortDesc, Edit, Trash2, PlusCircle, X, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ModuleKey = 'dashboard' | 'inventory' | 'sales' | 'reports' | 'staff' | 'marketing' | 'settings';

type ActionKey = 'read' | 'create' | 'update' | 'delete' | 'export';

const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'sales', label: 'Sales' },
  { key: 'reports', label: 'Reports' },
  { key: 'staff', label: 'Staff' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'settings', label: 'Settings' }
];

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: 'read', label: 'Read' },
  { key: 'create', label: 'Create' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
  { key: 'export', label: 'Export' }
];

type PermissionMatrix = Record<ModuleKey, Partial<Record<ActionKey, boolean>>>;

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionMatrix;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: PermissionMatrix;
  lastLogin: string;
  isActive: boolean;
}

const UserPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: ''
  });
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({} as PermissionMatrix);
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('role_name');

      if (rolesError) throw rolesError;

      // Load role permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      // Load users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const { data: profiles, error: profilesError } = await supabase
        .from('users')
        .select('*');

      if (profilesError) throw profilesError;

      // Process roles
      const processedRoles: Role[] = rolesData?.map(role => {
        const rolePermissions = permissionsData?.filter(p => p.role_id === role.role_id.toString()) || [];
        const permissions: PermissionMatrix = {} as PermissionMatrix;
        
        MODULES.forEach(module => {
          permissions[module] = {};
          ACTIONS.forEach(action => {
            const permission = rolePermissions.find(p => p.resource === module && p.action === action);
            permissions[module][action] = permission?.granted || false;
          });
        });

        return {
          id: role.role_id.toString(),
          name: role.role_name,
          description: role.description || '',
          permissions,
          userCount: 0, // This would be calculated from actual user counts
          createdAt: role.created_at,
          updatedAt: role.updated_at
        };
      }) || [];

      // Process users
      const processedUsers: User[] = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.user_id === authUser.id);
        const userRole = processedRoles.find(r => r.name === profile?.role);
        
        return {
          id: authUser.id,
          name: profile?.full_name || `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim() || 'Unknown User',
          email: authUser.email || '',
          role: profile?.role || 'user',
          permissions: userRole?.permissions || {} as PermissionMatrix,
          lastLogin: authUser.last_sign_in_at || '',
          isActive: !!authUser.email_confirmed_at
        };
      });

      setRoles(processedRoles);
      setUsers(processedUsers);

    } catch (err: any) {
      console.error('Error loading permissions data:', err);
      setError(err.message || 'Failed to load permissions data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleCreateRole = async () => {
    try {
      if (!roleForm.name.trim()) {
        alert('Role name is required');
        return;
      }

      // Create role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert({
          role_name: roleForm.name.trim(),
          description: roleForm.description.trim() || null
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Create permissions
      const permissionsToInsert = [];
      MODULES.forEach(module => {
        ACTIONS.forEach(action => {
          const hasPermission = permissionMatrix[module]?.[action] || false;
          permissionsToInsert.push({
            role_id: roleData.role_id.toString(),
            permission_name: `${module}_${action}`,
            resource: module,
            action: action,
            granted: hasPermission
          });
        });
      });

      const { error: permissionsError } = await supabase
        .from('role_permissions')
        .insert(permissionsToInsert);

      if (permissionsError) throw permissionsError;

      setRoleForm({ name: '', description: '' });
      setPermissionMatrix({} as PermissionMatrix);
      setShowRoleModal(false);
      loadData();

    } catch (err: any) {
      console.error('Error creating role:', err);
      alert(err.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    try {
      if (!editingRole || !roleForm.name.trim()) {
        alert('Role name is required');
        return;
      }

      // Update role
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          role_name: roleForm.name.trim(),
          description: roleForm.description.trim() || null
        })
        .eq('role_id', editingRole.id);

      if (roleError) throw roleError;

      // Update permissions
      const permissionsToUpdate = [];
      MODULES.forEach(module => {
        ACTIONS.forEach(action => {
          const hasPermission = permissionMatrix[module]?.[action] || false;
          permissionsToUpdate.push({
            role_id: editingRole.id,
            permission_name: `${module}_${action}`,
            resource: module,
            action: action,
            granted: hasPermission
          });
        });
      });

      // Delete existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', editingRole.id);

      // Insert new permissions
      const { error: permissionsError } = await supabase
        .from('role_permissions')
        .insert(permissionsToUpdate);

      if (permissionsError) throw permissionsError;

      setEditingRole(null);
      setRoleForm({ name: '', description: '' });
      setPermissionMatrix({} as PermissionMatrix);
      setShowRoleModal(false);
      loadData();

    } catch (err: any) {
      console.error('Error updating role:', err);
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete permissions first
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Delete role
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('role_id', roleId);

      if (error) throw error;

      loadData();

    } catch (err: any) {
      console.error('Error deleting role:', err);
      alert(err.message || 'Failed to delete role');
    }
  };

  const handlePermissionChange = (module: ModuleKey, action: ActionKey, value: boolean) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value
      }
    }));
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setPermissionMatrix(role.permissions);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPermissionMatrix(user.permissions);
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckSquare className="w-4 h-4 text-green-600" />
    ) : (
      <Square className="w-4 h-4 text-gray-400" />
    );
  };

  const getPermissionColor = (hasPermission: boolean) => {
    return hasPermission ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Permissions</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="user-permissions">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Permissions</h1>
          <p className="text-gray-600">Manage roles, permissions, and user access control</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { id: 'roles', label: 'Roles', icon: Shield },
              { id: 'users', label: 'Users', icon: Key }
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

        {/* Search and Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              {activeTab === 'roles' && (
                <button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleForm({ name: '', description: '' });
                    setPermissionMatrix({} as PermissionMatrix);
                    setShowRoleModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Role</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map(role => (
                <div key={role.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingRole(role);
                          setRoleForm({ name: role.name, description: role.description });
                          setPermissionMatrix(role.permissions);
                          setShowRoleModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                      {role.userCount} users • Created {formatDate(role.createdAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated {formatDate(role.updatedAt)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleSelectRole(role)}
                    className="w-full mt-4 px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    View Permissions
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSelectUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Permissions"
                          >
                            <Key className="w-4 h-4" />
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

        {/* Permission Matrix */}
        {(selectedRole || selectedUser) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Permissions for {selectedRole?.name || selectedUser?.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Module</th>
                    {ACTIONS.map(action => (
                      <th key={action.key} className="px-4 py-2 text-center text-sm font-medium text-gray-500">
                        {action.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map(module => (
                    <tr key={module.key} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {module.label}
                      </td>
                      {ACTIONS.map(action => {
                        const hasPermission = permissionMatrix[module.key]?.[action.key] || false;
                        return (
                          <td key={action.key} className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center">
                              {getPermissionIcon(hasPermission)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingRole ? 'Edit Role' : 'Create New Role'}
                  </h3>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                      <input
                        type="text"
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter role name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={roleForm.description}
                        onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter role description"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Permissions</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Module</th>
                            {ACTIONS.map(action => (
                              <th key={action.key} className="px-4 py-2 text-center text-sm font-medium text-gray-500">
                                {action.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MODULES.map(module => (
                            <tr key={module.key} className="border-t border-gray-200">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {module.label}
                              </td>
                              {ACTIONS.map(action => {
                                const hasPermission = permissionMatrix[module.key]?.[action.key] || false;
                                return (
                                  <td key={action.key} className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handlePermissionChange(module.key, action.key, !hasPermission)}
                                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                                        hasPermission 
                                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                      }`}
                                    >
                                      {getPermissionIcon(hasPermission)}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredRoles.length === 0 && activeTab === 'roles' && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'No roles match your search criteria.'
                : 'No roles have been created yet.'
              }
            </p>
          </div>
        )}

        {filteredUsers.length === 0 && activeTab === 'users' && (
          <div className="text-center py-12">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'No users match your search criteria.'
                : 'No users found in the system.'
              }
            </p>
          </div>
        )}
      </div>
  );
};

export default UserPermissions;

