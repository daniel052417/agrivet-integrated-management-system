import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Shield, Users, Settings, Eye, Edit, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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
  role_id: number;
  role_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type RolePermission = {
  id: string;
  role_id: string;
  role_name: string;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
};

const DEFAULT_PERMS: RolePermissions = {
  dashboard: { view: true, edit: false, delete: false },
  sales: { view: true, edit: true, delete: false },
  inventory: { view: true, edit: false, delete: false },
  staff: { view: false, edit: false, delete: false },
  reports: { view: true, edit: false, delete: false },
  settings: { view: false, edit: false, delete: false },
};

const RolesPermissions: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [staffRows, setStaffRows] = useState<StaffRow[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleDescription, setNewRoleDescription] = useState<string>('');
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [reassignRole, setReassignRole] = useState<string>('');
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [bulkAssignRole, setBulkAssignRole] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch staff data
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id, first_name, last_name, email, role, is_active, employee_id, position, department');
        if (staffError) throw staffError;

        // Fetch role definitions
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .order('role_name');
        if (roleError) throw roleError;

        // Fetch role permissions
        const { data: permissionData, error: permissionError } = await supabase
          .from('role_permissions')
          .select('*');
        if (permissionError) throw permissionError;

        setStaffRows((staffData as StaffRow[]) || []);
        setRoleDefinitions((roleData as RoleDefinition[]) || []);
        setRolePermissions((permissionData as RolePermission[]) || []);
      } catch (e: any) {
        console.error('Failed to load data', e);
        setError('Failed to load data: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRolePermissions = useCallback((roleName: string): RolePermissions => {
    const permissions: RolePermissions = { ...DEFAULT_PERMS };
    rolePermissions
      .filter(p => p.role_name === roleName)
      .forEach(p => {
        permissions[p.module] = {
          view: p.can_view,
          edit: p.can_edit,
          delete: p.can_delete,
        };
      });
    return permissions;
  }, [rolePermissions]);

  const builtRoles = useMemo(() => {
    const colorPalette = ['bg-red-600','bg-blue-600','bg-green-600','bg-purple-600','bg-orange-600','bg-teal-600'];
    const counts = new Map<string, number>();
    staffRows.forEach(s => {
      const r = (s.role || 'user').trim();
      counts.set(r, (counts.get(r) || 0) + 1);
    });
    
    const roles = roleDefinitions.map((roleDef, idx) => ({
      id: roleDef.role_name,
      name: roleDef.role_name.charAt(0).toUpperCase() + roleDef.role_name.slice(1),
      description: roleDef.description || 'Custom role',
      userCount: counts.get(roleDef.role_name) || 0,
      color: colorPalette[idx % colorPalette.length],
      isSystemRole: ['admin', 'manager', 'cashier', 'hr', 'marketing', 'inventory', 'user'].includes(roleDef.role_name),
      permissions: getRolePermissions(roleDef.role_name),
    }));
    return roles.sort((a,b)=> b.userCount - a.userCount);
  }, [staffRows, roleDefinitions, rolePermissions, getRolePermissions]);

  useEffect(()=>{
    if (!selectedRole && builtRoles.length) setSelectedRole(builtRoles[0].id);
  }, [builtRoles, selectedRole]);

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

  // static staffByRole removed in favor of Supabase-driven staffRows

  const selectedRoleData = builtRoles.find(role => role.id === selectedRole);

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const roleName = newRoleName.trim().toLowerCase().replace(/\s+/g, '_');
      
      if (!roleName) {
        setError('Role name is required');
        return;
      }

      // Check if role already exists
      const existingRole = roleDefinitions.find(r => r.role_name === roleName);
      if (existingRole) {
        setError('Role already exists');
        return;
      }

      // Create role definition
      const { data: newRole, error: roleError } = await supabase
        .from('roles')
        .insert({
          role_name: roleName,
          description: newRoleDescription.trim() || null
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Create default permissions for the new role
      const permissionInserts = Object.entries(DEFAULT_PERMS).map(([module, perms]) => ({
        role_id: newRole.role_id.toString(),
        role_name: roleName,
        module,
        can_view: perms.view,
        can_edit: perms.edit,
        can_delete: perms.delete
      }));

      const { error: permissionError } = await supabase
        .from('role_permissions')
        .insert(permissionInserts);

      if (permissionError) throw permissionError;

      // Refresh data
      const { data: updatedRoles } = await supabase
        .from('roles')
        .select('*')
        .order('role_name');
      
      const { data: updatedPermissions } = await supabase
        .from('role_permissions')
        .select('*');

      setRoleDefinitions(updatedRoles || []);
      setRolePermissions(updatedPermissions || []);
      setSelectedRole(roleName);
      setIsCreateOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setSuccess('Role created successfully');
    } catch (e: any) {
      console.error('Failed to create role', e);
      setError('Failed to create role: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRole(roleId: string) {
    const isSystemRole = ['admin', 'manager', 'cashier', 'hr', 'marketing', 'inventory', 'user'].includes(roleId);
    if (isSystemRole) {
      setError('Cannot delete system roles');
      return;
    }

    const userCount = staffRows.filter(s => (s.role || 'user') === roleId).length;
    if (userCount > 0) {
      setRoleToDelete(roleId);
      setReassignRole('user');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Delete role permissions first
      const { error: permissionError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_name', roleId);

      if (permissionError) throw permissionError;

      // Delete role definition
      const { error: roleError } = await supabase
        .from('roles')
        .delete()
        .eq('role_name', roleId);

      if (roleError) throw roleError;

      // Refresh data
      const { data: updatedRoles } = await supabase
        .from('roles')
        .select('*')
        .order('role_name');
      
      const { data: updatedPermissions } = await supabase
        .from('role_permissions')
        .select('*');

      setRoleDefinitions(updatedRoles || []);
      setRolePermissions(updatedPermissions || []);
      
      const next = builtRoles.find(r => r.id !== roleId)?.id || '';
      setSelectedRole(next);
      setSuccess('Role deleted successfully');
    } catch (e: any) {
      console.error('Failed to delete role', e);
      setError('Failed to delete role: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmReassignAndDelete() {
    if (!roleToDelete) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Reassign staff to new role
      const { error: staffError } = await supabase
        .from('staff')
        .update({ role: reassignRole })
        .eq('role', roleToDelete);

      if (staffError) throw staffError;

      // Delete role permissions
      const { error: permissionError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_name', roleToDelete);

      if (permissionError) throw permissionError;

      // Delete role definition
      const { error: roleError } = await supabase
        .from('roles')
        .delete()
        .eq('role_name', roleToDelete);

      if (roleError) throw roleError;

      // Refresh all data
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, role, is_active, employee_id, position, department');
      
      const { data: updatedRoles } = await supabase
        .from('roles')
        .select('*')
        .order('role_name');
      
      const { data: updatedPermissions } = await supabase
        .from('role_permissions')
        .select('*');

      setStaffRows((staffData as StaffRow[]) || []);
      setRoleDefinitions(updatedRoles || []);
      setRolePermissions(updatedPermissions || []);
      setSelectedRole(reassignRole || '');
      setSuccess('Role reassigned and deleted successfully');
    } catch (e: any) {
      console.error('Failed to reassign and delete role', e);
      setError('Failed to reassign and delete role: ' + e.message);
    } finally {
      setSaving(false);
      setRoleToDelete(null);
    }
  }

  async function togglePermission(moduleId: keyof RolePermissions, field: keyof PermissionTriple) {
    if (!selectedRole) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const currentPermission = rolePermissions.find(
        p => p.role_name === selectedRole && p.module === moduleId
      );

      const newValue = !(currentPermission as any)?.[`can_${field}`];

      if (currentPermission) {
        // Update existing permission
        const { error } = await supabase
          .from('role_permissions')
          .update({ [`can_${field}`]: newValue })
          .eq('role_name', selectedRole)
          .eq('module', moduleId);

        if (error) throw error;
      } else {
        // Get role_id for the selected role
        const roleDef = roleDefinitions.find(r => r.role_name === selectedRole);
        if (!roleDef) throw new Error('Role not found');

        // Create new permission
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role_id: roleDef.role_id.toString(),
            role_name: selectedRole,
            module: moduleId,
            can_view: field === 'view' ? newValue : false,
            can_edit: field === 'edit' ? newValue : false,
            can_delete: field === 'delete' ? newValue : false,
          });

        if (error) throw error;
      }

      // Refresh permissions data
      const { data: updatedPermissions } = await supabase
        .from('role_permissions')
        .select('*');

      setRolePermissions(updatedPermissions || []);
      setSuccess('Permission updated successfully');
    } catch (e: any) {
      console.error('Failed to update permission', e);
      setError('Failed to update permission: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkRoleAssignment() {
    if (!bulkAssignRole || selectedStaff.length === 0) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('staff')
        .update({ role: bulkAssignRole })
        .in('id', selectedStaff);

      if (error) throw error;

      // Refresh staff data
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, role, is_active, employee_id, position, department');

      setStaffRows((staffData as StaffRow[]) || []);
      setSelectedStaff([]);
      setIsBulkAssignOpen(false);
      setBulkAssignRole('');
      setSuccess(`Successfully assigned ${selectedStaff.length} staff members to ${bulkAssignRole} role`);
    } catch (e: any) {
      console.error('Failed to assign roles', e);
      setError('Failed to assign roles: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

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
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {builtRoles.map((role) => (
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
                {!role.isSystemRole && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                )}
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
                  const perms = getRolePermissions(selectedRole)[module.id as keyof RolePermissions];
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
                        <button 
                          onClick={() => togglePermission(module.id as keyof RolePermissions, 'view')} 
                          disabled={saving}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getPermissionIcon(perms.view)}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => togglePermission(module.id as keyof RolePermissions, 'edit')} 
                          disabled={saving}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getPermissionIcon(perms.edit)}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => togglePermission(module.id as keyof RolePermissions, 'delete')} 
                          disabled={saving}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getPermissionIcon(perms.delete)}
                        </button>
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
              {builtRoles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedStaff.length === staffRows.filter(s => (s.role || 'user') === selectedRole).length && staffRows.filter(s => (s.role || 'user') === selectedRole).length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStaff(staffRows.filter(s => (s.role || 'user') === selectedRole).map(s => s.id));
                  } else {
                    setSelectedStaff([]);
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
            {selectedStaff.length > 0 && (
              <button
                onClick={() => setIsBulkAssignOpen(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Role ({selectedStaff.length})
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(loading ? [] : staffRows.filter(s => (s.role || 'user') === selectedRole)).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStaff(prev => [...prev, s.id]);
                      } else {
                        setSelectedStaff(prev => prev.filter(id => id !== s.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{`${s.first_name || ''} ${s.last_name || ''}`.trim() || '—'}</p>
                    <p className="text-xs text-gray-500">{s.email || '—'}</p>
                    {s.position && <p className="text-xs text-gray-400">{s.position}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
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
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Create New Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Role Name</label>
                <input 
                  value={newRoleName} 
                  onChange={e=>setNewRoleName(e.target.value)} 
                  placeholder="e.g., Store Supervisor" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description (Optional)</label>
                <textarea 
                  value={newRoleDescription} 
                  onChange={e=>setNewRoleDescription(e.target.value)} 
                  placeholder="Brief description of the role's responsibilities" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none"
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={()=> setIsCreateOpen(false)} 
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Role</h3>
            <p className="text-sm text-gray-600 mb-4">Role "{roleToDelete}" has assigned users. Reassign them to:</p>
            <select value={reassignRole} onChange={e=>setReassignRole(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4">
              {builtRoles.filter(r => r.id !== roleToDelete).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <div className="flex items-center justify-end space-x-3">
              <button 
                onClick={()=> setRoleToDelete(null)} 
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReassignAndDelete} 
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Reassign & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assignment Modal */}
      {isBulkAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Bulk Role Assignment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Assign {selectedStaff.length} selected staff members to a new role:
            </p>
            <select 
              value={bulkAssignRole} 
              onChange={e=>setBulkAssignRole(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              required
            >
              <option value="">Select a role</option>
              {builtRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <div className="flex items-center justify-end space-x-3">
              <button 
                onClick={() => setIsBulkAssignOpen(false)} 
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkRoleAssignment} 
                disabled={saving || !bulkAssignRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Assign Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Create New Role</span>
          </button>
          <button 
            onClick={() => setIsBulkAssignOpen(true)}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
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