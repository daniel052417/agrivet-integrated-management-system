import { supabase } from './supabase';

export interface POSTransaction {
  id: string;
  transaction_number: string;
  pos_session_id: string;
  customer_id?: string;
  cashier_id: string;
  branch_id: string;
  transaction_date: string;
  transaction_type: 'sale' | 'return' | 'refund';
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'active' | 'void' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
  weight_kg?: number;
  expiry_date?: string;
  batch_number?: string;
  created_at: string;
}

export interface POSPayment {
  id: string;
  transaction_id: string;
  payment_method: 'cash' | 'gcash' | 'paymaya' | 'card' | 'bank_transfer';
  payment_type?: string;
  amount: number;
  change_given: number;
  reference_number?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_at?: string;
  created_at: string;
}

export interface POSSession {
  id: string;
  cashier_id: string;
  branch_id?: string;
  session_number: string;
  opened_at: string;
  closed_at?: string;
  starting_cash: number;
  ending_cash?: number;
  total_sales: number;
  total_transactions: number;
  status: 'open' | 'closed' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
  terminal_id?: string;
  session_type: 'sale' | 'return' | 'refund';
  total_returns: number;
  total_taxes: number;
  closed_by?: string;
  cash_variance?: number;
  session_duration?: string;
}

export interface CreateTransactionData {
  pos_session_id: string;
  customer_id?: string;
  cashier_id: string;
  branch_id: string;
  items: {
    product_id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_of_measure: string;
    unit_price: number;
    discount_amount?: number;
    discount_percentage?: number;
    line_total: number;
    weight_kg?: number;
    expiry_date?: string;
    batch_number?: string;
  }[];
  subtotal: number;
  discount_amount?: number;
  discount_percentage?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  payment_method: 'cash' | 'gcash' | 'paymaya' | 'card' | 'bank_transfer';
  cash_amount?: number;
  reference_number?: string;
  transaction_source?: string;
  order_id?: string;
}

