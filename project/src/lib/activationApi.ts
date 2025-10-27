/**
 * Account Activation API
 * 
 * Handles account activation flow including token validation,
 * password setting, and account activation.
 */

import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface ActivationTokenData {
  token: string;
  email: string;
  name: string;
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: string;
}

export interface ActivateAccountData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  user?: any;
  error?: string;
}

export const activationApi = {
  /**
   * Validate activation token
   */
  async validateToken(token: string): Promise<ActivationTokenData> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, verification_token, token_expiry, account_status')
        .eq('verification_token', token)
        .single();

      if (error || !data) {
        return {
          token,
          email: '',
          name: '',
          isValid: false,
          isExpired: false
        };
      }

      const now = new Date();
      const expiryDate = data.token_expiry ? new Date(data.token_expiry) : null;
      const isExpired = expiryDate ? now > expiryDate : true;
      const isValid = !isExpired && data.account_status === 'pending_activation';

      return {
        token,
        email: data.email,
        name: `${data.first_name} ${data.last_name}`.trim(),
        isValid,
        isExpired,
        expiresAt: data.token_expiry
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return {
        token,
        email: '',
        name: '',
        isValid: false,
        isExpired: false
      };
    }
  },

  /**
   * Activate account with password
   */
  async activateAccount(data: ActivateAccountData): Promise<ActivationResult> {
    try {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match'
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      // First, validate the token
      const tokenData = await this.validateToken(data.token);
      if (!tokenData.isValid) {
        return {
          success: false,
          message: tokenData.isExpired 
            ? 'Activation link has expired. Please contact HR to request a new activation link.'
            : 'Invalid activation link. Please contact HR for assistance.'
        };
      }

      // Hash the password using bcrypt
      const passwordHash = await this.hashPassword(data.password);

      // Update user account
      const { data: userData, error: updateError } = await supabase
        .from('users')
        .update({
          account_status: 'active',
          email_verified: true,
          password_hash: passwordHash,
          verification_token: null,
          token_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('verification_token', data.token)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log activation in audit_logs
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userData.id,
          action: 'account_activated',
          target_user_id: userData.id,
          target_user_email: userData.email,
          details: `Account activated successfully for ${userData.first_name} ${userData.last_name}`,
          entity_type: 'user',
          entity_id: userData.id,
          module: 'authentication'
        });

      return {
        success: true,
        message: 'Account activated successfully! You can now log in.',
        user: userData
      };

    } catch (error) {
      console.error('Error activating account:', error);
      return {
        success: false,
        message: 'Failed to activate account. Please try again or contact support.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Resend activation email
   */
  async resendActivationEmail(token: string): Promise<ActivationResult> {
    try {
      // Get user data
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, verification_token, token_expiry, account_status')
        .eq('verification_token', token)
        .single();

      if (error || !userData) {
        return {
          success: false,
          message: 'Invalid activation token'
        };
      }

      if (userData.account_status !== 'pending_activation') {
        return {
          success: false,
          message: 'Account is not in pending activation status'
        };
      }

      // Generate new token and expiry
      const newToken = crypto.randomUUID();
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + 24);

      // Update user with new token
      const { error: updateError } = await supabase
        .from('users')
        .update({
          verification_token: newToken,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) {
        throw updateError;
      }

      // Log resend action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userData.id,
          action: 'activation_email_resent',
          target_user_id: userData.id,
          target_user_email: userData.email,
          details: `Activation email resent for ${userData.first_name} ${userData.last_name}`,
          entity_type: 'user',
          entity_id: userData.id,
          module: 'authentication'
        });

      return {
        success: true,
        message: 'Activation email has been resent successfully'
      };

    } catch (error) {
      console.error('Error resending activation email:', error);
      return {
        success: false,
        message: 'Failed to resend activation email. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long'
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter'
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter'
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number'
      };
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character (@$!%*?&)'
      };
    }

    return {
      isValid: true,
      message: 'Password is valid'
    };
  },

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },

  /**
   * Clean up expired tokens (utility function)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('users')
        .update({
          verification_token: null,
          token_expiry: null,
          account_status: 'inactive',
          updated_at: now
        })
        .lt('token_expiry', now)
        .eq('account_status', 'pending_activation')
        .select('id');

      if (error) {
        console.error('Error cleaning up expired tokens:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }
};
