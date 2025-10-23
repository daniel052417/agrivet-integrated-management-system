import { supabase } from './supabase';

// Simplified user interface based on your actual schema
export interface SimplifiedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  is_active: boolean;
  last_login?: string;
  last_activity?: string;
  status: 'online' | 'away' | 'offline';
  current_session_id?: string;
  timezone?: string;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
  // Role information
  role_id: string;
  role_name: string;
  role_display_name?: string;
  role_description?: string;
  role_is_active: boolean;
  role_is_system_role: boolean;
  sidebar_config: {
    sections: string[];
  };
}

// Role definitions
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super-admin',
  HR_ADMIN: 'hr-admin',
  HR_STAFF: 'hr-staff',
  MARKETING_ADMIN: 'marketing-admin',
  MARKETING_STAFF: 'marketing-staff',
  CASHIER: 'cashier',
  INVENTORY_CLERK: 'inventory-clerk',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// Sidebar configuration for each role
export const ROLE_SIDEBAR_CONFIG = {
  [SYSTEM_ROLES.SUPER_ADMIN]: {
    sections: [
      'overview',
      'inventory-management', 'all-products', 'categories', 'low-stock',
      'sales-pos', 'sales-records', 'sales-monitoring', 'daily-sales', 'product-sales',
      'staff-user-management', 'user-accounts', 'session-history', 'user-roles-overview', 'roles-permissions', 'activity-logs',
      'hr', 'hr-dashboard', 'staff', 'attendance-dashboard', 'leave-management', 'hr-analytics', 'payroll',
      'marketing', 'marketing-overview', 'promotions-announcements', 'insights-analytics', 'client-notifications', 'facebook-integration',
      'reports', 'exports', 'claims', 'settings'
    ]
  },
  [SYSTEM_ROLES.HR_ADMIN]: {
    sections: [
      'overview', 'hr', 'hr-dashboard', 'staff', 'attendance-dashboard', 'leave-management', 'hr-analytics', 'payroll',
      'staff-user-management', 'user-accounts', 'roles-permissions', 'activity-logs'
    ]
  },
  [SYSTEM_ROLES.HR_STAFF]: {
    sections: [
      'overview', 'hr', 'hr-dashboard', 'staff', 'attendance-dashboard', 'leave-management', 'hr-analytics'
    ]
  },
  [SYSTEM_ROLES.MARKETING_ADMIN]: {
    sections: [
      'overview', 'marketing', 'marketing-overview', 'promotions-announcements', 'event-campaigns', 'insights-analytics', 'template-management', 'client-notifications', 'facebook-integration', 'reports'
    ]
  },
  [SYSTEM_ROLES.MARKETING_STAFF]: {
    sections: [
      'overview', 'marketing', 'marketing-overview', 'promotions-announcements', 'event-campaigns', 'insights-analytics', 'template-management', 'client-notifications'
    ]
  },
  [SYSTEM_ROLES.CASHIER]: {
    sections: [
      'overview', 'sales-pos', 'sales-records', 'sales-dashboard', 'daily-sales', 'product-sales'
    ]
  },
  [SYSTEM_ROLES.INVENTORY_CLERK]: {
    sections: [
      'overview', 'inventory-management', 'all-products', 'categories', 'low-stock'
    ]
  },
};

class SimplifiedAuthService {
  private static instance: SimplifiedAuthService;
  private currentUser: SimplifiedUser | null = null;

  public static getInstance(): SimplifiedAuthService {
    if (!SimplifiedAuthService.instance) {
      SimplifiedAuthService.instance = new SimplifiedAuthService();
    }
    return SimplifiedAuthService.instance;
  }

  // Get current user
  public getCurrentUser(): SimplifiedUser | null {
    return this.currentUser;
  }

  // Set current user
  public setCurrentUser(user: SimplifiedUser | null): void {
    this.currentUser = user;
  }

  // Authenticate user with email and password
  public async signInWithPassword(email: string, password: string): Promise<SimplifiedUser> {
    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication');
      }

      // Get user with role information
      const user = await this.getUserWithRole(email);
      this.setCurrentUser(user);
      
