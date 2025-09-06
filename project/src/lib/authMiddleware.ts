import { supabase } from './supabase';
import { UserProfile } from './supabase';

// ============================================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ============================================================================

export interface AuthContext {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: string;
  permissions: string[];
}

export class AuthMiddleware {
  private static instance: AuthMiddleware;
  private authContext: AuthContext | null = null;

  private constructor() {}

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  public async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // Fetch user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // ============================================================================
  // AUTHORIZATION METHODS
  // ============================================================================

  public async getUserRole(): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user) return 'guest';

    // Check marketing-specific roles first
    const { data: marketingRole } = await supabase
      .from('marketing_user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (marketingRole) {
      return marketingRole.role;
    }

    // Fall back to general user role
    return user.role || 'user';
  }

  public async getUserPermissions(): Promise<string[]> {
    const role = await this.getUserRole();
    return this.getPermissionsForRole(role);
  }

  private getPermissionsForRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'admin': [
        'campaign:create',
        'campaign:read',
        'campaign:update',
        'campaign:delete',
        'campaign:publish',
        'campaign:unpublish',
        'template:create',
        'template:read',
        'template:update',
        'template:delete',
        'analytics:read',
        'analytics:export',
        'notification:create',
        'notification:read',
        'notification:update',
        'notification:delete',
        'notification:send',
        'user:manage',
        'settings:manage',
        'audit:read'
      ],
      'marketing_manager': [
        'campaign:create',
        'campaign:read',
        'campaign:update',
        'campaign:delete',
        'campaign:publish',
        'campaign:unpublish',
        'template:create',
        'template:read',
        'template:update',
        'template:delete',
        'analytics:read',
        'analytics:export',
        'notification:create',
        'notification:read',
        'notification:update',
        'notification:delete',
        'notification:send'
      ],
      'viewer': [
        'campaign:read',
        'template:read',
        'analytics:read'
      ],
      'user': [],
      'guest': []
    };

    return rolePermissions[role] || [];
  }

  // ============================================================================
  // PERMISSION CHECKING METHODS
  // ============================================================================

  public async hasPermission(permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.includes(permission);
  }

  public async canManageCampaigns(): Promise<boolean> {
    return await this.hasPermission('campaign:create') || 
           await this.hasPermission('campaign:update') || 
           await this.hasPermission('campaign:delete');
  }

  public async canPublishCampaigns(): Promise<boolean> {
    return await this.hasPermission('campaign:publish');
  }

  public async canManageTemplates(): Promise<boolean> {
    return await this.hasPermission('template:create') || 
           await this.hasPermission('template:update') || 
           await this.hasPermission('template:delete');
  }

  public async canViewAnalytics(): Promise<boolean> {
    return await this.hasPermission('analytics:read');
  }

  public async canManageNotifications(): Promise<boolean> {
    return await this.hasPermission('notification:create') || 
           await this.hasPermission('notification:update') || 
           await this.hasPermission('notification:delete');
  }

  public async canSendNotifications(): Promise<boolean> {
    return await this.hasPermission('notification:send');
  }

  public async canManageUsers(): Promise<boolean> {
    return await this.hasPermission('user:manage');
  }

  public async canManageSettings(): Promise<boolean> {
    return await this.hasPermission('settings:manage');
  }

  // ============================================================================
  // AUTH CONTEXT MANAGEMENT
  // ============================================================================

  public async getAuthContext(): Promise<AuthContext> {
    const user = await this.getCurrentUser();
    const role = await this.getUserRole();
    const permissions = await this.getUserPermissions();

    this.authContext = {
      user,
      isAuthenticated: user !== null,
      role,
      permissions
    };

    return this.authContext;
  }

  public getCachedAuthContext(): AuthContext | null {
    return this.authContext;
  }

  public clearAuthContext(): void {
    this.authContext = null;
  }

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL HELPERS
  // ============================================================================

  public async requireAuth(): Promise<UserProfile> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }

  public async requirePermission(permission: string): Promise<void> {
    const hasPermission = await this.hasPermission(permission);
    if (!hasPermission) {
      throw new Error(`Permission '${permission}' required`);
    }
  }

  public async requireRole(requiredRoles: string[]): Promise<void> {
    const userRole = await this.getUserRole();
    if (!requiredRoles.includes(userRole)) {
      throw new Error(`One of these roles required: ${requiredRoles.join(', ')}`);
    }
  }

  // ============================================================================
  // CAMPAIGN-SPECIFIC PERMISSIONS
  // ============================================================================

  public async canEditCampaign(campaignId: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Check if user can manage campaigns
    if (!(await this.canManageCampaigns())) {
      return false;
    }

    // Check if user is admin or created the campaign
    if (await this.hasPermission('campaign:update')) {
      const { data: campaign } = await supabase
        .from('marketing_campaigns')
        .select('created_by')
        .eq('id', campaignId)
        .single();

      if (!campaign) return false;

      // Admin can edit any campaign, others can only edit their own
      const isAdmin = await this.hasPermission('user:manage');
      return isAdmin || campaign.created_by === user.id;
    }

    return false;
  }

  public async canDeleteCampaign(campaignId: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Check if user can manage campaigns
    if (!(await this.canManageCampaigns())) {
      return false;
    }

    // Check if user is admin or created the campaign
    if (await this.hasPermission('campaign:delete')) {
      const { data: campaign } = await supabase
        .from('marketing_campaigns')
        .select('created_by')
        .eq('id', campaignId)
        .single();

      if (!campaign) return false;

      // Admin can delete any campaign, others can only delete their own
      const isAdmin = await this.hasPermission('user:manage');
      return isAdmin || campaign.created_by === user.id;
    }

    return false;
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  public async refreshAuthContext(): Promise<AuthContext> {
    this.clearAuthContext();
    return await this.getAuthContext();
  }

  public async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.clearAuthContext();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  public isAdmin(): boolean {
    return this.authContext?.role === 'admin';
  }

  public isMarketingManager(): boolean {
    return this.authContext?.role === 'marketing_manager';
  }

  public isViewer(): boolean {
    return this.authContext?.role === 'viewer';
  }

  public hasAnyRole(roles: string[]): boolean {
    return this.authContext ? roles.includes(this.authContext.role) : false;
  }

  public hasAnyPermission(permissions: string[]): boolean {
    if (!this.authContext) return false;
    return permissions.some(permission => this.authContext!.permissions.includes(permission));
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const authMiddleware = AuthMiddleware.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const getCurrentUser = () => authMiddleware.getCurrentUser();
export const isAuthenticated = () => authMiddleware.isAuthenticated();
export const getUserRole = () => authMiddleware.getUserRole();
export const getUserPermissions = () => authMiddleware.getUserPermissions();
export const hasPermission = (permission: string) => authMiddleware.hasPermission(permission);
export const canManageCampaigns = () => authMiddleware.canManageCampaigns();
export const canPublishCampaigns = () => authMiddleware.canPublishCampaigns();
export const canManageTemplates = () => authMiddleware.canManageTemplates();
export const canViewAnalytics = () => authMiddleware.canViewAnalytics();
export const canManageNotifications = () => authMiddleware.canManageNotifications();
export const canSendNotifications = () => authMiddleware.canSendNotifications();
export const canManageUsers = () => authMiddleware.canManageUsers();
export const canManageSettings = () => authMiddleware.canManageSettings();
export const getAuthContext = () => authMiddleware.getAuthContext();
export const requireAuth = () => authMiddleware.requireAuth();
export const requirePermission = (permission: string) => authMiddleware.requirePermission(permission);
export const requireRole = (roles: string[]) => authMiddleware.requireRole(roles);
export const canEditCampaign = (campaignId: string) => authMiddleware.canEditCampaign(campaignId);
export const canDeleteCampaign = (campaignId: string) => authMiddleware.canDeleteCampaign(campaignId);
export const refreshAuthContext = () => authMiddleware.refreshAuthContext();
export const logout = () => authMiddleware.logout();
