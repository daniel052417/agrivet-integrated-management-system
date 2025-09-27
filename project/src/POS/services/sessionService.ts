import POSDatabaseService from './databaseService';
import { POSSession, User } from '../../types/pos';

export class POSSessionService {
  
  /**
   * Initialize or get existing POS session for cashier
   */
  static async initializeSession(cashier: User, branchId?: string): Promise<POSSession> {
    try {
      const session = await POSDatabaseService.getOrCreatePOSSession(cashier.id, branchId);
      
      // Log session initialization
      await POSDatabaseService.logPOSAction({
        session_id: session.id,
        action: 'session_initialized',
        entity_type: 'pos_session',
        entity_id: session.id,
        cashier_id: cashier.id,
        new_value: JSON.stringify({
          session_number: session.session_number,
          cashier_id: cashier.id,
          branch_id: branchId
        })
      });

      return session;
    } catch (error) {
      console.error('Error initializing POS session:', error);
      throw error;
    }
  }

  /**
   * Close POS session
   */
  static async closeSession(sessionId: string, endingCash: number, cashierId: string): Promise<POSSession> {
    try {
      const session = await POSDatabaseService.closePOSSession(sessionId, endingCash);
      
      // Log session closure
      await POSDatabaseService.logPOSAction({
        session_id: sessionId,
        action: 'session_closed',
        entity_type: 'pos_session',
        entity_id: sessionId,
        cashier_id: cashierId,
        new_value: JSON.stringify({
          ending_cash: endingCash,
          total_sales: session.total_sales,
          total_transactions: session.total_transactions
        })
      });

      return session;
    } catch (error) {
      console.error('Error closing POS session:', error);
      throw error;
    }
  }

  /**
   * Suspend POS session
   */
  static async suspendSession(sessionId: string, cashierId: string, notes?: string): Promise<POSSession> {
    try {
      const session = await POSDatabaseService.updatePOSSession(sessionId, {
        status: 'suspended',
        notes: notes
      });
      
      // Log session suspension
      await POSDatabaseService.logPOSAction({
        session_id: sessionId,
        action: 'session_suspended',
        entity_type: 'pos_session',
        entity_id: sessionId,
        cashier_id: cashierId,
        new_value: JSON.stringify({
          status: 'suspended',
          notes: notes
        })
      });

      return session;
    } catch (error) {
      console.error('Error suspending POS session:', error);
      throw error;
    }
  }

  /**
   * Resume suspended POS session
   */
  static async resumeSession(sessionId: string, cashierId: string): Promise<POSSession> {
    try {
      const session = await POSDatabaseService.updatePOSSession(sessionId, {
        status: 'open'
      });
      
      // Log session resumption
      await POSDatabaseService.logPOSAction({
        session_id: sessionId,
        action: 'session_resumed',
        entity_type: 'pos_session',
        entity_id: sessionId,
        cashier_id: cashierId,
        new_value: JSON.stringify({
          status: 'open'
        })
      });

      return session;
    } catch (error) {
      console.error('Error resuming POS session:', error);
      throw error;
    }
  }

  /**
   * Update session starting cash
   */
  static async updateStartingCash(sessionId: string, startingCash: number, cashierId: string): Promise<POSSession> {
    try {
      const session = await POSDatabaseService.updatePOSSession(sessionId, {
        starting_cash: startingCash
      });
      
      // Log cash update
      await POSDatabaseService.logPOSAction({
        session_id: sessionId,
        action: 'starting_cash_updated',
        entity_type: 'pos_session',
        entity_id: sessionId,
        cashier_id: cashierId,
        new_value: JSON.stringify({
          starting_cash: startingCash
        })
      });

      return session;
    } catch (error) {
      console.error('Error updating starting cash:', error);
      throw error;
    }
  }

  /**
   * Get session summary
   */
  static async getSessionSummary(sessionId: string) {
    try {
      const session = await POSDatabaseService.getSessionSalesSummary(sessionId);
      const topProducts = await POSDatabaseService.getTopSellingProducts(sessionId, 5);
      
      return {
        session,
        topProducts
      };
    } catch (error) {
      console.error('Error getting session summary:', error);
      throw error;
    }
  }

  /**
   * Check if cashier has open session
   */
  static async hasOpenSession(cashierId: string): Promise<POSSession | null> {
    try {
      const session = await POSDatabaseService.getOrCreatePOSSession(cashierId);
      return session.status === 'open' ? session : null;
    } catch (error) {
      console.error('Error checking open session:', error);
      return null;
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(sessionId: string) {
    try {
      const summary = await this.getSessionSummary(sessionId);
      
      const totalSales = summary.session.reduce((sum, transaction) => sum + transaction.total_amount, 0);
      const totalTransactions = summary.session.length;
      const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      
      // Calculate payment method breakdown
      const paymentMethods: { [key: string]: { count: number; total: number } } = {};
      summary.session.forEach(transaction => {
        transaction.pos_payments?.forEach(payment => {
          const method = payment.payment_method === 'digital' && payment.payment_type 
            ? payment.payment_type 
            : payment.payment_method;
          
          if (paymentMethods[method]) {
            paymentMethods[method].count += 1;
            paymentMethods[method].total += payment.amount;
          } else {
            paymentMethods[method] = {
              count: 1,
              total: payment.amount
            };
          }
        });
      });

      return {
        totalSales,
        totalTransactions,
        averageTransaction,
        topProducts: summary.topProducts,
        paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
          payment_method: method,
          count: data.count,
          total_amount: data.total
        }))
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw error;
    }
  }

  /**
   * Validate session access
   */
  static async validateSessionAccess(sessionId: string, cashierId: string): Promise<boolean> {
    try {
      const session = await POSDatabaseService.getOrCreatePOSSession(cashierId);
      return session.id === sessionId && session.cashier_id === cashierId;
    } catch (error) {
      console.error('Error validating session access:', error);
      return false;
    }
  }
}

export default POSSessionService;
