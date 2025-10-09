import { supabase } from './supabase';

export interface BranchInfo {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export interface TerminalInfo {
  id: string;
  terminal_name: string;
  terminal_code: string;
  branch_id: string;
  status: 'active' | 'inactive' | 'maintenance';
  assigned_user_id?: string;
  last_sync?: string;
  notes?: string;
}

export interface BranchTerminalData {
  branch: BranchInfo;
  terminal: TerminalInfo | null;
  sessionNumber?: string;
}

class BranchTerminalService {
  private static instance: BranchTerminalService;

  public static getInstance(): BranchTerminalService {
    if (!BranchTerminalService.instance) {
      BranchTerminalService.instance = new BranchTerminalService();
    }
    return BranchTerminalService.instance;
  }

  /**
   * Get branch information by ID
   */
  async getBranchById(branchId: string): Promise<BranchInfo | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code, address, phone, is_active')
        .eq('id', branchId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching branch:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBranchById:', error);
      return null;
    }
  }

  /**
   * Get terminal information by ID
   */
  async getTerminalById(terminalId: string): Promise<TerminalInfo | null> {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .select('id, terminal_name, terminal_code, branch_id, status, assigned_user_id, last_sync, notes')
        .eq('id', terminalId)
        .single();

      if (error) {
        console.error('Error fetching terminal:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTerminalById:', error);
      return null;
    }
  }

  /**
   * Get current POS session for a user
   */
  async getCurrentPOSSession(userId: string): Promise<{
    session: any;
    terminal: TerminalInfo | null;
    branch: BranchInfo | null;
  } | null> {
    try {
      // Get current open session for the user
      const { data: sessionData, error: sessionError } = await supabase
        .from('pos_sessions')
        .select(`
          id,
          session_number,
          terminal_id,
          branch_id,
          status,
          opened_at,
          branches!inner(
            id,
            name,
            code,
            address,
            phone,
            is_active
          ),
          pos_terminals!left(
            id,
            terminal_name,
            terminal_code,
            branch_id,
            status,
            assigned_user_id,
            last_sync,
            notes
          )
        `)
        .eq('cashier_id', userId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !sessionData) {
        console.log('No open POS session found for user:', userId);
        return null;
      }

      const branch: BranchInfo = {
        id: sessionData.branches.id,
        name: sessionData.branches.name,
        code: sessionData.branches.code,
        address: sessionData.branches.address,
        phone: sessionData.branches.phone,
        is_active: sessionData.branches.is_active
      };

      const terminal: TerminalInfo | null = sessionData.pos_terminals ? {
        id: sessionData.pos_terminals.id,
        terminal_name: sessionData.pos_terminals.terminal_name,
        terminal_code: sessionData.pos_terminals.terminal_code,
        branch_id: sessionData.pos_terminals.branch_id,
        status: sessionData.pos_terminals.status,
        assigned_user_id: sessionData.pos_terminals.assigned_user_id,
        last_sync: sessionData.pos_terminals.last_sync,
        notes: sessionData.pos_terminals.notes
      } : null;

      return {
        session: sessionData,
        terminal,
        branch
      };
    } catch (error) {
      console.error('Error in getCurrentPOSSession:', error);
      return null;
    }
  }

  /**
   * Get branch and terminal data for a user
   */
  async getBranchTerminalData(userId: string, branchId?: string): Promise<BranchTerminalData | null> {
    try {
      // First try to get from current POS session
      const sessionData = await this.getCurrentPOSSession(userId);
      if (sessionData) {
        return {
          branch: sessionData.branch,
          terminal: sessionData.terminal,
          sessionNumber: sessionData.session.session_number
        };
      }

      // If no session, get branch info directly
      if (branchId) {
        const branch = await this.getBranchById(branchId);
        if (branch) {
          return {
            branch,
            terminal: null
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error in getBranchTerminalData:', error);
      return null;
    }
  }

  /**
   * Format branch and terminal display name
   */
  formatDisplayName(branch: BranchInfo, terminal?: TerminalInfo | null): string {
    if (terminal) {
      return `${branch.code}-${terminal.terminal_code}`;
    }
    return branch.code;
  }

  /**
   * Get terminal code for display
   */
  getTerminalCode(terminal?: TerminalInfo | null): string {
    return terminal?.terminal_code || 'POS Terminal';
  }

  /**
   * Format branch full name
   */
  formatBranchName(branch: BranchInfo): string {
    return branch.name;
  }
}

export const branchTerminalService = BranchTerminalService.getInstance();
