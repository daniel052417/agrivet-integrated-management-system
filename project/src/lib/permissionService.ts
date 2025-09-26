import { supabase } from './supabase';

export interface DatabasePermission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  component: string;
  category: 'sensitive' | 'upgradeable' | 'standard';
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseRole {
  role_id: string;
  role_name: string;
  display_name: string;
  description: string;
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string;
  is_active: boolean;
  expires_at: string | null;
}

// DatabaseComponentAccess interface removed - using hardcoded role pages instead

export class PermissionService {
  // Get all permissions for a user
  static async getUserPermissions(userId: string): Promise<DatabasePermission[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_permissions', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error fetching user permissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  // Get all accessible components for a user
  // getUserAccessibleComponents removed - using hardcoded role pages instead

  // Check if user has a specific permission
  static async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('user_has_permission', {
        user_uuid: userId,
        permission_name: permissionName
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in userHasPermission:', error);
      return false;
    }
  }

  // Check if user can access a specific component
  static async userCanAccessComponent(userId: string, componentPath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('user_can_access_component', {
        user_uuid: userId,
        component_path: componentPath
      });

      if (error) {
        console.error('Error checking component access:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in userCanAccessComponent:', error);
      return false;
    }
  }

  // Get user's roles
  static async getUserRoles(userId: string): Promise<DatabaseUserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles:role_id (
            role_name,
            display_name,
            is_custom
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  // Get all available roles
  static async getAllRoles(): Promise<DatabaseRole[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllRoles:', error);
      return [];
    }
  }

  // Get all permissions
  static async getAllPermissions(): Promise<DatabasePermission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllPermissions:', error);
      return [];
    }
  }

  // Get all component access definitions
  // getAllComponentAccess removed - using hardcoded role pages instead

  // Assign role to user
  static async assignUserRole(userId: string, roleId: string, assignedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          is_active: true
        });

      if (error) {
        console.error('Error assigning user role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in assignUserRole:', error);
      return false;
    }
  }

  // Remove role from user
  static async removeUserRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) {
        console.error('Error removing user role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeUserRole:', error);
      return false;
    }
  }

  // Create custom role
  static async createCustomRole(roleData: {
    role_name: string;
    display_name: string;
    description: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          ...roleData,
          is_custom: true,
          is_active: true
        })
        .select('role_id')
        .single();

      if (error) {
        console.error('Error creating custom role:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createCustomRole:', error);
      return null;
    }
  }

  // Update role permissions
  static async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<boolean> {
    try {
      // First, remove all existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Then, add the new permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          can_view: true,
          can_edit: true,
          can_delete: true
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (error) {
          console.error('Error updating role permissions:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateRolePermissions:', error);
      return false;
    }
  }

  // Get role permissions
  static async getRolePermissions(roleId: string): Promise<DatabasePermission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permissions:permission_id (
            id,
            name,
            description,
            resource,
            action,
            component,
            category,
            is_system,
            created_at,
            updated_at
          )
        `)
        .eq('role_id', roleId)
        .or('can_view.eq.true,can_edit.eq.true,can_delete.eq.true');

      if (error) {
        console.error('Error fetching role permissions:', error);
        return [];
      }

      return data?.map(item => item.permissions).filter(Boolean) || [];
    } catch (error) {
      console.error('Error in getRolePermissions:', error);
      return [];
    }
  }
}

