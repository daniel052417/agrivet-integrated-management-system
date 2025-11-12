// lib/attendanceTerminalDeviceService.ts
import { supabase } from './supabase';
import { getManilaTimestamp } from './utils/manilaTimestamp';

export interface AttendanceTerminalDevice {
  id: string;
  branch_id: string;
  device_fingerprint: string;
  device_name: string;
  device_type?: string | null;
  browser_info?: any;
  registered_by: string;
  is_active: boolean;
  last_used_at?: string | null;
  registered_at: string;
  updated_at: string;
  // Joined fields
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  registered_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AttendanceTerminalActivityLog {
  id: string;
  branch_id: string;
  device_id?: string | null;
  staff_id?: string | null;
  device_fingerprint?: string | null;
  action_type: 'time_in' | 'time_out' | 'access_denied' | 'device_verified' | 'pin_verified' | 'location_verified' | 'location_failed' | 'device_blocked' | 'pin_failed';
  status: 'success' | 'failed' | 'blocked' | 'warning';
  status_reason?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  distance_from_branch_meters?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  session_data?: any;
  created_at: string;
  // Joined fields
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  device?: {
    id: string;
    device_name: string;
  };
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

export interface CreateDeviceData {
  branch_id: string;
  device_fingerprint: string;
  device_name: string;
  device_type?: string;
  browser_info?: any;
}

export interface UpdateDeviceData {
  id: string;
  device_name?: string;
  device_type?: string;
  is_active?: boolean;
  browser_info?: any;
}

class AttendanceTerminalDeviceService {
  /**
   * Get all devices for a branch
   */
  async getBranchDevices(branchId: string): Promise<AttendanceTerminalDevice[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_terminal_devices')
        .select(`
          *,
          branch:branches!attendance_terminal_devices_branch_id_fkey (
            id,
            name,
            code
          ),
          registered_by_user:users!attendance_terminal_devices_registered_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('branch_id', branchId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching branch devices:', error);
      throw new Error(`Failed to fetch branch devices: ${error.message}`);
    }
  }

  /**
   * Get all devices (across all branches)
   */
  async getAllDevices(): Promise<AttendanceTerminalDevice[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_terminal_devices')
        .select(`
          *,
          branch:branches!attendance_terminal_devices_branch_id_fkey (
            id,
            name,
            code
          ),
          registered_by_user:users!attendance_terminal_devices_registered_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all devices:', error);
      throw new Error(`Failed to fetch devices: ${error.message}`);
    }
  }

  /**
   * Get device by fingerprint
   */
  async getDeviceByFingerprint(
    branchId: string,
    deviceFingerprint: string
  ): Promise<AttendanceTerminalDevice | null> {
    try {
      const { data, error } = await supabase
        .from('attendance_terminal_devices')
        .select('*')
        .eq('branch_id', branchId)
        .eq('device_fingerprint', deviceFingerprint)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No device found
        }
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Error fetching device by fingerprint:', error);
      throw new Error(`Failed to fetch device: ${error.message}`);
    }
  }

  /**
   * Register a new device for a branch
   */
  async registerDevice(
    deviceData: CreateDeviceData,
    registeredBy: string
  ): Promise<AttendanceTerminalDevice> {
    try {
      // Check if device already exists
      console.log('🔍 Checking if device already exists...', {
        branchId: deviceData.branch_id,
        fingerprint: deviceData.device_fingerprint.substring(0, 20) + '...' // First 20 chars only for security
      });
      
      const existing = await this.getDeviceByFingerprint(
        deviceData.branch_id,
        deviceData.device_fingerprint
      );

      if (existing) {
        console.warn('⚠️ Device already registered for this branch', {
          deviceId: existing.id,
          deviceName: existing.device_name,
          branchId: existing.branch_id,
          isActive: existing.is_active
        });
        throw new Error('Device already registered for this branch');
      }
      
      console.log('✅ Device not found, proceeding with registration...');
      console.log('💾 Inserting device into database...', {
        branchId: deviceData.branch_id,
        deviceName: deviceData.device_name,
        deviceType: deviceData.device_type || 'kiosk',
        registeredBy: registeredBy
      });

      const { data, error } = await supabase
        .from('attendance_terminal_devices')
        .insert({
          branch_id: deviceData.branch_id,
          device_fingerprint: deviceData.device_fingerprint,
          device_name: deviceData.device_name,
          device_type: deviceData.device_type || null,
          browser_info: deviceData.browser_info || null,
          registered_by: registeredBy,
          is_active: true,
          registered_at: getManilaTimestamp(),
          updated_at: getManilaTimestamp()
        })
        .select(`
          *,
          branch:branches!attendance_terminal_devices_branch_id_fkey (
            id,
            name,
            code
          ),
          registered_by_user:users!attendance_terminal_devices_registered_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      
      // Debug: Log successful device registration
      console.log('✅ Device registered successfully!', {
        deviceId: data.id,
        deviceName: data.device_name,
        branchId: data.branch_id,
        branchName: data.branch?.name,
        deviceFingerprint: data.device_fingerprint.substring(0, 20) + '...', // First 20 chars only for security
        deviceType: data.device_type,
        registeredBy: data.registered_by,
        registeredAt: data.registered_at,
        isActive: data.is_active
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ Error registering device:', error);
      throw new Error(`Failed to register device: ${error.message}`);
    }
  }

  /**
   * Update device information
   */
  async updateDevice(deviceData: UpdateDeviceData): Promise<AttendanceTerminalDevice> {
    try {
      const { id, ...updateData } = deviceData;

      const { data, error } = await supabase
        .from('attendance_terminal_devices')
        .update({
          ...updateData,
          updated_at: getManilaTimestamp()
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches!attendance_terminal_devices_branch_id_fkey (
            id,
            name,
            code
          ),
          registered_by_user:users!attendance_terminal_devices_registered_by_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating device:', error);
      throw new Error(`Failed to update device: ${error.message}`);
    }
  }

  /**
   * Deactivate device
   */
  async deactivateDevice(deviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance_terminal_devices')
        .update({
          is_active: false,
          updated_at: getManilaTimestamp()
        })
        .eq('id', deviceId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deactivating device:', error);
      throw new Error(`Failed to deactivate device: ${error.message}`);
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance_terminal_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting device:', error);
      throw new Error(`Failed to delete device: ${error.message}`);
    }
  }

  /**
   * Update device last used timestamp
   */
  async updateDeviceLastUsed(deviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance_terminal_devices')
        .update({
          last_used_at: getManilaTimestamp(),
          updated_at: getManilaTimestamp()
        })
        .eq('id', deviceId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating device last used:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Log activity
   * Uses the database function to bypass RLS and allow logging from unauthenticated contexts
   */
  async logActivity(logData: {
    branch_id: string;
    device_id?: string | null;
    staff_id?: string | null;
    device_fingerprint?: string | null;
    action_type: AttendanceTerminalActivityLog['action_type'];
    status: AttendanceTerminalActivityLog['status'];
    status_reason?: string | null;
    location_latitude?: number | null;
    location_longitude?: number | null;
    distance_from_branch_meters?: number | null;
    ip_address?: string | null;
    user_agent?: string | null;
    session_data?: any;
  }): Promise<void> {
    try {
      console.log('📝 Attempting to log activity:', {
        branch_id: logData.branch_id,
        action_type: logData.action_type,
        status: logData.status,
        device_id: logData.device_id || null,
        device_fingerprint: logData.device_fingerprint ? logData.device_fingerprint.substring(0, 20) + '...' : null
      });

      // Use the database function to insert logs (bypasses RLS)
      // Pass Manila timestamp to ensure consistency
      const manilaTimestamp = getManilaTimestamp();
      console.log('📅 Using Manila timestamp for log:', manilaTimestamp);
      
      const { data, error } = await supabase.rpc('insert_attendance_terminal_activity_log', {
        p_branch_id: logData.branch_id,
        p_device_id: logData.device_id || null,
        p_staff_id: logData.staff_id || null,
        p_device_fingerprint: logData.device_fingerprint || null,
        p_action_type: logData.action_type,
        p_status: logData.status,
        p_status_reason: logData.status_reason || null,
        p_location_latitude: logData.location_latitude || null,
        p_location_longitude: logData.location_longitude || null,
        p_distance_from_branch_meters: logData.distance_from_branch_meters || null,
        p_ip_address: logData.ip_address || null,
        p_user_agent: logData.user_agent || null,
        p_session_data: logData.session_data || null,
        p_created_at: manilaTimestamp
      });

      console.log('📝 RPC call result:', { data, error: error ? { message: error.message, code: error.code } : null });

      if (error) {
        // If RPC fails, try direct insert as fallback
        console.warn('⚠️ RPC insert failed, trying direct insert:', error);
        console.warn('⚠️ RPC error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        try {
          const { error: insertError } = await supabase
            .from('attendance_terminal_activity_logs')
            .insert({
              ...logData,
              created_at: getManilaTimestamp()
            });
          
          if (insertError) {
            console.error('❌ Direct insert also failed:', insertError);
            console.error('❌ Insert error details:', {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            });
            throw insertError;
          } else {
            console.log('✅ Activity logged via direct insert (RPC fallback)');
          }
        } catch (insertErr: any) {
          console.error('❌ Both RPC and direct insert failed:', insertErr);
          // Don't throw - activity logging is not critical, but log the error
          throw insertErr; // Actually, let's throw to see the error in console
        }
      } else {
        console.log('✅ Activity logged via RPC successfully');
      }
    } catch (error: any) {
      console.error('❌ Error logging activity:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        logData: {
          branch_id: logData.branch_id,
          action_type: logData.action_type,
          status: logData.status,
          device_id: logData.device_id,
          device_fingerprint: logData.device_fingerprint ? logData.device_fingerprint.substring(0, 20) + '...' : null
        }
      });
      // Don't throw - activity logging is not critical for attendance recording
      // But we want to see the error in console for debugging
    }
  }

  /**
   * Get activity logs for a branch
   */
  async getBranchActivityLogs(
    branchId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AttendanceTerminalActivityLog[]; count: number }> {
    try {
      const { data, error, count } = await supabase
        .from('attendance_terminal_activity_logs')
        .select(`
          *,
          branch:branches!attendance_terminal_activity_logs_branch_id_fkey (
            id,
            name,
            code
          ),
          device:attendance_terminal_devices!attendance_terminal_activity_logs_device_id_fkey (
            id,
            device_name
          ),
          staff:staff!attendance_terminal_activity_logs_staff_id_fkey (
            id,
            first_name,
            last_name,
            employee_id
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
      console.error('Error fetching activity logs:', error);
      throw new Error(`Failed to fetch activity logs: ${error.message}`);
    }
  }

  /**
   * Get activity logs with filters
   */
  async getActivityLogs(filters: {
    branch_id?: string;
    device_id?: string;
    staff_id?: string;
    action_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AttendanceTerminalActivityLog[]; count: number }> {
    try {
      let query = supabase
        .from('attendance_terminal_activity_logs')
        .select(`
          *,
          branch:branches!attendance_terminal_activity_logs_branch_id_fkey (
            id,
            name,
            code
          ),
          device:attendance_terminal_devices!attendance_terminal_activity_logs_device_id_fkey (
            id,
            device_name
          ),
          staff:staff!attendance_terminal_activity_logs_staff_id_fkey (
            id,
            first_name,
            last_name,
            employee_id
          )
        `, { count: 'exact' });

      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters.device_id) {
        query = query.eq('device_id', filters.device_id);
      }
      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const limit = filters.limit || 100;
      const offset = filters.offset || 0;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return {
        logs: data || [],
        count: count || 0
      };
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      throw new Error(`Failed to fetch activity logs: ${error.message}`);
    }
  }
}

export const attendanceTerminalDeviceService = new AttendanceTerminalDeviceService();

