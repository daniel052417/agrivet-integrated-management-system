// POS Device Access Service
// Checks if a device is authorized to access POS based on branch settings

import { supabase } from '../../lib/supabase';
import { mfaService } from '../../lib/mfaService';

export interface DeviceAccessResult {
  allowed: boolean;
  reason?: string;
  isAttendanceDevice?: boolean;
}

class POSDeviceAccessService {
  /**
   * Get device UUID/fingerprint from current device
   */
  private getDeviceUUID(): string | null {
    try {
      // Try to get from localStorage (stable UUID)
      const storedUUID = localStorage.getItem('device_uuid');
      if (storedUUID) {
        return storedUUID;
      }

      // Generate and store a new UUID if not exists
      const newUUID = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      localStorage.setItem('device_uuid', newUUID);
      return newUUID;
    } catch (error) {
      console.error('Error getting device UUID:', error);
      // Fallback to fingerprint
      return mfaService.generateDeviceFingerprint();
    }
  }

  /**
   * Check if device is a registered attendance terminal device for the branch
   */
  private async isAttendanceTerminalDevice(
    deviceUUID: string,
    branchId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('attendance_terminal_devices')
        .select('id, device_uuid, branch_id, is_active')
        .eq('branch_id', branchId)
        .eq('device_uuid', deviceUUID)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking attendance terminal device:', error);
      return false;
    }
  }

  /**
   * Check if device is a registered POS terminal device
   * (This would need to be implemented based on your POS terminal registration system)
   */
  private async isPOSTerminalDevice(
    deviceUUID: string,
    branchId: string
  ): Promise<boolean> {
    try {
      // TODO: Implement POS terminal device check
      // This would check against a pos_terminal_devices table or similar
      // For now, return false as POS terminals might use a different system
      return false;
    } catch (error) {
      console.error('Error checking POS terminal device:', error);
      return false;
    }
  }

  /**
   * Get branch setting for allow_attendance_device_for_pos
   */
  private async getBranchSetting(branchId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('allow_attendance_device_for_pos')
        .eq('id', branchId)
        .single();

      if (error || !data) {
        console.error('Error fetching branch setting:', error);
        return false; // Default to false (most restrictive)
      }

      return data.allow_attendance_device_for_pos === true;
    } catch (error) {
      console.error('Error getting branch setting:', error);
      return false;
    }
  }

  /**
   * Check if device is allowed to access POS (for authentication)
   * This is called during login to verify device before allowing access
   * 
   * @param userId - User ID
   * @param branchId - Branch ID (from user's assignment)
   * @param roleName - User's role name (e.g., 'cashier')
   * @returns DeviceAccessResult
   */
  async checkDeviceAccessForLogin(
    userId: string,
    branchId: string | null | undefined,
    roleName: string
  ): Promise<DeviceAccessResult> {
    // Only check for cashier role
    if (roleName !== 'cashier') {
      return {
        allowed: true,
        isAttendanceDevice: false
      };
    }

    return this.checkDeviceAccess(userId, branchId);
  }

  /**
   * Check if device is allowed to access POS
   * 
   * Logic:
   * 1. Get device UUID
   * 2. Get user's branch_id
   * 3. Check branch setting allow_attendance_device_for_pos
   * 4. If true: verify device is registered attendance terminal device
   * 5. If false: verify device is registered POS terminal device
   * 
   * @param userId - User ID
   * @param branchId - Branch ID (from user's assignment)
   * @returns DeviceAccessResult
   */
  async checkDeviceAccess(
    userId: string,
    branchId: string | null | undefined
  ): Promise<DeviceAccessResult> {
    try {
      // Validate inputs
      if (!userId) {
        return {
          allowed: false,
          reason: 'User ID is required'
        };
      }

      if (!branchId) {
        return {
          allowed: false,
          reason: 'Branch ID is required. User must be assigned to a branch.'
        };
      }

      // Get device UUID
      const deviceUUID = this.getDeviceUUID();
      if (!deviceUUID) {
        return {
          allowed: false,
          reason: 'Unable to identify device'
        };
      }

      // Get branch setting
      const allowAttendanceDevice = await this.getBranchSetting(branchId);

      if (allowAttendanceDevice) {
        // When toggle is ON: Only allow if device is registered attendance terminal device
        const isAttendanceDevice = await this.isAttendanceTerminalDevice(
          deviceUUID,
          branchId
        );

        if (isAttendanceDevice) {
          return {
            allowed: true,
            isAttendanceDevice: true
          };
        } else {
          return {
            allowed: false,
            reason: 'Unauthorized device. This device is not registered as POS terminal device for this branch.',
            isAttendanceDevice: false
          };
        }
      } else {
        // When toggle is OFF: Only allow POS-registered devices
        // TODO: Implement POS terminal device registration system
        // For now, since POS device registration is not implemented,
        // we allow access when toggle is OFF (default behavior)
        // Once POS device registration is implemented, uncomment the code below:
        
        /*
        const isPOSDevice = await this.isPOSTerminalDevice(deviceUUID, branchId);
        
        if (isPOSDevice) {
          return {
            allowed: true,
            isAttendanceDevice: false
          };
        } else {
          return {
            allowed: false,
            reason: 'Unauthorized device. Only POS-registered devices can access POS when attendance device access is disabled.',
            isAttendanceDevice: false
          };
        }
        */
        
        // Temporary: Allow access when toggle is OFF (until POS device registration is implemented)
        return {
          allowed: true,
          isAttendanceDevice: false
        };
      }
    } catch (error: any) {
      console.error('Error checking device access:', error);
      return {
        allowed: false,
        reason: `Error checking device access: ${error.message}`
      };
    }
  }
}

export const posDeviceAccessService = new POSDeviceAccessService();

