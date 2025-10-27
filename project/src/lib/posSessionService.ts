import { supabase } from './supabase';

export interface POSSession {
  id: string;
  cashier_id: string;
  branch_id: string;
  session_number: string;
  opened_at: string;
  closed_at?: string;
  starting_cash?: number;
  ending_cash?: number;
  total_sales: number;
  total_transactions: number;
  status: 'open' | 'closed';
  notes?: string;
  terminal_id?: string;
  session_type: 'sale' | 'return' | 'exchange';
  total_discounts: number;
  total_returns: number;
  total_taxes: number;
  closed_by?: string;
  cash_variance?: number;
  session_duration?: string;
  created_at: string;
  updated_at: string;
}

export interface POSSessionCreateData {
  cashier_id: string;
  branch_id: string;
  terminal_id?: string;
  starting_cash?: number;
  notes?: string;
}

class POSSessionService {
  /**
   * Create a new POS session for a cashier
   */
  async createSession(data: POSSessionCreateData): Promise<POSSession> {
    try {
      console.log('🔄 [POS Session] Creating new session for cashier:', data.cashier_id);

      // Generate unique session number
      const sessionNumber = await this.generateSessionNumber(data.branch_id);

      // Check if cashier already has an open session
      const existingSession = await this.getOpenSessionByCashier(data.cashier_id);
      if (existingSession) {
        throw new Error('Cashier already has an open session. Please close the existing session first.');
      }

      // Create the session
      const { data: sessionData, error } = await supabase
        .from('pos_sessions')
        .insert({
          cashier_id: data.cashier_id,
          branch_id: data.branch_id,
          terminal_id: data.terminal_id,
          session_number: sessionNumber,
          starting_cash: data.starting_cash || 0.00,
          status: 'open',
          session_type: 'sale',
          notes: data.notes,
          total_sales: 0.00,
          total_transactions: 0,
          total_discounts: 0.00,
          total_returns: 0.00,
          total_taxes: 0.00
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [POS Session] Error creating session:', error);
        throw error;
      }

      console.log('✅ [POS Session] Session created successfully:', sessionData.id);
      return sessionData;
    } catch (error) {
      console.error('❌ [POS Session] Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get an open session for a specific cashier
   */
  async getOpenSessionByCashier(cashierId: string): Promise<POSSession | null> {
    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('cashier_id', cashierId)
        .eq('status', 'open')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('❌ [POS Session] Error getting open session:', error);
      throw error;
    }
  }

  /**
   * Get available POS terminal for a branch
   */
  async getAvailableTerminalForBranch(branchId: string, cashierId?: string): Promise<string | null> {
    try {
      console.log('🔍 [POS Session] Looking for available terminal for branch:', branchId);

      // First, try to find a terminal assigned to the specific cashier
      if (cashierId) {
        const { data: assignedTerminal, error: assignedError } = await supabase
          .from('pos_terminals')
          .select('id')
          .eq('branch_id', branchId)
          .eq('assigned_user_id', cashierId)
          .eq('status', 'active')
          .single();

        if (!assignedError && assignedTerminal) {
          console.log('✅ [POS Session] Found assigned terminal:', assignedTerminal.id);
          return assignedTerminal.id;
        }
      }

      // If no assigned terminal, find any available terminal in the branch
      const { data: availableTerminal, error: availableError } = await supabase
        .from('pos_terminals')
        .select('id')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .is('assigned_user_id', null) // No specific user assigned
        .single();

      if (!availableError && availableTerminal) {
        console.log('✅ [POS Session] Found available terminal:', availableTerminal.id);
        return availableTerminal.id;
      }

      // If still no terminal, get any active terminal in the branch (even if assigned to someone else)
      const { data: anyTerminal, error: anyError } = await supabase
        .from('pos_terminals')
        .select('id')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .single();

      if (!anyError && anyTerminal) {
        console.log('✅ [POS Session] Found any active terminal:', anyTerminal.id);
        return anyTerminal.id;
      }

      console.log('⚠️ [POS Session] No available terminal found for branch:', branchId);
      return null;
    } catch (error) {
      console.error('❌ [POS Session] Error getting available terminal:', error);
      throw error;
    }
  }

  /**
   * Generate unique session number
   */
  private async generateSessionNumber(branchId: string): Promise<string> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      
      // Get today's session count for this branch
      const { count, error } = await supabase
        .from('pos_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('created_at', today.toISOString().split('T')[0]);

      if (error) {
        throw error;
      }

      const sessionCount = (count || 0) + 1;
      const sessionNumber = `POS-${dateStr}-${sessionCount.toString().padStart(4, '0')}`;
      
      console.log('🔢 [POS Session] Generated session number:', sessionNumber);
      return sessionNumber;
    } catch (error) {
      console.error('❌ [POS Session] Error generating session number:', error);
      throw error;
    }
  }

  /**
   * Close a POS session
   */
  async closeSession(sessionId: string, closedBy: string, endingCash?: number, notes?: string): Promise<POSSession> {
    try {
      console.log('🔄 [POS Session] Closing session:', sessionId);

      const { data, error } = await supabase
        .from('pos_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: closedBy,
          ending_cash: endingCash,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ [POS Session] Session closed successfully:', sessionId);
      return data;
    } catch (error) {
      console.error('❌ [POS Session] Error closing session:', error);
      throw error;
    }
  }

  /**
   * Get session history for a cashier
   */
  async getSessionHistory(cashierId: string, limit: number = 10): Promise<POSSession[]> {
    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('cashier_id', cashierId)
        .order('opened_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [POS Session] Error getting session history:', error);
      throw error;
    }
  }

  /**
   * Update session totals (sales, transactions, etc.)
   */
  async updateSessionTotals(
    sessionId: string, 
    updates: {
      total_sales?: number;
      total_transactions?: number;
      total_discounts?: number;
      total_returns?: number;
      total_taxes?: number;
    }
  ): Promise<POSSession> {
    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ [POS Session] Error updating session totals:', error);
      throw error;
    }
  }

  /**
   * Check if a cashier has an open session
   */
  async hasOpenSession(cashierId: string): Promise<boolean> {
    try {
      const session = await this.getOpenSessionByCashier(cashierId);
      return session !== null;
    } catch (error) {
      console.error('❌ [POS Session] Error checking open session:', error);
      return false;
    }
  }

  /**
   * Get current POS session for a cashier (if any)
   */
  async getCurrentSession(cashierId: string): Promise<POSSession | null> {
    try {
      return await this.getOpenSessionByCashier(cashierId);
    } catch (error) {
      console.error('❌ [POS Session] Error getting current session:', error);
      return null;
    }
  }

  /**
   * Validate if a cashier can start a new session
   */
  async canStartNewSession(cashierId: string, branchId: string): Promise<{
    canStart: boolean;
    reason?: string;
    existingSession?: POSSession;
  }> {
    try {
      // Check if cashier already has an open session
      const existingSession = await this.getOpenSessionByCashier(cashierId);
      if (existingSession) {
        return {
          canStart: false,
          reason: 'Cashier already has an open session',
          existingSession
        };
      }

      // Check if there's an available terminal
      const terminalId = await this.getAvailableTerminalForBranch(branchId, cashierId);
      if (!terminalId) {
        return {
          canStart: false,
          reason: 'No available POS terminal found for this branch'
        };
      }

      return {
        canStart: true
      };
    } catch (error) {
      console.error('❌ [POS Session] Error validating session start:', error);
      return {
        canStart: false,
        reason: 'Error validating session: ' + (error as Error).message
      };
    }
  }

  /**
   * Get all open sessions for a branch
   */
  async getOpenSessionsForBranch(branchId: string): Promise<POSSession[]> {
    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select(`
          *,
          users!inner(
            id,
            first_name,
            last_name,
            email
          ),
          pos_terminals!left(
            id,
            terminal_name,
            terminal_code
          )
        `)
        .eq('branch_id', branchId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [POS Session] Error getting open sessions for branch:', error);
      throw error;
    }
  }

  /**
   * Force close all open sessions for a cashier (emergency use)
   */
  async forceCloseAllSessionsForCashier(cashierId: string, closedBy: string, reason: string): Promise<number> {
    try {
      console.log('🚨 [POS Session] Force closing all sessions for cashier:', cashierId);

      const { data, error } = await supabase
        .from('pos_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: closedBy,
          notes: `Force closed: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('cashier_id', cashierId)
        .eq('status', 'open')
        .select('id');

      if (error) {
        throw error;
      }

      const closedCount = data?.length || 0;
      console.log(`✅ [POS Session] Force closed ${closedCount} sessions for cashier:`, cashierId);
      return closedCount;
    } catch (error) {
      console.error('❌ [POS Session] Error force closing sessions:', error);
      throw error;
    }
  }
}

export const posSessionService = new POSSessionService();
