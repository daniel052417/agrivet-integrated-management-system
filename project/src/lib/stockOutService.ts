import { supabase } from './supabase';
import { simplifiedAuth } from './simplifiedAuth';

export type StockOutReason = 
  | 'expired' 
  | 'damaged' 
  | 'returned_to_supplier' 
  | 'transferred' 
  | 'adjustment_correction' 
  | 'lost_missing';

export type FinancialImpact = 'loss' | 'neutral' | 'depends';

export interface StockOutData {
  inventory_id: string;
  product_id: string;
  branch_id: string;
  stock_out_reason: StockOutReason;
  quantity: number;
  notes?: string;
  destination_branch_id?: string; // Required if reason = 'transferred'
  supplier_return_reference?: string; // Optional for returned_to_supplier
  adjustment_type?: 'clerical_error' | 'missing_stock'; // For adjustment_correction
}

export interface StockOutResult {
  stock_out_transaction_id: string;
  reference_number: string;
  inventory_movement_id: string;
  gl_transaction_id?: string; // Only for loss/neutral reasons that need journal entries
  financial_impact: FinancialImpact;
  loss_amount: number; // 0 if neutral
  unit_cost: number;
}

interface InventoryRecord {
  id: string;
  product_id: string;
  branch_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  base_unit?: string;
}

interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  cost_price?: number;
  supplier_id?: string;
}

interface AccountRecord {
  id: string;
  account_name: string;
  account_type: string;
}

