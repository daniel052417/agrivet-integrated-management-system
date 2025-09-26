import React, { useState, useEffect } from 'react';
import { useSimplifiedPermissions } from '../../permissions/SimplifiedPermissionContext';
import { COMPONENT_PATHS, PERMISSION_CATEGORIES } from '../../types/permissions';
import { 
  Settings, 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Check,
  Lock,
  Unlock
} from 'lucide-react';

interface PermissionManagerProps {
  className?: string;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({ className = "" }) => {
  const {
    availableRoles,
    createCustomRole,
    updateRolePermissions,
    assignUserRole,
    isLoading,
    error
  } = useSimplifiedPermissions();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: ''
  });
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedRole) {
      // Load role permissions
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  const loadRolePermissions = async (roleId: string) => {
    // This would load the actual permissions for the role
    // For now, we'll use a mock implementation
    const mockPermissions: Record<string, boolean> = {};
    Object.values(COMPONENT_PATHS).forEach(path => {
      mockPermissions[path] = Math.random() > 0.5; // Random for demo
    });
    setRolePermissions(mockPermissions);
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.displayName) return;

    const success = await createCustomRole({
      name: newRole.name,
      displayName: newRole.displayName,
      description: newRole.description,
      isCustom: true,
      permissions: [] // Would be populated based on selected permissions
    });

    if (success) {
      setIsCreatingRole(false);
      setNewRole({ name: '', displayName: '', description: '' });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    // Convert boolean permissions to actual permission objects
    const permissions = Object.entries(rolePermissions)
      .filter(([_, enabled]) => enabled)
      .map(([componentPath, _]) => ({
        id: `perm_${componentPath.replace('/', '_')}`,
        name: `Access ${componentPath}`,
        description: `Access to ${componentPath} component`,
        resource: componentPath.split('/')[0],
        action: 'read',
        component: componentPath,
        category: 'standard' as const,
        isVisible: true,
        isEnabled: true
      }));

    const success = await updateRolePermissions(selectedRole, permissions);
    if (success) {
      setEditingPermissions(false);
    }
  };

  const togglePermission = (componentPath: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [componentPath]: !prev[componentPath]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading permissions...</span>
      </div>
    );
  }

  return (
    <div className={`permission-manager ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Permission Management</h2>
            </div>
            <button
              onClick={() => setIsCreatingRole(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Role</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role to Manage
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 text-left border rounded-lg transition-colors ${
                    selectedRole === role.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{role.displayName}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                    {role.isCustom && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permission Management */}
          {selectedRole && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Component Permissions
                </h3>
                <div className="flex space-x-2">
                  {editingPermissions ? (
                    <>
                      <button
                        onClick={handleSavePermissions}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingPermissions(false)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingPermissions(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Permissions</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Component Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(COMPONENT_PATHS).map(([key, componentPath]) => {
                  const isEnabled = rolePermissions[componentPath] || false;
                  const category = componentPath.includes('sensitive') ? 'sensitive' : 'standard';
                  
                  return (
                    <div
                      key={componentPath}
                      className={`p-4 border rounded-lg ${
                        isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {componentPath.split('/').join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        {editingPermissions ? (
                          <button
                            onClick={() => togglePermission(componentPath)}
                            className={`p-1 rounded ${
                              isEnabled ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        ) : (
                          <div className={`p-1 rounded ${
                            isEnabled ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {isEnabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {componentPath}
                      </p>
                      {category === 'sensitive' && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          Sensitive
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {isCreatingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Custom Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., branch-manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Branch Manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Role description..."
                />
              </div>
              
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreatingRole(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





