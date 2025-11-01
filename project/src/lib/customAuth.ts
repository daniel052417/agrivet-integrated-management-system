import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { posSessionService } from './posSessionService';

// Custom user interface based on your actual users table schema
export interface CustomUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  is_active: boolean;
  account_status: 'pending_activation' | 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  last_login?: string;
  last_activity?: string;
  status: 'online' | 'away' | 'offline';
  current_session_id?: string;
  timezone?: string;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
  role: string;
  user_type: string;
  mfa_enabled: boolean;
  failed_login_attempts: number;
  locked_until?: string;
  verification_token?: string;
  token_expiry?: string;

  // Role information (assuming user_roles and roles tables are joined)
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

// JWT Token interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
}

// Session interface
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
}

// Role definitions (copied from simplifiedAuth for consistency)
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super-admin',
  HR_ADMIN: 'hr-admin',
  HR_STAFF: 'hr-staff',
  MARKETING_ADMIN: 'marketing-admin',
  MARKETING_STAFF: 'marketing-staff',
  CASHIER: 'cashier',
  INVENTORY_CLERK: 'inventory-clerk',
  FINANCE_STAFF: 'finance-staff',
  USER: 'user', // Default role for general users
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// Sidebar configuration for each role (copied from simplifiedAuth for consistency)
export const ROLE_SIDEBAR_CONFIG = {
  [SYSTEM_ROLES.SUPER_ADMIN]: {
    sections: [
      'overview',
      'inventory-management', 'all-products', 'categories', 'low-stock',
      'sales-pos', 'sales-records', 'sales-dashboard', 'daily-sales', 'product-sales',
      'staff-user-management', 'user-accounts', 'add-staff', 'roles-permissions', 'activity-logs', 'session-history', 'user-roles-overview', 'user-permissions',
      'hr', 'hr-dashboard', 'staff', 'attendance-dashboard', 'leave-management', 'hr-analytics', 'payroll',
      'marketing', 'analytics', 'notifications', 'promotions-campaigns', 'campaign-management', 'template-management', 'client-notifications', 'marketing-overview',
      'reports', 'event-center', 'settings',
    ],
  },
  [SYSTEM_ROLES.HR_ADMIN]: {
    sections: [
      'hr-dashboard', 'staff', 'attendance-dashboard', 'leave-management', 'hr-analytics', 'payroll',
      'user-accounts', 'roles-permissions', 'activity-logs', 'session-history', 'user-roles-overview', 'user-permissions', 'add-staff',
      'hr',
    ],
  },
  [SYSTEM_ROLES.HR_STAFF]: {
    sections: [
      'hr-dashboard', 'staff', 'attendance-dashboard', 'leave-management',
    ],
  },
  [SYSTEM_ROLES.MARKETING_ADMIN]: {
    sections: [
      'overview', 'marketing', 'marketing-overview', 'promotions-announcements', 'event-campaigns', 'insights-analytics', 'template-management', 'client-notifications', 'facebook-integration', 'reports'
    ],
  },
  [SYSTEM_ROLES.MARKETING_STAFF]: {
    sections: [
      'overview', 'marketing', 'marketing-overview', 'promotions-announcements', 'event-campaigns', 'insights-analytics', 'template-management', 'client-notifications'
    ],
  },
  [SYSTEM_ROLES.CASHIER]: {
    sections: [
      'sales-pos', 'sales-records', 'daily-sales',
    ],
  },
  [SYSTEM_ROLES.INVENTORY_CLERK]: {
    sections: [
      'inventory-management', 'all-products', 'categories', 'low-stock',
    ],
  },
  [SYSTEM_ROLES.FINANCE_STAFF]: {
    sections: [
      'finance', 'finance-dashboard', 'sales-income', 'expenses', 'cash-flow', 'financial-reports',
    ],
  },
  [SYSTEM_ROLES.USER]: { // Default for basic users
    sections: [
      'overview',
    ],
  },
};

class CustomAuthService {
  private currentUser: CustomUser | null = null;
  private currentSession: UserSession | null = null;
  private readonly SESSION_STORAGE_KEY = 'agrivet_session';
  private readonly TOKEN_STORAGE_KEY = 'agrivet_token';

  public getCurrentUser(): CustomUser | null {
    return this.currentUser;
  }