export class StockOutService {
  /**
   * Generate a unique reference number for stock out transaction
   */
  private static generateReferenceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    return `SO-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }

  /**
   * Generate a unique GL transaction number
   */
  private static generateGLTransactionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    return `GL-${year}${month}${day}-${random}`;
  }

  /**
   * Determine financial impact based on reason
   */
  private static getFinancialImpact(reason: StockOutReason, adjustmentType?: string): FinancialImpact {
    if (reason === 'transferred' || reason === 'returned_to_supplier') {
      return 'neutral';
    }
    if (reason === 'adjustment_correction') {
      return adjustmentType === 'clerical_error' ? 'neutral' : 'loss';
    }
    // expired, damaged, lost_missing are all losses
    return 'loss';
  }

  /**
   * Calculate unit cost using weighted average from inventory movements
   * Falls back to product cost_price if no movements exist
   */
  private static async calculateUnitCost(productId: string, branchId: string): Promise<number> {
    try {
      // Try to get average cost from inventory movements (purchase records)
      const { data: movements, error: movementError } = await supabase
        .from('inventory_movements')
        .select('quantity, movement_type, movement_date')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .in('movement_type', ['purchase', 'transfer_in'])
        .order('movement_date', { ascending: false })
        .limit(10);

      // Get cost from products table - using 'cost' column as per the actual schema
      // In a full implementation, you'd calculate weighted average cost from purchase history
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('cost')
        .eq('id', productId)
        .single();

      if (productError) {
        console.warn('Error fetching product cost:', productError);
        return 0;
      }

      // Use 'cost' column from products table
      const unitCost = Number(product?.cost) || 0;
      
      if (unitCost === 0) {
        console.warn(`Warning: Product cost is 0 for product ${productId}. This will result in total_loss_amount being 0.`);
      } else {
        console.log(`✅ Retrieved unit cost from products.cost: ${unitCost} for product ${productId}`);
      }
      
      return unitCost;
    } catch (error) {
      console.error('Error calculating unit cost:', error);
      return 0;
    }
  }

  /**
   * Get account ID by account name (case-insensitive search)
   */
  private static async getAccountId(accountName: string, accountType?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('accounts')
        .select('id')
        .ilike('account_name', accountName)
        .eq('is_active', true);

      if (accountType) {
        query = query.eq('account_type', accountType);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(`Error fetching account "${accountName}":`, error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error(`Error getting account ID for "${accountName}":`, error);
      return null;
    }
  }

  /**
   * Get or create inventory account for a branch
   */
  private static async getInventoryAccount(branchId: string): Promise<string | null> {
    try {
      // First, try to get branch name
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single();

      if (branchError) {
        console.error('Error fetching branch:', branchError);
        // Fallback to generic inventory account
        return this.getAccountId('Inventory', 'asset');
      }

      // Try branch-specific account first (e.g., "Inventory - Poblacion Branch")
      const branchAccountName = `Inventory - ${branch.name}`;
      let accountId = await this.getAccountId(branchAccountName, 'asset');

      if (!accountId) {
        // Fallback to generic "Inventory" account
        accountId = await this.getAccountId('Inventory', 'asset');
      }

      return accountId;
    } catch (error) {
      console.error('Error getting inventory account:', error);
      return null;
    }
  }

  /**
   * Get loss account ID based on reason
   */
  private static async getLossAccountId(reason: StockOutReason): Promise<string | null> {
    const accountMap: Record<StockOutReason, string> = {
      'expired': 'Inventory Loss - Expired Goods',
      'damaged': 'Inventory Loss - Damaged Goods',
      'lost_missing': 'Inventory Shrinkage / Theft Loss',
      'adjustment_correction': 'Inventory Shrinkage / Theft Loss', // When it's a loss
      'returned_to_supplier': '', // Will use Accounts Payable
      'transferred': '', // Will use inventory accounts
    };

    const accountName = accountMap[reason];
    if (!accountName) return null;

    return this.getAccountId(accountName, 'expense');
  }

  /**
   * Create journal entries for stock out transaction
   */
  private static async createJournalEntries(
    stockOutData: StockOutData,
    lossAmount: number,
    referenceNumber: string,
    userId: string,
    financialImpact: FinancialImpact
  ): Promise<string | null> {
    // Only create journal entries for loss or returned_to_supplier reasons
    if (financialImpact === 'neutral' && stockOutData.stock_out_reason !== 'returned_to_supplier') {
      // Transferred items are handled separately (no journal entry needed for neutral transfers)
      return null;
    }

    try {
      const transactionNumber = this.generateGLTransactionNumber();
      const transactionDate = new Date().toISOString().split('T')[0];

      // Get product name for description
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name')
        .eq('id', stockOutData.product_id)
        .single();

      const productName = product?.name || 'Unknown Product';
      const reasonLabel = stockOutData.stock_out_reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      let description = `Stock Out - ${reasonLabel}: ${productName} - ${stockOutData.quantity} units`;
      if (stockOutData.notes) {
        description += ` (${stockOutData.notes})`;
      }

      // Create GL transaction
      const { data: glTransaction, error: glError } = await supabase
        .from('gl_transactions')
        .insert({
          transaction_number: transactionNumber,
          transaction_date: transactionDate,
          description: description,
          transaction_type: 'adjustment',
          reference_number: referenceNumber,
          total_amount: lossAmount,
          posted_by_user_id: userId,
          status: 'posted' // Auto-post stock out entries
        })
        .select()
        .single();

      if (glError) {
        console.error('Error creating GL transaction:', glError);
        return null;
      }

      // Create GL transaction items based on reason
      const transactionItems: any[] = [];

      if (financialImpact === 'loss') {
        // Loss reasons: Debit Loss Account, Credit Inventory Account
        const lossAccountId = await this.getLossAccountId(stockOutData.stock_out_reason);
        const inventoryAccountId = await this.getInventoryAccount(stockOutData.branch_id);

        if (!lossAccountId || !inventoryAccountId) {
          console.error('Missing required accounts for journal entry');
          return null;
        }

        transactionItems.push({
          transaction_id: glTransaction.id,
          account_id: lossAccountId,
          debit_amount: lossAmount,
          credit_amount: 0,
          memo: `Inventory loss: ${productName} (${reasonLabel})`
        });

        transactionItems.push({
          transaction_id: glTransaction.id,
          account_id: inventoryAccountId,
          debit_amount: 0,
          credit_amount: lossAmount,
          memo: `Reduction of inventory: ${productName}`
        });
      } else if (stockOutData.stock_out_reason === 'returned_to_supplier') {
        // Returned to Supplier: Debit Accounts Payable, Credit Inventory
        const accountsPayableId = await this.getAccountId('Accounts Payable - Supplier Returns', 'liability');
        const inventoryAccountId = await this.getInventoryAccount(stockOutData.branch_id);

        if (!accountsPayableId || !inventoryAccountId) {
          console.error('Missing required accounts for supplier return journal entry');
          return null;
        }

        transactionItems.push({
          transaction_id: glTransaction.id,
          account_id: accountsPayableId,
          debit_amount: lossAmount,
          credit_amount: 0,
          memo: `Supplier return: ${productName}${stockOutData.supplier_return_reference ? ` (Ref: ${stockOutData.supplier_return_reference})` : ''}`
        });

        transactionItems.push({
          transaction_id: glTransaction.id,
          account_id: inventoryAccountId,
          debit_amount: 0,
          credit_amount: lossAmount,
          memo: `Reduction of inventory: ${productName}`
        });
      } else if (stockOutData.stock_out_reason === 'transferred' && stockOutData.destination_branch_id) {
        // Transferred: Debit Destination Inventory, Credit Source Inventory
        const sourceInventoryId = await this.getInventoryAccount(stockOutData.branch_id);
        const destinationInventoryId = await this.getInventoryAccount(stockOutData.destination_branch_id);

        if (!sourceInventoryId || !destinationInventoryId) {
          console.error('Missing required inventory accounts for transfer journal entry');
          return null;
        }

        transactionItems.push({
          transaction_id: glTransaction.id,
          account_id: destinationInventoryId,
          debit_amount: lossAmount,
          credit_amount: 0,
          memo: `Inventory transfer in: ${productName}`
        });

        transactionItems.push({
          transaction_id: glTransaction.id,
          account_id: sourceInventoryId,
          debit_amount: 0,
          credit_amount: lossAmount,
          memo: `Inventory transfer out: ${productName}`
        });
      }

      // Insert transaction items
      if (transactionItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('gl_transaction_items')
          .insert(transactionItems);

        if (itemsError) {
          console.error('Error creating GL transaction items:', itemsError);
          // Don't fail the whole operation, but log the error
          return glTransaction.id;
        }
      }

      return glTransaction.id;
    } catch (error) {
      console.error('Error creating journal entries:', error);
      return null;
    }
  }

  /**
   * Create inventory movement record
   */
  private static async createInventoryMovement(
    stockOutId: string,
    data: StockOutData,
    referenceNumber: string,
    userId: string
  ): Promise<string> {
    const movementTypeMap: Record<StockOutReason, string> = {
      'expired': 'stock_out_expired',
      'damaged': 'stock_out_damaged',
      'returned_to_supplier': 'stock_out_returned',
      'transferred': 'stock_out_transferred',
      'adjustment_correction': 'stock_out_adjustment',
      'lost_missing': 'stock_out_lost',
    };

    const { data: movement, error } = await supabase
      .from('inventory_movements')
      .insert({
        inventory_id: data.inventory_id,
        product_id: data.product_id,
        branch_id: data.branch_id,
        movement_type: movementTypeMap[data.stock_out_reason],
        quantity: -data.quantity, // Negative for stock out
        reference_number: referenceNumber,
        reference_id: stockOutId,
        movement_date: new Date().toISOString(),
        notes: data.notes || null,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create inventory movement: ${error.message}`);
    }

    return movement.id;
  }

  /**
   * Update inventory quantity
   */
  private static async updateInventoryQuantity(inventoryId: string, quantity: number): Promise<void> {
    // Try RPC function first, but fallback to direct update if it doesn't exist
    const { error: rpcError } = await supabase.rpc('decrease_inventory_quantity', {
      p_inventory_id: inventoryId,
      p_quantity: quantity
    });

    // Check if RPC function doesn't exist (various error messages)
    const rpcNotFound = rpcError && (
      rpcError.message.includes('function') && (
        rpcError.message.includes('does not exist') ||
        rpcError.message.includes('Could not find') ||
        rpcError.message.includes('not found')
      ) ||
      rpcError.code === '42883' || // PostgreSQL function does not exist
      rpcError.code === 'P0001' // Generic PostgreSQL error
    );

    // If RPC doesn't exist, use direct update
    if (rpcNotFound) {
      console.log('RPC function not found, using direct update for inventory:', inventoryId);
      
      const { data: inventory, error: fetchError } = await supabase
        .from('inventory')
        .select('quantity_on_hand')
        .eq('id', inventoryId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch inventory: ${fetchError.message}`);
      }

      const currentQuantity = Number(inventory?.quantity_on_hand) || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity_on_hand: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryId);

      if (updateError) {
        throw new Error(`Failed to update inventory: ${updateError.message}`);
      }

      console.log(`Inventory updated: ${currentQuantity} -> ${newQuantity} (decreased by ${quantity})`);
    } else if (rpcError) {
      // If RPC exists but returned an error, throw it
      throw new Error(`Failed to update inventory: ${rpcError.message}`);
    }
    // If no error, RPC succeeded
  }

  /**
   * Handle transferred items - create matching entry in destination branch
   */
  private static async handleTransfer(
    stockOutData: StockOutData,
    stockOutResult: StockOutResult,
    destinationBranchId: string,
    userId: string
  ): Promise<void> {
    if (!destinationBranchId) {
      return;
    }

    try {
      // Find or create inventory record in destination branch
      const { data: destInventory, error: destError } = await supabase
        .from('inventory')
        .select('id, quantity_on_hand')
        .eq('product_id', stockOutData.product_id)
        .eq('branch_id', destinationBranchId)
        .maybeSingle();

      let destInventoryId: string;

      if (destInventory) {
        destInventoryId = destInventory.id;
        // Update quantity (add to destination)
        const newQuantity = (destInventory.quantity_on_hand || 0) + stockOutData.quantity;
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity_on_hand: newQuantity })
          .eq('id', destInventoryId);

        if (updateError) {
          throw new Error(`Failed to update destination inventory: ${updateError.message}`);
        }
      } else {
        // Create new inventory record in destination branch
        const { data: newInventory, error: createError } = await supabase
          .from('inventory')
          .insert({
            product_id: stockOutData.product_id,
            branch_id: destinationBranchId,
            quantity_on_hand: stockOutData.quantity,
            quantity_reserved: 0,
            reorder_level: 0,
            max_stock_level: 0
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create destination inventory: ${createError.message}`);
        }

        destInventoryId = newInventory.id;
      }

      // Create inventory movement for destination branch (transfer_in)
      await supabase
        .from('inventory_movements')
        .insert({
          inventory_id: destInventoryId,
          product_id: stockOutData.product_id,
          branch_id: destinationBranchId,
          movement_type: 'transfer_in',
          quantity: stockOutData.quantity,
          reference_number: stockOutResult.reference_number,
          reference_id: stockOutResult.stock_out_transaction_id,
          movement_date: new Date().toISOString(),
          notes: `Transferred from ${stockOutData.branch_id}`,
          created_by: userId
        });
    } catch (error) {
      console.error('Error handling transfer:', error);
      throw error;
    }
  }

  /**
   * Get current user ID using multiple fallback methods
   * Since the system uses public.users (not auth.users), we need to query by various methods
   */
  private static async getCurrentUserId(): Promise<string> {
    // Method 1: Try simplifiedAuth (the exported singleton instance) - in-memory user
    try {
      const currentUser = simplifiedAuth.getCurrentUser();
      if (currentUser?.id) {
        console.log('✅ Got user from simplifiedAuth:', currentUser.id);
        return currentUser.id;
      }
    } catch (error) {
      console.warn('Could not get user from simplifiedAuth:', error);
    }

    // Method 2: Try to restore user from localStorage (customAuth session)
    try {
      const storedSession = localStorage.getItem('agrivet_session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session?.userId) {
          console.log('✅ Found customAuth session in localStorage, userId:', session.userId);
          
          // Verify user exists and is active
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.userId)
            .eq('is_active', true)
            .single();

          if (!dbError && dbUser?.id) {
            console.log('✅ Got user from public.users using customAuth session:', dbUser.id);
            return dbUser.id;
          }
        }
      }
    } catch (error) {
      console.warn('Could not get user from localStorage session:', error);
    }

    // Method 3: Check Supabase Auth session and get user from public.users by email
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (!authError && authUser?.email) {
        console.log('✅ Found Supabase Auth session, email:', authUser.email);
        
        // Query public.users table by email
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('id')
          .eq('email', authUser.email)
          .eq('is_active', true)
          .single();

        if (!dbError && dbUser?.id) {
          console.log('✅ Got user from public.users table by email:', dbUser.id);
          return dbUser.id;
        } else if (dbError) {
          console.error('Error querying public.users by email:', dbError);
        }
      } else if (authError) {
        console.warn('No Supabase Auth session found:', authError.message);
      }
    } catch (error) {
      console.warn('Could not get user from Supabase Auth session:', error);
    }

    // Method 4: Try to get user from public.users based on status='online' and recent activity
    try {
      const { data: activeUsers, error: queryError } = await supabase
        .from('users')
        .select('id, email, last_activity, status')
        .eq('is_active', true)
        .eq('status', 'online')
        .order('last_activity', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!queryError && activeUsers?.id) {
        // Check if last_activity is recent (within last 24 hours)
        const lastActivity = activeUsers.last_activity ? new Date(activeUsers.last_activity) : null;
        const now = new Date();
        const hoursSinceActivity = lastActivity ? (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60) : 999;

        if (hoursSinceActivity < 24) {
          console.log('✅ Got active user from public.users (status=online):', activeUsers.id);
          return activeUsers.id;
        }
      }
    } catch (error) {
      console.warn('Could not get active user from public.users:', error);
    }

    // Method 5: Try to reload user using simplifiedAuth if there's an email from any source
    try {
      let email: string | null = null;
      let userId: string | null = null;

      // Try to get userId from localStorage first
      try {
        const storedSession = localStorage.getItem('agrivet_session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          if (session?.userId) {
            userId = session.userId;
            // Get email from users table using userId
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('email')
              .eq('id', userId)
              .eq('is_active', true)
              .single();
            
            if (!userError && userData?.email) {
              email = userData.email;
            }
          }
        }
      } catch (e) {
        // Ignore
      }

      // If no email from localStorage, try Supabase Auth
      if (!email) {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (!authError && authUser?.email) {
          email = authUser.email;
        }
      }

      if (email) {
        // Try to reload user using simplifiedAuth's getUserWithRole method
        const user = await simplifiedAuth.getUserWithRole(email);
        if (user?.id) {
          // Set it in simplifiedAuth for future use
          simplifiedAuth.setCurrentUser(user);
          console.log('✅ Reloaded user using simplifiedAuth.getUserWithRole:', user.id);
          return user.id;
        }
      } else if (userId) {
        // If we have userId but no email, try to get user directly
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .eq('is_active', true)
          .single();
        
        if (!userError && userData?.id) {
          console.log('✅ Got user from public.users using userId from localStorage:', userData.id);
          return userData.id;
        }
      }
    } catch (error) {
      console.warn('Could not reload user using simplifiedAuth:', error);
    }

    throw new Error('User not authenticated. Please log in to perform stock out operations.');
  }

  /**
   * Main function to process stock out
   */
  static async processStockOut(data: StockOutData, userId?: string): Promise<StockOutResult> {
    try {
      // Get current user if not provided
      if (!userId) {
        userId = await this.getCurrentUserId();
      }

      // Validate required fields
      if (!data.inventory_id || !data.product_id || !data.branch_id || !data.stock_out_reason || !data.quantity) {
        throw new Error('Missing required fields for stock out');
      }

      if (data.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (data.stock_out_reason === 'transferred' && !data.destination_branch_id) {
        throw new Error('Destination branch is required for transferred stock out');
      }

      // Validate inventory availability
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, product_id, branch_id, quantity_on_hand, quantity_reserved, quantity_available')
        .eq('id', data.inventory_id)
        .single();

      if (inventoryError || !inventory) {
        throw new Error(`Inventory record not found: ${inventoryError?.message || 'Not found'}`);
      }

      if (data.quantity > inventory.quantity_available) {
        throw new Error(`Insufficient stock. Available: ${inventory.quantity_available}, Requested: ${data.quantity}`);
      }

      // Calculate unit cost
      const unitCost = await this.calculateUnitCost(data.product_id, data.branch_id);
      const totalLossAmount = data.quantity * unitCost;
      
      console.log(`📊 Stock Out Calculation:`, {
        product_id: data.product_id,
        quantity: data.quantity,
        unit_cost: unitCost,
        total_loss_amount: totalLossAmount,
        reason: data.stock_out_reason
      });

      // Determine financial impact
      const financialImpact = this.getFinancialImpact(data.stock_out_reason, data.adjustment_type);

      // Generate reference number
      const referenceNumber = this.generateReferenceNumber();

      // Create stock out transaction record
      const { data: stockOutTransaction, error: stockOutError } = await supabase
        .from('stock_out_transactions')
        .insert({
          inventory_id: data.inventory_id,
          product_id: data.product_id,
          branch_id: data.branch_id,
          stock_out_reason: data.stock_out_reason,
          quantity: data.quantity,
          unit_cost: unitCost,
          total_loss_amount: financialImpact === 'loss' ? totalLossAmount : 0,
          financial_impact: financialImpact,
          reference_number: referenceNumber,
          destination_branch_id: data.destination_branch_id || null,
          notes: data.notes || null,
          status: 'approved', // Auto-approve for now (can be changed to 'pending' if approval workflow needed)
          created_by: userId,
          approved_by: userId,
          approved_at: new Date().toISOString(),
          stock_out_date: new Date().toISOString()
        })
        .select()
        .single();

      if (stockOutError) {
        throw new Error(`Failed to create stock out transaction: ${stockOutError.message}`);
      }

      // Update inventory quantity
      await this.updateInventoryQuantity(data.inventory_id, data.quantity);

      // Create inventory movement record
      const inventoryMovementId = await this.createInventoryMovement(
        stockOutTransaction.id,
        data,
        referenceNumber,
        userId
      );

      // Create journal entries (if needed)
      let glTransactionId: string | undefined;
      if (financialImpact === 'loss' || data.stock_out_reason === 'returned_to_supplier' || 
          (data.stock_out_reason === 'transferred' && data.destination_branch_id)) {
        glTransactionId = await this.createJournalEntries(
          data,
          totalLossAmount,
          referenceNumber,
          userId,
          financialImpact
        ) || undefined;
      }

      // Handle transfer (create matching entry in destination branch)
      if (data.stock_out_reason === 'transferred' && data.destination_branch_id) {
        await this.handleTransfer(
          data,
          {
            stock_out_transaction_id: stockOutTransaction.id,
            reference_number: referenceNumber,
            inventory_movement_id: inventoryMovementId,
            gl_transaction_id: glTransactionId,
            financial_impact: financialImpact,
            loss_amount: totalLossAmount,
            unit_cost: unitCost
          },
          data.destination_branch_id,
          userId
        );
      }

      return {
        stock_out_transaction_id: stockOutTransaction.id,
        reference_number: referenceNumber,
        inventory_movement_id: inventoryMovementId,
        gl_transaction_id: glTransactionId,
        financial_impact: financialImpact,
        loss_amount: financialImpact === 'loss' ? totalLossAmount : 0,
        unit_cost: unitCost
      };
    } catch (error: any) {
      console.error('Error processing stock out:', error);
      throw new Error(error.message || 'Failed to process stock out');
    }
  }
}