      // Update last login
      await this.updateLastLogin(user.id);
      
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Get user with role information
  public async getUserWithRole(email: string): Promise<SimplifiedUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles!inner(
            role_id,
            assigned_at,
            roles!inner(
              id,
              name,
              display_name,
              description,
              is_active,
              is_system_role
            )
          )
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('User not found');
      }

      // Get the primary role (first one)
      const userRole = data.user_roles[0];
      if (!userRole) {
        throw new Error('User has no assigned role');
      }

      const role = userRole.roles;

      return {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        branch_id: data.branch_id,
        is_active: data.is_active,
        last_login: data.last_login,
        last_activity: data.last_activity,
        status: data.status,
        current_session_id: data.current_session_id,
        timezone: data.timezone,
        preferred_language: data.preferred_language,
        created_at: data.created_at,
        updated_at: data.updated_at,
        role_id: role.id,
        role_name: role.name,
        role_display_name: role.display_name,
        role_description: role.description,
        role_is_active: role.is_active,
        role_is_system_role: role.is_system_role,
        sidebar_config: this.getSidebarConfigForRole(role.name)
      };
    } catch (error) {
      console.error('Get user with role error:', error);
      throw error;
    }
  }

  // Get user by ID
  public async getUserById(userId: string): Promise<SimplifiedUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles!inner(
            role_id,
            assigned_at,
            roles!inner(
              id,
              name,
              display_name,
              description,
              is_active,
              is_system_role
            )
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('User not found');
      }

      // Get the primary role (first one)
      const userRole = data.user_roles[0];
      if (!userRole) {
        throw new Error('User has no assigned role');
      }

      const role = userRole.roles;

      return {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        branch_id: data.branch_id,
        is_active: data.is_active,
        last_login: data.last_login,
        last_activity: data.last_activity,
        status: data.status,
        current_session_id: data.current_session_id,
        timezone: data.timezone,
        preferred_language: data.preferred_language,
        created_at: data.created_at,
        updated_at: data.updated_at,
        role_id: role.id,
        role_name: role.name,
        role_display_name: role.display_name,
        role_description: role.description,
        role_is_active: role.is_active,
        role_is_system_role: role.is_system_role,
        sidebar_config: this.getSidebarConfigForRole(role.name)
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  // Check if user has access to a section
  public hasSectionAccess(section: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    // Super admin has access to everything
    if (this.currentUser.role_name === SYSTEM_ROLES.SUPER_ADMIN) {
      return true;
    }

    // Check if section is in user's sidebar config
    return this.currentUser.sidebar_config.sections.includes(section);
  }

  // Get user's accessible sections
  public getAccessibleSections(): string[] {
    if (!this.currentUser) {
      return [];
    }

    return this.currentUser.sidebar_config.sections;
  }

  // Get sidebar configuration for a role
  private getSidebarConfigForRole(roleName: string): { sections: string[] } {
    return ROLE_SIDEBAR_CONFIG[roleName as keyof typeof ROLE_SIDEBAR_CONFIG] || { sections: [] };
  }

  // Update last login timestamp
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          status: 'online'
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Update last login error:', error);
      // Don't throw error for last login update failure
    }
  }

  // Sign out
  public async signOut(): Promise<void> {
    try {
      // Update user status to offline before signing out
      if (this.currentUser) {
        await supabase
          .from('users')
          .update({ 
            status: 'offline',
            last_activity: new Date().toISOString()
          })
          .eq('id', this.currentUser.id);
      }

      await supabase.auth.signOut();
      this.setCurrentUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Get user's role
  public getUserRole(): string | null {
    return this.currentUser?.role_name || null;
  }

  // Check if user has specific role
  public hasRole(role: SystemRole): boolean {
    return this.currentUser?.role_name === role;
  }

  // Check if user is admin (super-admin or hr-admin)
  public isAdmin(): boolean {
    return this.currentUser?.role_name === SYSTEM_ROLES.SUPER_ADMIN || 
           this.currentUser?.role_name === SYSTEM_ROLES.HR_ADMIN;
  }
}

// Export singleton instance
export const simplifiedAuth = SimplifiedAuthService.getInstance();
export default simplifiedAuth;