export class POSTransactionService {
  /**
   * Generate a unique transaction number
   */
  static generateTransactionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `TXN-${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Create a new POS transaction with items and payment
   */
  static async createTransaction(data: CreateTransactionData): Promise<{
    transaction: POSTransaction;
    items: POSTransactionItem[];
    payment: POSPayment;
  }> {
    try {
      const transactionNumber = this.generateTransactionNumber();
      
      // Start a transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('pos_transactions')
        .insert({
          transaction_number: transactionNumber,
          pos_session_id: data.pos_session_id,
          customer_id: data.customer_id,
          cashier_id: data.cashier_id,
          branch_id: data.branch_id,
          transaction_type: 'sale',
          subtotal: data.subtotal,
          tax_amount: data.tax_amount || 0,
          total_amount: data.total_amount,
          payment_status: 'completed',
          status: 'active',
          notes: data.notes
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error(`Failed to create transaction: ${transactionError.message}`);
      }

      // Create transaction items
      const transactionItems = data.items.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_of_measure: item.unit_of_measure,
        unit_price: item.unit_price,
        line_total: item.line_total,
        weight_kg: item.weight_kg,
        expiry_date: item.expiry_date,
        batch_number: item.batch_number
      }));

      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .insert(transactionItems)
        .select();

      if (itemsError) {
        // Rollback transaction if items creation fails
        await supabase.from('pos_transactions').delete().eq('id', transaction.id);
        throw new Error(`Failed to create transaction items: ${itemsError.message}`);
      }

      // Calculate change for cash payments
      const changeGiven = data.payment_method === 'cash' && data.cash_amount 
        ? data.cash_amount - data.total_amount 
        : 0;

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('pos_payments')
        .insert({
          transaction_id: transaction.id,
          payment_method: data.payment_method,
          payment_type: data.payment_method === 'cash' ? 'cash' : 'digital',
          amount: data.total_amount,
          change_given: changeGiven,
          reference_number: data.reference_number,
          payment_status: 'completed',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        // Rollback transaction and items if payment creation fails
        await supabase.from('pos_transaction_items').delete().eq('transaction_id', transaction.id);
        await supabase.from('pos_transactions').delete().eq('id', transaction.id);
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }

      return {
        transaction,
        items: items || [],
        payment
      };
    } catch (error) {
      console.error('Error creating POS transaction:', error);
      throw error;
    }
  }

  /**
   * Update POS session totals after successful transaction
   */
  static async updatePOSSessionAfterTransaction(
    sessionId: string,
    transactionData: {
      total_amount: number;
      discount_amount: number;
      tax_amount: number;
    }
  ): Promise<void> {
    try {
      // Get current session data
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('total_sales, total_transactions, total_taxes')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error(`Failed to get session ${sessionId}:`, sessionError);
        return;
      }

      // Calculate new totals
      const newTotalSales = (session.total_sales || 0) + transactionData.total_amount;
      const newTotalTransactions = (session.total_transactions || 0) + 1;
      const newTotalTaxes = (session.total_taxes || 0) + (transactionData.tax_amount || 0);

      // Update session
      const { error: updateError } = await supabase
        .from('pos_sessions')
        .update({
          total_sales: newTotalSales,
          total_transactions: newTotalTransactions,
          total_taxes: newTotalTaxes,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error(`Failed to update session ${sessionId}:`, updateError);
      } else {
        console.log(`Updated session ${sessionId} totals:`, {
          total_sales: newTotalSales,
          total_transactions: newTotalTransactions,
          total_taxes: newTotalTaxes
        });
      }
    } catch (error) {
      console.error('Error updating POS session:', error);
    }
  }

  /**
   * Update inventory after successful transaction
   */
  static async updateInventoryAfterTransaction(
    branchId: string, 
    items: { product_id: string; quantity: number }[]
  ): Promise<void> {
    try {
      for (const item of items) {
        // Get current inventory
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .eq('branch_id', branchId)
          .eq('product_id', item.product_id)
          .single();

        if (inventoryError) {
          console.error(`Inventory not found for product ${item.product_id}:`, inventoryError);
          continue;
        }

        // Calculate new quantities
        const newQuantityOnHand = Math.max(0, inventory.quantity_on_hand - item.quantity);

        // Update inventory (quantity_available is auto-calculated as quantity_on_hand - quantity_reserved)
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity_on_hand: newQuantityOnHand,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventory.id);

        if (updateError) {
          console.error(`Failed to update inventory for product ${item.product_id}:`, updateError);
        } else {
          console.log(`Updated inventory for product ${item.product_id}: ${inventory.quantity_on_hand} -> ${newQuantityOnHand} (quantity_available auto-calculated)`);
        }
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(transactionId: string): Promise<{
    transaction: POSTransaction;
    items: POSTransactionItem[];
    payment: POSPayment;
  } | null> {
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (transactionError) {
        throw new Error(`Failed to get transaction: ${transactionError.message}`);
      }

      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select('*')
        .eq('transaction_id', transactionId);

      if (itemsError) {
        throw new Error(`Failed to get transaction items: ${itemsError.message}`);
      }

      const { data: payment, error: paymentError } = await supabase
        .from('pos_payments')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (paymentError) {
        throw new Error(`Failed to get payment: ${paymentError.message}`);
      }

      return {
        transaction,
        items: items || [],
        payment
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Get transactions for a specific session
   */
  static async getSessionTransactions(sessionId: string): Promise<POSTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('pos_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get session transactions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting session transactions:', error);
      return [];
    }
  }

  /**
   * Void a transaction
   */
  static async voidTransaction(transactionId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pos_transactions')
        .update({
          status: 'void',
          notes: reason ? `VOIDED: ${reason}` : 'VOIDED',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) {
        throw new Error(`Failed to void transaction: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error voiding transaction:', error);
      return false;
    }
  }
}
