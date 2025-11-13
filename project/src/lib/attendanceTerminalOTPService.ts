// lib/attendanceTerminalOTPService.ts
import { supabase } from './supabase';
import { getManilaTimestamp, getManilaTimestampWithOffset } from './utils/manilaTimestamp';
import { emailService } from './emailService';

export interface AttendanceTerminalOTPLog {
  id: string;
  branch_id: string;
  otp_code: string;
  device_uuid: string | null; // Stable UUID from localStorage
  device_fingerprint: string | null; // Metadata fingerprint
  device_name: string | null;
  device_type: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  ip_address: string | null;
  user_agent: string | null;
  browser_info: any;
  status: 'pending' | 'verified' | 'expired' | 'failed';
  verified_at: string | null;
  verified_by: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  verified_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface RequestOTPData {
  branch_id: string;
  device_uuid?: string; // Stable UUID from localStorage
  device_name?: string;
  device_type?: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  browser_info?: any;
}

export interface VerifyOTPData {
  otp_code: string;
  branch_id: string;
}

class AttendanceTerminalOTPService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;

  /**
   * Generate OTP code
   */
  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Get admin users for OTP notification
   */
  private async getAdminUsers(): Promise<Array<{ id: string; email: string; first_name: string; last_name: string }>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('is_active', true)
        .in('role', ['super-admin', 'admin', 'owner'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Request OTP for device registration
   */
  async requestOTP(data: RequestOTPData): Promise<{ success: boolean; otp_code?: string; error?: string }> {
    try {
      // Generate OTP
      const otpCode = this.generateOTP();
      
      // Calculate timestamps based on Philippine time (UTC+8)
      // Get current Philippine time as ISO string with +08:00 offset
      // Format: "2025-11-13T13:16:14+08:00" (Philippine time)
      const createdAtManila = getManilaTimestamp();
      
      // Calculate expiry time: Philippine time + 10 minutes
      // Format: "2025-11-13T13:26:14+08:00" (Philippine time)
      const expiresAtManila = getManilaTimestampWithOffset(this.OTP_EXPIRY_MINUTES * 60 * 1000);
      
      // Pass Manila timestamps with +08:00 offset to PostgreSQL
      // PostgreSQL will automatically convert these to UTC for storage
      // Example: "2025-11-13T13:16:14+08:00" -> stored as "2025-11-13T05:16:14+00:00" (UTC)
      const createdAtISO = createdAtManila;
      const expiresAtISO = expiresAtManila;
      
      console.log('🕐 OTP Timestamps (Philippine Time - UTC+8):', {
        created_at_ph: createdAtManila,
        expires_at_ph: expiresAtManila,
        note: 'PostgreSQL automatically converts +08:00 to UTC for storage'
      });

      // Get branch info
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('id', data.branch_id)
        .single();

      if (branchError || !branch) {
        throw new Error('Branch not found');
      }

      // Get device UUID (stable identifier from localStorage)
      const deviceUuid = data.device_uuid || data.browser_info?.device_uuid || null;
      
      // Get device fingerprint from browser info (for metadata/logging)
      // The fingerprint should be generated on the client side and passed in browser_info
      let deviceFingerprint = data.browser_info?.fingerprint || null;
      
      // If fingerprint is not in browser_info, generate it from browser characteristics
      if (!deviceFingerprint && data.browser_info) {
        const fingerprintString = 
          (data.user_agent || '') +
          (data.browser_info.language || '') +
          (data.browser_info.screen_resolution || '') +
          (data.browser_info.timezone || '') +
          (data.browser_info.platform || '');
        
        deviceFingerprint = btoa(fingerprintString).substring(0, 64);
      }
      
      // If no UUID provided, log a warning (but don't fail - backward compatibility)
      if (!deviceUuid) {
        console.warn('⚠️ No device_uuid provided in OTP request. Device identification may be unstable.');
      }

      // Insert OTP log using RPC function (bypasses RLS)
      // Pass device_uuid (primary) and device_fingerprint (metadata)
      // Pass timestamps in UTC ISO format - PostgreSQL stores in UTC
      const { data: otpLogId, error: insertError } = await supabase.rpc('insert_attendance_terminal_otp_log', {
        p_branch_id: data.branch_id,
        p_otp_code: otpCode,
        p_device_uuid: deviceUuid, // Stable UUID (primary identifier)
        p_device_fingerprint: deviceFingerprint, // Metadata fingerprint
        p_device_name: data.device_name || null,
        p_device_type: data.device_type || null,
        p_location_latitude: data.location_latitude || null,
        p_location_longitude: data.location_longitude || null,
        p_ip_address: data.ip_address || null,
        p_user_agent: data.user_agent || null,
        p_browser_info: data.browser_info || null,
        p_expires_at: expiresAtISO, // UTC ISO format (e.g., "2025-11-13T04:58:47.000Z")
        p_created_at: createdAtISO // UTC ISO format (e.g., "2025-11-13T04:48:47.000Z")
      });

      if (insertError) {
        console.error('Error inserting OTP log:', insertError);
        // Try direct insert as fallback
        // Pass timestamps in UTC ISO format - PostgreSQL stores in UTC
        const { error: directInsertError } = await supabase
          .from('attendance_terminal_otp_logs')
          .insert({
            branch_id: data.branch_id,
            otp_code: otpCode,
            device_uuid: deviceUuid,
            device_fingerprint: deviceFingerprint,
            device_name: data.device_name || null,
            device_type: data.device_type || null,
            location_latitude: data.location_latitude || null,
            location_longitude: data.location_longitude || null,
            ip_address: data.ip_address || null,
            user_agent: data.user_agent || null,
            browser_info: data.browser_info || null,
            status: 'pending',
            expires_at: expiresAtISO, // UTC ISO format (e.g., "2025-11-13T04:58:47.000Z")
            created_at: createdAtISO, // UTC ISO format (e.g., "2025-11-13T04:48:47.000Z")
            updated_at: createdAtISO // UTC ISO format (e.g., "2025-11-13T04:48:47.000Z")
          });

        if (directInsertError) {
          throw new Error(`Failed to create OTP log: ${directInsertError.message}`);
        }
      }

      // Get admin users and send OTP via email
      const adminUsers = await this.getAdminUsers();
      
      if (adminUsers.length > 0) {
        // Send OTP to all admin users
        const deviceInfoText = data.device_name 
          ? `Device: ${data.device_name}`
          : 'Device: Unknown';
        const locationText = data.location_latitude && data.location_longitude
          ? `\nLocation: ${data.location_latitude.toFixed(6)}, ${data.location_longitude.toFixed(6)}`
          : '';
        const customMessage = `An OTP code has been requested for Attendance Terminal device registration at ${branch.name} (${branch.code}).\n\n${deviceInfoText}${locationText}\n\nPlease provide this OTP code to the user to verify and register their device.`;
        
        const emailPromises = adminUsers.map(admin => 
          emailService.sendOTPEmail({
            to: admin.email,
            name: `${admin.first_name} ${admin.last_name}`,
            otpCode: otpCode,
            expiryMinutes: this.OTP_EXPIRY_MINUTES,
            customMessage: customMessage
          }).catch(err => {
            console.error(`Error sending OTP email to ${admin.email}:`, err);
            return { success: false, error: err.message };
          })
        );

        await Promise.all(emailPromises);
      } else {
        console.warn('⚠️ No admin users found to send OTP email');
        // Log OTP to console for development
        console.log('🔐 [DEV MODE] Attendance Terminal OTP Code:', otpCode);
        console.log('📧 Branch:', branch.name, '(', branch.code, ')');
      }

      return {
        success: true,
        otp_code: otpCode // Return OTP for development/testing
      };
    } catch (error: any) {
      console.error('Error requesting OTP:', error);
      return {
        success: false,
        error: error.message || 'Failed to request OTP'
      };
    }
  }

  /**
   * Verify OTP and get device fingerprint
   */
  async verifyOTP(data: VerifyOTPData): Promise<{
    success: boolean;
    device_uuid?: string; // Stable UUID from localStorage
    device_fingerprint?: string; // Metadata fingerprint
    device_name?: string;
    device_type?: string;
    location_latitude?: number;
    location_longitude?: number;
    browser_info?: any;
    error?: string;
  }> {
    try {
      // Verify OTP using RPC function
      const { data: result, error } = await supabase.rpc('verify_attendance_terminal_otp', {
        p_otp_code: data.otp_code,
        p_branch_id: data.branch_id
      });

      if (error) {
        console.error('Error verifying OTP:', error);
        // Try direct verification as fallback
        // Note: expires_at is stored in UTC in the database
        // Use current UTC time for comparison (PostgreSQL will handle timezone conversion)
        const currentUtcTime = new Date().toISOString();
        const { data: otpLog, error: fetchError } = await supabase
          .from('attendance_terminal_otp_logs')
          .select('*')
          .eq('otp_code', data.otp_code)
          .eq('branch_id', data.branch_id)
          .eq('status', 'pending')
          .gt('expires_at', currentUtcTime) // Compare with UTC time
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError || !otpLog) {
          return {
            success: false,
            error: 'Invalid or expired OTP code'
          };
        }

        // Update OTP status
        // Use Philippine timestamp with +08:00 offset - PostgreSQL converts to UTC
        const verifiedAt = getManilaTimestamp(); // Philippine time with +08:00 offset
        await supabase
          .from('attendance_terminal_otp_logs')
          .update({
            status: 'verified',
            verified_at: verifiedAt, // Philippine time with +08:00 offset - PostgreSQL converts to UTC
            updated_at: verifiedAt // Philippine time with +08:00 offset - PostgreSQL converts to UTC
          })
          .eq('id', otpLog.id);

        // Get device UUID (primary identifier)
        const deviceUuid = otpLog.device_uuid;
        
        // Get device fingerprint (metadata)
        let deviceFingerprint = otpLog.device_fingerprint;
        if (!deviceFingerprint) {
          // Generate fingerprint from browser info (metadata only)
          const fingerprintString = 
            (otpLog.user_agent || '') +
            (otpLog.browser_info?.language || '') +
            (otpLog.browser_info?.screen_resolution || '') +
            (otpLog.browser_info?.timezone || '') +
            (otpLog.browser_info?.platform || '');

          deviceFingerprint = btoa(fingerprintString).substring(0, 64);

          // Update OTP log with fingerprint (metadata)
          // Use Philippine timestamp with +08:00 offset - PostgreSQL converts to UTC
          const updatedAt = getManilaTimestamp(); // Philippine time with +08:00 offset
          await supabase
            .from('attendance_terminal_otp_logs')
            .update({
              device_fingerprint: deviceFingerprint,
              updated_at: updatedAt // Philippine time with +08:00 offset - PostgreSQL converts to UTC
            })
            .eq('id', otpLog.id);
        }

        return {
          success: true,
          device_uuid: deviceUuid || undefined,
          device_fingerprint: deviceFingerprint,
          device_name: otpLog.device_name || undefined,
          device_type: otpLog.device_type || undefined,
          location_latitude: otpLog.location_latitude || undefined,
          location_longitude: otpLog.location_longitude || undefined,
          browser_info: otpLog.browser_info || undefined
        };
      }

      if (!result || !result.success) {
        return {
          success: false,
          error: result?.error || 'Invalid or expired OTP code'
        };
      }

      // Get the OTP log to check if fingerprint exists
      const { data: otpLogData, error: logError } = await supabase
        .from('attendance_terminal_otp_logs')
        .select('*')
        .eq('id', result.otp_log_id)
        .single();

      if (logError && logError.code !== 'PGRST116') {
        console.error('Error fetching OTP log:', logError);
        // Continue - we'll generate fingerprint anyway
      }

      // Generate device fingerprint if not already stored
      let deviceFingerprint = result.device_fingerprint || otpLogData?.device_fingerprint;
      if (!deviceFingerprint) {
        // Generate fingerprint from browser info or user agent
        const browserInfo = result.browser_info || otpLogData?.browser_info || {};
        const userAgent = result.user_agent || otpLogData?.user_agent || '';
        
        // Use the fingerprint from browser_info if available, otherwise generate from browser characteristics
        if (browserInfo.fingerprint) {
          deviceFingerprint = browserInfo.fingerprint;
        } else {
          // Generate fingerprint from browser characteristics
          const fingerprintString = 
            userAgent +
            (browserInfo.language || '') +
            (browserInfo.screen_resolution || '') +
            (browserInfo.timezone || '') +
            (browserInfo.platform || '') +
            Date.now().toString();

          deviceFingerprint = btoa(fingerprintString).substring(0, 64);
        }

        // Update OTP log with fingerprint (metadata)
        // Use Philippine timestamp with +08:00 offset - PostgreSQL converts to UTC
        const updatedAt = getManilaTimestamp(); // Philippine time with +08:00 offset
        const { error: updateError } = await supabase
          .from('attendance_terminal_otp_logs')
          .update({
            device_fingerprint: deviceFingerprint,
            updated_at: updatedAt // Philippine time with +08:00 offset - PostgreSQL converts to UTC
          })
          .eq('id', result.otp_log_id);

        if (updateError) {
          console.error('Error updating OTP log with fingerprint:', updateError);
          // Don't throw - fingerprint is still valid and will be returned
        } else {
          console.log('✅ Device fingerprint stored in OTP log:', deviceFingerprint.substring(0, 20) + '...');
        }
      } else {
        console.log('✅ Device fingerprint found in OTP log:', deviceFingerprint.substring(0, 20) + '...');
      }

      // Return verification result
      // Note: device_uuid is returned from OTP log (if exists) but is NOT checked or validated during verification
      // OTP verification only checks the OTP code itself - device_uuid is just additional metadata
      return {
        success: true,
        device_uuid: result.device_uuid || otpLogData?.device_uuid || undefined, // Return from OTP log, but not required
        device_fingerprint: deviceFingerprint || '',
        device_name: result.device_name || otpLogData?.device_name || undefined,
        device_type: result.device_type || otpLogData?.device_type || undefined,
        location_latitude: result.location_latitude || otpLogData?.location_latitude || undefined,
        location_longitude: result.location_longitude || otpLogData?.location_longitude || undefined,
        browser_info: result.browser_info || otpLogData?.browser_info || undefined
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify OTP'
      };
    }
  }

  /**
   * Get OTP logs for a branch
   */
  async getOTPLogs(
    branchId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AttendanceTerminalOTPLog[]; count: number }> {
    try {
      const { data, error, count } = await supabase
        .from('attendance_terminal_otp_logs')
        .select(`
          *,
          branch:branches!attendance_terminal_otp_logs_branch_id_fkey (
            id,
            name,
            code
          ),
          verified_by_user:users!attendance_terminal_otp_logs_verified_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return {
        logs: data || [],
        count: count || 0
      };
    } catch (error: any) {
      console.error('Error fetching OTP logs:', error);
      throw new Error(`Failed to fetch OTP logs: ${error.message}`);
    }
  }

  /**
   * Get all OTP logs (across all branches)
   */
  async getAllOTPLogs(
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AttendanceTerminalOTPLog[]; count: number }> {
    try {
      const { data, error, count } = await supabase
        .from('attendance_terminal_otp_logs')
        .select(`
          *,
          branch:branches!attendance_terminal_otp_logs_branch_id_fkey (
            id,
            name,
            code
          ),
          verified_by_user:users!attendance_terminal_otp_logs_verified_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return {
        logs: data || [],
        count: count || 0
      };
    } catch (error: any) {
      console.error('Error fetching all OTP logs:', error);
      throw new Error(`Failed to fetch OTP logs: ${error.message}`);
    }
  }

  /**
   * Get OTP log by ID
   */
  async getOTPLogById(otpLogId: string): Promise<AttendanceTerminalOTPLog | null> {
    try {
      const { data, error } = await supabase
        .from('attendance_terminal_otp_logs')
        .select(`
          *,
          branch:branches!attendance_terminal_otp_logs_branch_id_fkey (
            id,
            name,
            code
          ),
          verified_by_user:users!attendance_terminal_otp_logs_verified_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', otpLogId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Error fetching OTP log:', error);
      throw new Error(`Failed to fetch OTP log: ${error.message}`);
    }
  }

  /**
   * Update OTP log status
   */
  async updateOTPLogStatus(
    otpLogId: string,
    status: 'pending' | 'verified' | 'expired' | 'failed',
    verifiedBy?: string
  ): Promise<void> {
    try {
      // Use Philippine timestamp with +08:00 offset - PostgreSQL converts to UTC
      const updatedAt = getManilaTimestamp(); // Philippine time with +08:00 offset
      const updateData: any = {
        status,
        updated_at: updatedAt // Philippine time with +08:00 offset - PostgreSQL converts to UTC
      };

      if (status === 'verified' && verifiedBy) {
        updateData.verified_by = verifiedBy;
        updateData.verified_at = updatedAt; // Philippine time with +08:00 offset - PostgreSQL converts to UTC
      }

      const { error } = await supabase
        .from('attendance_terminal_otp_logs')
        .update(updateData)
        .eq('id', otpLogId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating OTP log status:', error);
      throw new Error(`Failed to update OTP log status: ${error.message}`);
    }
  }
}

export const attendanceTerminalOTPService = new AttendanceTerminalOTPService();