  public setCurrentUser(user: CustomUser | null): void {
    this.currentUser = user;
  }

  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  // Authenticate user with email and password against the 'users' table
  public async signInWithPassword(email: string, password: string): Promise<CustomUser> {
    try {
      // 1. Fetch user from the 'users' table
      console.log('🔍 Searching for user with email:', email);
      
      // First, try to get the user without roles to see if they exist
      const { data: basicUserData, error: basicUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      console.log('🔍 Basic user query result:', { basicUserData, basicUserError });

      if (basicUserError || !basicUserData) {
        console.log('❌ User not found in basic query:', basicUserError);
        throw new Error('Invalid credentials or user not found.');
      }

      // Now try to get user with roles
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select(`
          *,
          user_roles(
            role_id,
            assigned_at,
            roles(
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
        .single();

      console.log('🔍 Database query result:', { userData, fetchError });

      // Use basic user data if roles query fails, but user exists
      const finalUserData = userData || basicUserData;
      
      if (!finalUserData) {
        console.log('❌ User not found in any query');
        throw new Error('Invalid credentials or user not found.');
      }

      // 2. Check if account is locked
      if (finalUserData.locked_until && new Date(finalUserData.locked_until) > new Date()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts.');
      }

      // 3. Compare provided password with hashed password
      if (!finalUserData.password_hash) {
        console.log('❌ No password hash found for user');
        throw new Error('Account not properly set up. Please contact support.');
      }

      console.log('🔍 Comparing password:', { 
        providedPassword: password, 
        hashedPassword: finalUserData.password_hash?.substring(0, 20) + '...',
        passwordHashLength: finalUserData.password_hash?.length 
      });

      const passwordMatch = await bcrypt.compare(password, finalUserData.password_hash);

      console.log('🔍 Password match result:', passwordMatch);

      if (!passwordMatch) {
        console.log('❌ Password does not match');
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(finalUserData.id);
        throw new Error('Invalid credentials.');
      }

      // 4. Check account status and verification
      if (finalUserData.account_status !== 'active' || !finalUserData.is_active) {
        throw new Error('Account is not active. Please contact support.');
      }

      if (!finalUserData.email_verified) {
        throw new Error('Please verify your email before logging in.');
      }

      // 5. Reset failed login attempts on successful login
      await this.resetFailedLoginAttempts(finalUserData.id);

      // 6. Construct CustomUser object
      const userRole = finalUserData.user_roles?.[0]?.roles; // Handle case where user_roles might be null/undefined
      
      // If no role found, create a default role structure
      if (!userRole) {
        console.log('⚠️ No role found for user, using default role');
        // Create a default role structure
        const defaultRole = {
          id: 'default-role',
          name: finalUserData.role || 'user',
          display_name: 'User',
          description: 'Default user role',
          is_active: true,
          is_system_role: false
        };
        
        // Use the default role
        const sidebarConfig = ROLE_SIDEBAR_CONFIG[defaultRole.name as SystemRole] || ROLE_SIDEBAR_CONFIG.user;

        const customUser: CustomUser = {
          id: finalUserData.id,
          email: finalUserData.email,
          first_name: finalUserData.first_name,
          last_name: finalUserData.last_name,
          phone: finalUserData.phone,
          branch_id: finalUserData.branch_id,
          is_active: finalUserData.is_active,
          account_status: finalUserData.account_status,
          email_verified: finalUserData.email_verified,
          last_login: finalUserData.last_login,
          last_activity: finalUserData.last_activity,
          status: finalUserData.status,
          current_session_id: finalUserData.current_session_id,
          timezone: finalUserData.timezone,
          preferred_language: finalUserData.preferred_language,
          created_at: finalUserData.created_at,
          updated_at: finalUserData.updated_at,
          role: finalUserData.role,
          user_type: finalUserData.user_type,
          mfa_enabled: finalUserData.mfa_enabled,
          failed_login_attempts: finalUserData.failed_login_attempts,
          locked_until: finalUserData.locked_until,
          verification_token: finalUserData.verification_token,
          token_expiry: finalUserData.token_expiry,

          role_id: defaultRole.id,
          role_name: defaultRole.name,
          role_display_name: defaultRole.display_name,
          role_description: defaultRole.description,
          role_is_active: defaultRole.is_active,
          role_is_system_role: defaultRole.is_system_role,
          sidebar_config: sidebarConfig,
        };

        this.setCurrentUser(customUser);

        // 7. Create session and JWT token
        const session = await this.createSession(customUser.id);
        this.currentSession = session;

        // 8. Update last login and activity
        await this.updateLastLogin(customUser.id);

        // 9. Create POS session if user is a cashier
        if (defaultRole.name === 'cashier' && customUser.branch_id) {
          try {
            console.log('🔄 [POS Session] Validating POS session creation for cashier:', customUser.id);
            
            // Validate if cashier can start a new session
            const validation = await posSessionService.canStartNewSession(
              customUser.id, 
              customUser.branch_id
            );

            if (!validation.canStart) {
              console.warn('⚠️ [POS Session] Cannot create new session:', validation.reason);
              
              // If there's an existing session, attach it to the user
              if (validation.existingSession) {
                (customUser as any).current_pos_session = validation.existingSession;
                console.log('✅ [POS Session] Attached existing session to user:', validation.existingSession.id);
              }
            } else {
              // Get available terminal for the branch
              const terminalId = await posSessionService.getAvailableTerminalForBranch(
                customUser.branch_id, 
                customUser.id
              );

              // Create POS session
              const posSession = await posSessionService.createSession({
                cashier_id: customUser.id,
                branch_id: customUser.branch_id,
                terminal_id: terminalId || undefined,
                starting_cash: 0.00,
                notes: `Session started by ${customUser.first_name} ${customUser.last_name}`
              });

              console.log('✅ [POS Session] POS session created successfully:', posSession.id);
              
              // Store POS session info in the user object for easy access
              (customUser as any).current_pos_session = posSession;
            }
          } catch (posError) {
            console.error('⚠️ [POS Session] Failed to create POS session:', posError);
            // Don't fail the login if POS session creation fails
            // Just log the error and continue
          }
        }

        return customUser;
      }

      const sidebarConfig = ROLE_SIDEBAR_CONFIG[userRole.name as SystemRole] || ROLE_SIDEBAR_CONFIG.user;

      const customUser: CustomUser = {
        id: finalUserData.id,
        email: finalUserData.email,
        first_name: finalUserData.first_name,
        last_name: finalUserData.last_name,
        phone: finalUserData.phone,
        branch_id: finalUserData.branch_id,
        is_active: finalUserData.is_active,
        account_status: finalUserData.account_status,
        email_verified: finalUserData.email_verified,
        last_login: finalUserData.last_login,
        last_activity: finalUserData.last_activity,
        status: finalUserData.status,
        current_session_id: finalUserData.current_session_id,
        timezone: finalUserData.timezone,
        preferred_language: finalUserData.preferred_language,
        created_at: finalUserData.created_at,
        updated_at: finalUserData.updated_at,
        role: finalUserData.role,
        user_type: finalUserData.user_type,
        mfa_enabled: finalUserData.mfa_enabled,
        failed_login_attempts: finalUserData.failed_login_attempts,
        locked_until: finalUserData.locked_until,
        verification_token: finalUserData.verification_token,
        token_expiry: finalUserData.token_expiry,

        role_id: userRole.id,
        role_name: userRole.name,
        role_display_name: userRole.display_name || '',
        role_description: userRole.description || '',
        role_is_active: userRole.is_active,
        role_is_system_role: userRole.is_system_role,
        sidebar_config: sidebarConfig,
      };

      this.setCurrentUser(customUser);

      // 7. Create session and JWT token
      const session = await this.createSession(customUser.id);
      this.currentSession = session;

      // 8. Update last login and activity
      await this.updateLastLogin(customUser.id);

      // 9. Create POS session if user is a cashier
      if (userRole.name === 'cashier' && customUser.branch_id) {
        try {
          console.log('🔄 [POS Session] Validating POS session creation for cashier:', customUser.id);
          
          // Validate if cashier can start a new session
          const validation = await posSessionService.canStartNewSession(
            customUser.id, 
            customUser.branch_id
          );

          if (!validation.canStart) {
            console.warn('⚠️ [POS Session] Cannot create new session:', validation.reason);
            
            // If there's an existing session, attach it to the user
            if (validation.existingSession) {
              (customUser as any).current_pos_session = validation.existingSession;
              console.log('✅ [POS Session] Attached existing session to user:', validation.existingSession.id);
            }
          } else {
            // Get available terminal for the branch
            const terminalId = await posSessionService.getAvailableTerminalForBranch(
              customUser.branch_id, 
              customUser.id
            );

            // Create POS session
            const posSession = await posSessionService.createSession({
              cashier_id: customUser.id,
              branch_id: customUser.branch_id,
              terminal_id: terminalId || undefined,
              starting_cash: 0.00,
              notes: `Session started by ${customUser.first_name} ${customUser.last_name}`
            });

            console.log('✅ [POS Session] POS session created successfully:', posSession.id);
            
            // Store POS session info in the user object for easy access
            (customUser as any).current_pos_session = posSession;
          }
        } catch (posError) {
          console.error('⚠️ [POS Session] Failed to create POS session:', posError);
          // Don't fail the login if POS session creation fails
          // Just log the error and continue
        }
      }

      return customUser;

    } catch (error) {
      console.error('Custom Sign in error:', error);
      throw error;
    }
  }

  // Create a new session for the user
  private async createSession(userId: string): Promise<UserSession> {
    try {
      const sessionId = crypto.randomUUID();
      const token = this.generateJWT(userId, sessionId);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store session in database (you might want to create a sessions table)
      const { error } = await supabase
        .from('users')
        .update({
          current_session_id: sessionId,
          last_activity: new Date().toISOString(),
          status: 'online'
        })
        .eq('id', userId);

      if (error) {
        throw new Error('Failed to create session');
      }

      const session: UserSession = {
        id: sessionId,
        userId: userId,
        token: token,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        isActive: true
      };

      // Store session in localStorage
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(this.TOKEN_STORAGE_KEY, token);

      return session;
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  // Generate JWT token
  private generateJWT(userId: string, sessionId: string): string {
    const payload: JWTPayload = {
      userId: userId,
      email: this.currentUser?.email || '',
      role: this.currentUser?.role || 'user',
      sessionId: sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // In a real application, you would use a proper JWT library like 'jsonwebtoken'
    // For now, we'll create a simple base64 encoded token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = btoa(`${header}.${payloadEncoded}.secret`); // In production, use a proper secret

    return `${header}.${payloadEncoded}.${signature}`;
  }

  // Verify JWT token
  private verifyJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token is expired
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }

  // Check if user is authenticated by validating stored session
  public async checkAuthStatus(): Promise<CustomUser | null> {
    try {
      const storedSession = localStorage.getItem(this.SESSION_STORAGE_KEY);
      const storedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);

      if (!storedSession || !storedToken) {
        return null;
      }

      const session: UserSession = JSON.parse(storedSession);
      const payload = this.verifyJWT(storedToken);

      if (!payload || payload.userId !== session.userId) {
        this.clearSession();
        return null;
      }

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession();
        return null;
      }

      // Fetch fresh user data
      const user = await this.getUserById(payload.userId);
      if (!user) {
        this.clearSession();
        return null;
      }

      this.setCurrentUser(user);
      this.currentSession = session;

      return user;
    } catch (error) {
      console.error('Check auth status error:', error);
      this.clearSession();
      return null;
    }
  }

  // Get user by ID
  public async getUserById(userId: string): Promise<CustomUser | null> {
    try {
      // First try to get user with roles
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles(
            role_id,
            assigned_at,
            roles(
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

      if (error || !data) {
        return null;
      }

      const userRole = data.user_roles?.[0]?.roles;
      
      // If no role found, create a default role structure
      if (!userRole) {
        console.log('⚠️ No role found for user in getUserById, using default role');
        const defaultRole = {
          id: 'default-role',
          name: data.role || 'user',
          display_name: 'User',
          description: 'Default user role',
          is_active: true,
          is_system_role: false
        };
        
        const sidebarConfig = ROLE_SIDEBAR_CONFIG[defaultRole.name as SystemRole] || ROLE_SIDEBAR_CONFIG.user;

        return {
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          branch_id: data.branch_id,
          is_active: data.is_active,
          account_status: data.account_status,
          email_verified: data.email_verified,
          last_login: data.last_login,
          last_activity: data.last_activity,
          status: data.status,
          current_session_id: data.current_session_id,
          timezone: data.timezone,
          preferred_language: data.preferred_language,
          created_at: data.created_at,
          updated_at: data.updated_at,
          role: data.role,
          user_type: data.user_type,
          mfa_enabled: data.mfa_enabled,
          failed_login_attempts: data.failed_login_attempts,
          locked_until: data.locked_until,
          verification_token: data.verification_token,
          token_expiry: data.token_expiry,

          role_id: defaultRole.id,
          role_name: defaultRole.name,
          role_display_name: defaultRole.display_name,
          role_description: defaultRole.description,
          role_is_active: defaultRole.is_active,
          role_is_system_role: defaultRole.is_system_role,
          sidebar_config: sidebarConfig,
        };
      }

      const sidebarConfig = ROLE_SIDEBAR_CONFIG[userRole.name as SystemRole] || ROLE_SIDEBAR_CONFIG.user;

      return {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        branch_id: data.branch_id,
        is_active: data.is_active,
        account_status: data.account_status,
        email_verified: data.email_verified,
        last_login: data.last_login,
        last_activity: data.last_activity,
        status: data.status,
        current_session_id: data.current_session_id,
        timezone: data.timezone,
        preferred_language: data.preferred_language,
        created_at: data.created_at,
        updated_at: data.updated_at,
        role: data.role,
        user_type: data.user_type,
        mfa_enabled: data.mfa_enabled,
        failed_login_attempts: data.failed_login_attempts,
        locked_until: data.locked_until,
        verification_token: data.verification_token,
        token_expiry: data.token_expiry,

        role_id: userRole.id,
        role_name: userRole.name,
        role_display_name: userRole.display_name || '',
        role_description: userRole.description || '',
        role_is_active: userRole.is_active,
        role_is_system_role: userRole.is_system_role,
        sidebar_config: sidebarConfig,
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  // Logout user
  public async signOut(): Promise<void> {
    try {
      // Update user status to offline before signing out
      if (this.currentUser) {
        await supabase
          .from('users')
          .update({ 
            status: 'offline',
            last_activity: new Date().toISOString(),
            current_session_id: null
          })
          .eq('id', this.currentUser.id);
      }

      this.clearSession();
      this.setCurrentUser(null);
      this.currentSession = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Clear session data
  private clearSession(): void {
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  // Update last login timestamp in the users table
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(), 
          last_activity: new Date().toISOString(),
          status: 'online'
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating last login:', error);
      }
    } catch (error) {
      console.error('Error in updateLastLogin:', error);
    }
  }

  // Increment failed login attempts
  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('failed_login_attempts')
        .eq('id', userId)
        .single();

      const currentAttempts = userData?.failed_login_attempts || 0;
      const newAttempts = currentAttempts + 1;
      
      // Lock account after 5 failed attempts for 30 minutes
      const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null;

      await supabase
        .from('users')
        .update({ 
          failed_login_attempts: newAttempts,
          locked_until: lockedUntil
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error incrementing failed login attempts:', error);
    }
  }

  // Reset failed login attempts
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ 
          failed_login_attempts: 0,
          locked_until: null
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error resetting failed login attempts:', error);
    }
  }

  // Hash password (for internal use, e.g., during user creation/activation)
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password (for internal use, e.g., during login)
  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Get user's role
  public getUserRole(): string | null {
    return this.currentUser?.role_name || this.currentUser?.role || null;
  }

  // Check if user has specific role
  public hasRole(role: SystemRole): boolean {
    return this.currentUser?.role_name === role || this.currentUser?.role === role;
  }

  // Check if user is admin (super-admin or hr-admin)
  public isAdmin(): boolean {
    return this.currentUser?.role_name === SYSTEM_ROLES.SUPER_ADMIN || 
           this.currentUser?.role_name === SYSTEM_ROLES.HR_ADMIN ||
           this.currentUser?.role === SYSTEM_ROLES.SUPER_ADMIN ||
           this.currentUser?.role === SYSTEM_ROLES.HR_ADMIN;
  }

  // Check if user has access to a section
  public hasSectionAccess(section: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    // Super admin has access to everything
    if (this.currentUser.role_name === SYSTEM_ROLES.SUPER_ADMIN || this.currentUser.role === SYSTEM_ROLES.SUPER_ADMIN) {
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
}

export const customAuth = new CustomAuthService();
export default customAuth;
