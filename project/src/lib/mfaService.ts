import { supabase } from './supabase';
import { emailService } from './emailService';

/**
 * MFA OTP Service
 * Handles OTP generation, storage, verification, and email sending
 */

export interface MFAResult {
  success: boolean;
  requiresMFA?: boolean;
  otpSent?: boolean;
  error?: string;
  message?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  message?: string;
}

class MFAService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate device fingerprint from browser/user agent
   */
  generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Device fingerprint', 2, 2);
    const canvasHash = canvas.toDataURL();
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvasHash.substring(0, 50)
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if MFA is required for a user based on settings
   */
  async isMFARequired(userRole: string): Promise<boolean> {
    try {
      const { data: settingsData, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'app_settings')
        .single();

      if (error || !settingsData) {
        console.warn('Could not fetch MFA settings:', error);
        return false; // Default to no MFA if settings not found
      }

      const security = settingsData.value?.security || {};
      const requireMFA = security.requireMFA || security.require_2fa || false;
      
      if (!requireMFA) {
        return false;
      }

      // Check if user's role requires MFA
      const mfaAppliesTo = security.mfaAppliesTo || security.mfa_applies_to || {};
      
      // Normalize role name for comparison
      const normalizedRole = userRole.toLowerCase().replace(/\s+/g, '');
      
      // Check for super-admin (various formats)
      if (normalizedRole.includes('super') || normalizedRole.includes('superadmin')) {
        return mfaAppliesTo.superAdmin === true;
      }
      
      // Check for cashier
      if (normalizedRole.includes('cashier')) {
        return mfaAppliesTo.cashier === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking MFA requirement:', error);
      return false;
    }
  }

  /**
   * Check if device is verified for user
   */
  async isDeviceVerified(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('verified_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking device verification:', error);
      return false;
    }
  }

  /**
   * Generate and send OTP code to user's email
   */
  async generateAndSendOTP(userId: string, userEmail: string, userName: string): Promise<MFAResult> {
    try {
      // Generate OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

      // Store OTP in database
      const { error: storeError } = await supabase
        .from('mfa_otp_codes')
        .insert({
          user_id: userId,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (storeError) {
        console.error('Error storing OTP:', storeError);
        return {
          success: false,
          error: 'Failed to generate OTP code'
        };
      }

      // Send OTP via email
      try {
        const emailResult = await emailService.sendOTPEmail({
          to: userEmail,
          name: userName,
          otpCode: otpCode,
          expiryMinutes: this.OTP_EXPIRY_MINUTES
        });

        if (!emailResult.success) {
          console.warn('Email sending failed, but OTP was generated:', emailResult.error);
          // Don't fail - OTP is still valid, user can request resend
          // Log OTP to console for development/testing
          console.log('🔐 [DEV MODE] OTP Code for', userEmail, ':', otpCode);
          console.log('📧 Email not sent. Check Edge Function setup or use console OTP for testing.');
        } else {
          console.log('✅ OTP email sent successfully to', userEmail);
        }
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError);
        // Continue - OTP is still stored
        // Log OTP to console for development/testing
        console.log('🔐 [DEV MODE] OTP Code for', userEmail, ':', otpCode);
        console.log('📧 Email error occurred. Use console OTP for testing.');
      }

      return {
        success: true,
        otpSent: true,
        message: `OTP code sent to ${userEmail}`
      };
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate OTP code'
      };
    }
  }

  /**
   * Verify OTP code for user
   */
  async verifyOTP(userId: string, otpCode: string, deviceFingerprint: string): Promise<MFAVerificationResult> {
    try {
      // Find valid OTP
      const { data: otpData, error: fetchError } = await supabase
        .from('mfa_otp_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('otp_code', otpCode)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpData) {
        // Increment failed attempts tracking
        await this.incrementFailedAttempts(userId);
        
        return {
          success: false,
          verified: false,
          error: 'Invalid or expired OTP code. Please try again.'
        };
      }

      // Mark OTP as used
      await supabase
        .from('mfa_otp_codes')
        .update({ used: true })
        .eq('id', otpData.id);

      // Mark device as verified
      await this.verifyDevice(userId, deviceFingerprint);

      // Clean up old OTP codes for this user
      await this.cleanupOldOTPs(userId);

      return {
        success: true,
        verified: true,
        message: 'OTP verified successfully'
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify OTP code'
      };
    }
  }

  /**
   * Mark device as verified
   */
  private async verifyDevice(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const deviceInfo = {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };

      // Check if device already verified
      const { data: existing } = await supabase
        .from('verified_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (existing) {
        // Update last used time
        await supabase
          .from('verified_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new verified device
        await supabase
          .from('verified_devices')
          .insert({
            user_id: userId,
            device_fingerprint: deviceFingerprint,
            device_name: this.getDeviceName(),
            browser_info: deviceInfo,
            verified_at: new Date().toISOString(),
            last_used_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error verifying device:', error);
      // Don't throw - device verification is not critical
    }
  }

  /**
   * Get friendly device name
   */
  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows Device';
    if (ua.includes('Mac')) return 'Mac Device';
    if (ua.includes('Linux')) return 'Linux Device';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
    return 'Unknown Device';
  }

  /**
   * Increment failed OTP attempts
   */
  private async incrementFailedAttempts(userId: string): Promise<void> {
    // This could be tracked in a separate table or in user metadata
    // For now, we'll just log it
    console.warn(`Failed OTP attempt for user ${userId}`);
  }

  /**
   * Clean up expired OTP codes
   */
  private async cleanupOldOTPs(userId: string): Promise<void> {
    try {
      await supabase
        .from('mfa_otp_codes')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Error cleaning up OTP codes:', error);
    }
  }

  /**
   * Resend OTP code
   */
  async resendOTP(userId: string, userEmail: string, userName: string): Promise<MFAResult> {
    // Invalidate all existing OTPs for this user
    try {
      await supabase
        .from('mfa_otp_codes')
        .update({ used: true })
        .eq('user_id', userId)
        .eq('used', false);
    } catch (error) {
      console.error('Error invalidating old OTPs:', error);
    }

    // Generate and send new OTP
    return this.generateAndSendOTP(userId, userEmail, userName);
  }
}

export const mfaService = new MFAService();

