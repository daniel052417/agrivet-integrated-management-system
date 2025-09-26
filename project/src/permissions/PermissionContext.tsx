import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { PermissionService } from '../lib/permissionService';
import type { 
  Permission, 
  Role, 
  UserRole, 
  SystemRole,
  PermissionCategory 
} from '../types/permissions';
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLES } from '../types/permissions';
import { SimplifiedUser } from '../lib/simplifiedAuth';
import { getRoleInfo } from '../lib/roleHierarchy';

interface PermissionContextType {
  // Current user info
  currentUser: any;
  currentRole: Role | null;
  userPermissions: Permission[];
  
  // Permission checking
  hasPermission: (permission: string) => boolean;
  hasResourceAccess: (resource: string, action: string) => boolean;
  
  // Role management
  availableRoles: Role[];
  createCustomRole: (roleData: Partial<Role>) => Promise<boolean>;
  updateRolePermissions: (roleId: string, permissions: Permission[]) => Promise<boolean>;
  assignUserRole: (userId: string, roleId: string) => Promise<boolean>;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  clearError: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
  user: SimplifiedUser | null;
}

// Helper function to get role information from hardcoded hierarchy
const getRoleDisplayInfo = (roleName: string) => {
  return getRoleInfo(roleName);
};

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children, user }) => {
  const [currentUser, setCurrentUser] = useState<SimplifiedUser | null>(user);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user permissions when user changes
  const loadUserPermissions = async (user: SimplifiedUser | null) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setCurrentRole(null);
        setUserPermissions([]);
        setIsLoading(false);
        return;
      }

      // Create role from SimplifiedUser data
      const roleInfo = getRoleDisplayInfo(user.role_name);
      const role: Role = {
        id: user.role_id,
        name: user.role_name,
        displayName: user.role_display_name || roleInfo.displayName,
        description: user.role_description || roleInfo.description,
        isCustom: !user.role_is_system_role,
        permissions: DEFAULT_ROLE_PERMISSIONS[user.role_name as SystemRole] || [],
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      setCurrentRole(role);
      setUserPermissions(role.permissions);
      setCurrentUser(user);

      // Load available roles for management
      await loadAvailableRoles();
    } catch (err) {
      console.error('Error loading user permissions:', err);
      setError('Failed to load user permissions');
    } finally {
      setIsLoading(false);
    }
  };

  // Load available roles
  const loadAvailableRoles = async () => {
    try {
      const dbRoles = await PermissionService.getAllRoles();
      
      const roles: Role[] = await Promise.all(
        dbRoles.map(async (dbRole) => {
          const permissions = await PermissionService.getRolePermissions(dbRole.id);
          
          const roleInfo = getRoleDisplayInfo(dbRole.role_name);
          return {
            id: dbRole.id,
            name: dbRole.role_name,
            displayName: dbRole.display_name || roleInfo.displayName,
            description: dbRole.description || roleInfo.description,
            isCustom: dbRole.is_custom,
            permissions: permissions.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              resource: p.resource,
              action: p.action,
              isSystem: p.is_system,
              createdAt: p.created_at,
              updatedAt: p.updated_at
            })),
            createdAt: dbRole.created_at,
            updatedAt: dbRole.updated_at
          };
        })
      );

      setAvailableRoles(roles);
    } catch (err) {
      console.error('Error loading available roles:', err);
    }
  };

  useEffect(() => {
    loadUserPermissions(user);
  }, [user]);

  // Permission checking functions
  const hasPermission = (permission: string): boolean => {
    if (!currentRole) return false;
    return userPermissions.some(p => p.name === permission);
  };

  const hasResourceAccess = (resource: string, action: string): boolean => {
    if (!currentRole) return false;
    return userPermissions.some(p => p.resource === resource && p.action === action);
  };

  // Role management functions
  const createCustomRole = async (roleData: Partial<Role>): Promise<boolean> => {
    try {
      if (currentRole?.name !== SYSTEM_ROLES.SUPER_ADMIN) {
        throw new Error('Only Super Admin can create custom roles');
      }

      const roleId = await PermissionService.createCustomRole({
        role_name: roleData.name || 'custom-role',
        display_name: roleData.displayName || 'Custom Role',
        description: roleData.description || 'Custom role'
      });

      if (!roleId) {
        throw new Error('Failed to create role in database');
      }

      // Refresh roles list
      await loadAvailableRoles();
      return true;
    } catch (err) {
      console.error('Error creating custom role:', err);
      setError(err instanceof Error ? err.message : 'Failed to create custom role');
      return false;
    }
  };

  const updateRolePermissions = async (roleId: string, permissions: Permission[]): Promise<boolean> => {
    try {
      if (currentRole?.name !== SYSTEM_ROLES.SUPER_ADMIN) {
        throw new Error('Only Super Admin can update role permissions');
      }

      const success = await PermissionService.updateRolePermissions(roleId, permissions);
      if (success) {
        await loadAvailableRoles();
      }
      return success;
    } catch (err) {
      console.error('Error updating role permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role permissions');
      return false;
    }
  };

  const assignUserRole = async (userId: string, roleId: string): Promise<boolean> => {
    try {
      if (currentRole?.name !== SYSTEM_ROLES.SUPER_ADMIN) {
        throw new Error('Only Super Admin can assign roles');
      }

      const success = await PermissionService.assignRoleToUser(userId, roleId);
      return success;
    } catch (err) {
      console.error('Error assigning user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign user role');
      return false;
    }
  };

  const refreshPermissions = async (): Promise<void> => {
    if (currentUser) {
      await loadUserPermissions(currentUser);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const contextValue: PermissionContextType = {
    currentUser,
    currentRole,
    userPermissions,
    hasPermission,
    hasResourceAccess,
    availableRoles,
    createCustomRole,
    updateRolePermissions,
    assignUserRole,
    isLoading,
    error,
    refreshPermissions,
    clearError
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};