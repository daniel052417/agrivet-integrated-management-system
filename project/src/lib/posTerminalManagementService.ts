import { supabase } from './supabase';

export interface POSTerminal {
  id: string;
  terminal_name: string;
  terminal_code: string;
  branch_id: string;
  status: 'active' | 'inactive';
  assigned_user_id: string | null;
  last_sync: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  // Joined fields
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export interface CreateTerminalData {
  terminal_name: string;
  terminal_code: string;
  branch_id: string;
  status?: 'active' | 'inactive';
  assigned_user_id?: string;
  notes?: string;
}

export interface UpdateTerminalData extends Partial<CreateTerminalData> {
  id: string;
}

export interface UserCandidate {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

class POSTerminalManagementService {
  /**
   * Get all terminals with branch and user information
   */
  async getAllTerminals(): Promise<POSTerminal[]> {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .select(`
          *,
          branch:branches!pos_terminals_branch_id_fkey (
            id,
            name,
            code
          ),
          assigned_user:users!pos_terminals_assigned_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('terminal_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching terminals:', error);
      throw new Error(`Failed to fetch terminals: ${error.message}`);
    }
  }

  /**
   * Get active terminals only
   */
  async getActiveTerminals(): Promise<POSTerminal[]> {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .select(`
          *,
          branch:branches!pos_terminals_branch_id_fkey (
            id,
            name,
            code
          ),
          assigned_user:users!pos_terminals_assigned_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('status', 'active')
        .order('terminal_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching active terminals:', error);
      throw new Error(`Failed to fetch active terminals: ${error.message}`);
    }
  }

  /**
   * Get terminal by ID
   */
  async getTerminalById(terminalId: string): Promise<POSTerminal | null> {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .select(`
          *,
          branch:branches!pos_terminals_branch_id_fkey (
            id,
            name,
            code
          ),
          assigned_user:users!pos_terminals_assigned_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('id', terminalId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching terminal:', error);
      throw new Error(`Failed to fetch terminal: ${error.message}`);
    }
  }

  /**
   * Get terminals by branch ID
   */
  async getTerminalsByBranch(branchId: string): Promise<POSTerminal[]> {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .select(`
          *,
          branch:branches!pos_terminals_branch_id_fkey (
            id,
            name,
            code
          ),
          assigned_user:users!pos_terminals_assigned_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('branch_id', branchId)
        .order('terminal_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching terminals by branch:', error);
      throw new Error(`Failed to fetch terminals: ${error.message}`);
    }
  }

  /**
   * Create a new terminal
   */
  async createTerminal(terminalData: CreateTerminalData): Promise<POSTerminal> {
    try {
      // Validate terminal code uniqueness
      const { data: existingTerminal } = await supabase
        .from('pos_terminals')
        .select('id')
        .eq('terminal_code', terminalData.terminal_code)
        .single();

      if (existingTerminal) {
        throw new Error('Terminal code already exists. Please use a unique code.');
      }

      const { data, error } = await supabase
        .from('pos_terminals')
        .insert([{
          terminal_name: terminalData.terminal_name,
          terminal_code: terminalData.terminal_code.toUpperCase(),
          branch_id: terminalData.branch_id,
          status: terminalData.status || 'active',
          assigned_user_id: terminalData.assigned_user_id || null,
          notes: terminalData.notes || null
        }])
        .select(`
          *,
          branch:branches!pos_terminals_branch_id_fkey (
            id,
            name,
            code
          ),
          assigned_user:users!pos_terminals_assigned_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating terminal:', error);
      throw new Error(error.message || `Failed to create terminal: ${error.message}`);
    }
  }

  /**
   * Update an existing terminal
   */
  async updateTerminal(terminalData: UpdateTerminalData): Promise<POSTerminal> {
    try {
      const { id, ...updateData } = terminalData;

      // If code is being updated, check uniqueness
      if (updateData.terminal_code) {
        const { data: existingTerminal } = await supabase
          .from('pos_terminals')
          .select('id')
          .eq('terminal_code', updateData.terminal_code.toUpperCase())
          .neq('id', id)
          .single();

        if (existingTerminal) {
          throw new Error('Terminal code already exists. Please use a unique code.');
        }

        updateData.terminal_code = updateData.terminal_code.toUpperCase();
      }

      // Prepare update object (remove undefined values)
      const cleanUpdateData: any = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] !== undefined) {
          cleanUpdateData[key] = updateData[key as keyof typeof updateData];
        }
      });

      // Handle null values for assigned_user_id
      if ('assigned_user_id' in updateData && updateData.assigned_user_id === '') {
        cleanUpdateData.assigned_user_id = null;
      }

      const { data, error } = await supabase
        .from('pos_terminals')
        .update(cleanUpdateData)
        .eq('id', id)
        .select(`
          *,
          branch:branches!pos_terminals_branch_id_fkey (
            id,
            name,
            code
          ),
          assigned_user:users!pos_terminals_assigned_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating terminal:', error);
      throw new Error(error.message || `Failed to update terminal: ${error.message}`);
    }
  }

  /**
   * Delete (deactivate) a terminal
   */
  async deleteTerminal(terminalId: string): Promise<void> {
    try {
      // Soft delete by setting status to inactive
      const { error } = await supabase
        .from('pos_terminals')
        .update({ status: 'inactive' })
        .eq('id', terminalId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting terminal:', error);
      throw new Error(`Failed to delete terminal: ${error.message}`);
    }
  }

  /**
   * Get users who can be assigned to terminals (cashiers, managers, admins)
   */
  async getUserCandidates(): Promise<UserCandidate[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .eq('is_active', true)
        .in('role', ['super_admin', 'admin', 'manager', 'cashier', 'owner'])
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user candidates:', error);
      throw new Error(`Failed to fetch user candidates: ${error.message}`);
    }
  }
}

export const posTerminalManagementService = new POSTerminalManagementService();

