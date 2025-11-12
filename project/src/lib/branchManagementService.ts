import { supabase } from './supabase';
import { settingsService } from './settingsService';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  operating_hours: any; // JSONB
  branch_type: 'main' | 'satellite';
  created_at: string;
  updated_at: string | null;
  // Attendance Terminal Security Fields
  latitude?: number | null;
  longitude?: number | null;
  attendance_pin?: string | null;
  attendance_security_settings?: AttendanceSecuritySettings | null;
  // Joined fields
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AttendanceSecuritySettings {
  enableDeviceVerification: boolean;
  enableGeoLocationVerification: boolean;
  enablePinAccessControl: boolean;
  geoLocationToleranceMeters: number;
  requirePinForEachSession: boolean;
  pinSessionDurationHours: number;
  enableActivityLogging: boolean;
}

export interface CreateBranchData {
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active?: boolean;
  operating_hours?: any;
  branch_type?: 'main' | 'satellite';
  // Attendance Terminal Security Fields
  latitude?: number | null;
  longitude?: number | null;
  attendance_pin?: string | null;
  attendance_security_settings?: AttendanceSecuritySettings | null;
}

export interface UpdateBranchData extends Partial<CreateBranchData> {
  id: string;
}

export interface BranchSettings {
  allowInterBranchTransfers: boolean;
  shareInventoryAcrossBranches: boolean;
  enableBranchSpecificPricing: boolean;
}

export interface ManagerCandidate {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

class BranchManagementService {
  /**
   * Get all branches with manager information
   */
  async getAllBranches(): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          manager:users!branches_manager_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  /**
   * Get active branches only
   */
  async getActiveBranches(): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          manager:users!branches_manager_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching active branches:', error);
      throw new Error(`Failed to fetch active branches: ${error.message}`);
    }
  }

  /**
   * Get branch by ID
   */
  async getBranchById(branchId: string): Promise<Branch | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          manager:users!branches_manager_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', branchId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching branch:', error);
      throw new Error(`Failed to fetch branch: ${error.message}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchData: CreateBranchData): Promise<Branch> {
    try {
      // Validate branch code uniqueness
      const { data: existingBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('code', branchData.code)
        .single();

      if (existingBranch) {
        throw new Error('Branch code already exists. Please use a unique code.');
      }

      const { data, error } = await supabase
        .from('branches')
        .insert([{
          name: branchData.name,
          code: branchData.code.toUpperCase(),
          address: branchData.address,
          city: branchData.city,
          province: branchData.province,
          postal_code: branchData.postal_code || null,
          phone: branchData.phone || null,
          email: branchData.email || null,
          manager_id: branchData.manager_id || null,
          is_active: branchData.is_active !== undefined ? branchData.is_active : true,
          operating_hours: branchData.operating_hours || null,
          branch_type: branchData.branch_type || 'satellite',
          // Attendance Terminal Security Fields
          latitude: branchData.latitude !== undefined ? branchData.latitude : null,
          longitude: branchData.longitude !== undefined ? branchData.longitude : null,
          attendance_pin: branchData.attendance_pin || null,
          attendance_security_settings: branchData.attendance_security_settings || null
        }])
        .select(`
          *,
          manager:users!branches_manager_id_fkey (
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
      console.error('Error creating branch:', error);
      throw new Error(error.message || `Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Update an existing branch
   */
  async updateBranch(branchData: UpdateBranchData): Promise<Branch> {
    try {
      const { id, ...updateData } = branchData;

      // If code is being updated, check uniqueness
      if (updateData.code) {
        const { data: existingBranch } = await supabase
          .from('branches')
          .select('id')
          .eq('code', updateData.code.toUpperCase())
          .neq('id', id)
          .single();

        if (existingBranch) {
          throw new Error('Branch code already exists. Please use a unique code.');
        }

        updateData.code = updateData.code.toUpperCase();
      }

      // Prepare update object (remove undefined values)
      const cleanUpdateData: any = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] !== undefined) {
          cleanUpdateData[key] = updateData[key as keyof typeof updateData];
        }
      });

      const { data, error } = await supabase
        .from('branches')
        .update(cleanUpdateData)
        .eq('id', id)
        .select(`
          *,
          manager:users!branches_manager_id_fkey (
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
      console.error('Error updating branch:', error);
      throw new Error(error.message || `Failed to update branch: ${error.message}`);
    }
  }

  /**
   * Delete (deactivate) a branch
   */
  async deleteBranch(branchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: false })
        .eq('id', branchId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      throw new Error(`Failed to delete branch: ${error.message}`);
    }
  }

  /**
   * Get users who can be assigned as managers
   */
  async getManagerCandidates(): Promise<ManagerCandidate[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .eq('is_active', true)
        .in('role', ['super_admin', 'admin', 'manager', 'owner'])
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching manager candidates:', error);
      throw new Error(`Failed to fetch manager candidates: ${error.message}`);
    }
  }

  /**
   * Get branch settings from system_settings
   */
  async getBranchSettings(): Promise<BranchSettings> {
    try {
      const settings = await settingsService.getAllSettings();
      
      // Check in branchSettings property
      const branchSettings = (settings as any).branchSettings || {};
      
      // Also check flat structure for backward compatibility
      const flatSettings = settings as any;
      
      return {
        allowInterBranchTransfers: 
          branchSettings.allowInterBranchTransfers ?? 
          flatSettings.allowInterBranchTransfers ?? 
          false,
        shareInventoryAcrossBranches: 
          branchSettings.shareInventoryAcrossBranches ?? 
          flatSettings.shareInventoryAcrossBranches ?? 
          false,
        enableBranchSpecificPricing: 
          branchSettings.enableBranchSpecificPricing ?? 
          flatSettings.enableBranchSpecificPricing ?? 
          false
      };
    } catch (error: any) {
      console.error('Error fetching branch settings:', error);
      // Return defaults on error
      return {
        allowInterBranchTransfers: false,
        shareInventoryAcrossBranches: false,
        enableBranchSpecificPricing: false
      };
    }
  }

  /**
   * Update branch settings in system_settings
   */
  async updateBranchSettings(settings: BranchSettings): Promise<void> {
    try {
      const allSettings = await settingsService.getAllSettings();
      
      // Update settings with branchSettings nested
      await settingsService.updateSettings({
        ...allSettings,
        branchSettings: settings
      });
    } catch (error: any) {
      console.error('Error updating branch settings:', error);
      throw new Error(`Failed to update branch settings: ${error.message}`);
    }
  }
}

export const branchManagementService = new BranchManagementService();

