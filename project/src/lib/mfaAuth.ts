import { mfaService } from './mfaService';
import { customAuth, CustomUser } from './customAuth';
import { posSessionService } from './posSessionService';
import { getManilaTimestamp } from './utils/manilaTimestamp';

/**
 * MFA Authentication Service
 * Handles MFA verification and completion of login process
 */

export interface MFAVerificationData {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
}

class MFAAuthService {
  /**
   * Verify OTP and complete login
   */
  async verifyOTPAndCompleteLogin(
    mfaData: MFAVerificationData,
    otpCode: string
  ): Promise<CustomUser> {
    try {
      // Generate device fingerprint
      const deviceFingerprint = mfaService.generateDeviceFingerprint();

      // Verify OTP
      const verificationResult = await mfaService.verifyOTP(
        mfaData.userId,
        otpCode,
        deviceFingerprint
      );

      if (!verificationResult.success || !verificationResult.verified) {
        throw new Error(verificationResult.error || 'Invalid OTP code');
      }

      // OTP verified - now complete the login process
      // We need to fetch user data again and create session
      const { supabase } = await import('./supabase');
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
        .eq('id', mfaData.userId)
        .single();

      if (fetchError || !userData) {
        throw new Error('Failed to fetch user data after MFA verification');
      }

      // Construct CustomUser (similar to signInWithPassword)
      const userRole = userData.user_roles?.[0]?.roles;
      
      // Use the existing signInWithPassword logic but skip password check
      // Since we already verified password, we can directly create the user object
      const { ROLE_SIDEBAR_CONFIG } = await import('./simplifiedAuth');
      const sidebarConfig = ROLE_SIDEBAR_CONFIG[userRole?.name as any] || ROLE_SIDEBAR_CONFIG.user;

      const customUser: CustomUser = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        branch_id: userData.branch_id,
        is_active: userData.is_active,
        account_status: userData.account_status,
        email_verified: userData.email_verified,
        last_login: userData.last_login,
        last_activity: userData.last_activity,
        status: userData.status,
        current_session_id: userData.current_session_id,
        timezone: userData.timezone,
        preferred_language: userData.preferred_language,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        role: userData.role,
        user_type: userData.user_type,
        mfa_enabled: userData.mfa_enabled,
        failed_login_attempts: userData.failed_login_attempts,
        locked_until: userData.locked_until,
        verification_token: userData.verification_token,
        token_expiry: userData.token_expiry,
        role_id: userRole?.id || 'default',
        role_name: userRole?.name || userData.role,
        role_display_name: userRole?.display_name || '',
        role_description: userRole?.description || '',
        role_is_active: userRole?.is_active || true,
        role_is_system_role: userRole?.is_system_role || false,
        sidebar_config: sidebarConfig,
      };

      // Set current user
      customAuth.setCurrentUser(customUser);

      // Create session with MFA used
      const session = await customAuth.createSession(
        customUser.id,
        'mfa',
        true
      );
      
      // Update last login
      const { supabase: supabaseClient } = await import('./supabase');
      await supabaseClient
        .from('users')
        .update({ 
          last_login: getManilaTimestamp(),
          last_activity: getManilaTimestamp()
        })
        .eq('id', customUser.id);

      // Create POS session if cashier
      if (userRole?.name === 'cashier' && customUser.branch_id) {
        try {
          const validation = await posSessionService.canStartNewSession(
            customUser.id,
            customUser.branch_id
          );

          if (!validation.canStart && validation.existingSession) {
            (customUser as any).current_pos_session = validation.existingSession;
          } else if (validation.canStart) {
            const terminalId = await posSessionService.getAvailableTerminalForBranch(
              customUser.branch_id,
              customUser.id
            );

            const posSession = await posSessionService.createSession({
              cashier_id: customUser.id,
              branch_id: customUser.branch_id,
              terminal_id: terminalId || undefined,
              starting_cash: 0.00,
              notes: `Session started by ${customUser.first_name} ${customUser.last_name}`
            });

            (customUser as any).current_pos_session = posSession;
          }
        } catch (posError) {
          console.error('⚠️ Failed to create POS session:', posError);
        }
      }

      return customUser;
    } catch (error: any) {
      console.error('Error completing MFA login:', error);
      throw error;
    }
  }
}

export const mfaAuth = new MFAAuthService();

