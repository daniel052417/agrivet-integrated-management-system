import { supabase } from '../../lib/supabase';

// Database service for POS operations
export class POSDatabaseService {
  
  // ===== PRODUCTS =====
  
  /**
   * Get all active products for POS display
   */
  static async getProducts(filters?: {
    categoryId?: string;
    searchTerm?: string;
    inStockOnly?: boolean;
    quickSaleOnly?: boolean;
    branchId?: string;
  }) {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        inventory:inventory!product_id (
          id,
          branch_id,
          product_id,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          reorder_level,
          max_stock_level,
          last_counted,
          updated_at,
          base_unit
        )
      `)
      .eq('is_active', true);

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
    }

    // Note: quickSaleOnly filter not available in current schema
    // if (filters?.quickSaleOnly) {
    //   query = query.eq('is_quick_sale', true);
    // }

    const { data, error } = await query.order('name');

    if (error) throw error;
    
    let products = data || [];
    
    // Filter by stock if needed
    if (filters?.inStockOnly) {
      products = products.filter(product => 
        product.inventory && product.inventory.quantity_available > 0
      );
    }
    
    // Filter by branch if specified
    if (filters?.branchId) {
      products = products.filter(product => 
        product.inventory && product.inventory.branch_id === filters.branchId
      );
    }
    
    return products;
  }

  /**
   * Get all active product variants for POS display (backward compatibility)
   * This now maps to getProducts since we're using the products table
   */
  static async getProductVariants(filters?: {
    categoryId?: string;
    searchTerm?: string;
    inStockOnly?: boolean;
    quickSaleOnly?: boolean;
    branchId?: string;
  }) {
    return this.getProducts(filters);
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string, branchId?: string) {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        inventory:inventory!product_id (
          id,
          branch_id,
          product_id,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          reorder_level,
          max_stock_level,
          last_counted,
          updated_at,
          base_unit
        )
      `)
      .eq('id', id)
      .eq('is_active', true);

    if (branchId) {
      query = query.eq('inventory.branch_id', branchId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  }

  /**
   * Get product variant by ID (backward compatibility)
   * This now maps to getProductById since we're using the products table
   */
  static async getProductVariantById(id: string, branchId?: string) {
    return this.getProductById(id, branchId);
  }

  /**
   * Get product by barcode
   */
  static async getProductByBarcode(barcode: string, branchId?: string) {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        inventory:inventory!product_id (
          id,
          branch_id,
          product_id,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          reorder_level,
          max_stock_level,
          last_counted,
          updated_at,
          base_unit
        )
      `)
      .eq('barcode', barcode)
      .eq('is_active', true);

    if (branchId) {
      query = query.eq('inventory.branch_id', branchId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  }

  /**
   * Get product variant by barcode (backward compatibility)
   * This now maps to getProductByBarcode since we're using the products table
   */
  static async getProductVariantByBarcode(barcode: string, branchId?: string) {
    return this.getProductByBarcode(barcode, branchId);
  }

  /**
   * Update inventory quantity for a product
   */
  static async updateInventoryQuantity(productId: string, branchId: string, newQuantity: number) {
    const { error } = await supabase
      .from('inventory')
      .update({ 
        quantity_on_hand: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('branch_id', branchId);

    if (error) throw error;
  }

  /**
   * Get inventory for a product at a specific branch
   */
  static async getInventory(productId: string, branchId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create inventory record for a product
   */
  static async createInventory(productId: string, branchId: string, initialQuantity: number = 0) {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        product_id: productId,
        branch_id: branchId,
        quantity_on_hand: initialQuantity,
        quantity_reserved: 0,
        reorder_level: 0,
        max_stock_level: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== CATEGORIES =====
  
  /**
   * Get all active categories
   */
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order, name');

    if (error) throw error;
    return data;
  }

  // ===== CUSTOMERS =====
  
  /**
   * Get all active customers
   */
  static async getCustomers(filters?: {
    searchTerm?: string;
    customerType?: string;
    loyaltyTier?: string;
  }) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('is_active', true);

    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    if (filters?.customerType) {
      query = query.eq('customer_type', filters.customerType);
    }

    if (filters?.loyaltyTier) {
      query = query.eq('loyalty_tier', filters.loyaltyTier);
    }

    const { data, error } = await query.order('first_name');

    if (error) throw error;
    return data;
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new customer
   */
  static async createCustomer(customerData: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    customer_type?: string;
    date_of_birth?: string;
  }) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update customer
   */
  static async updateCustomer(id: string, updates: any) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== POS SESSIONS =====
  
  /**
   * Get or create POS session for cashier
   */
  static async getOrCreatePOSSession(cashierId: string, branchId?: string) {
    // Check for existing open session
    const { data: existingSession, error: sessionError } = await supabase
      .from('pos_sessions')
      .select('*')
      .eq('cashier_id', cashierId)
      .eq('status', 'open')
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      throw sessionError;
    }

    if (existingSession) {
      return existingSession;
    }

    // Create new session
    const sessionNumber = await this.generateSessionNumber();
    const { data: newSession, error: createError } = await supabase
      .from('pos_sessions')
      .insert({
        cashier_id: cashierId,
        branch_id: branchId,
        session_number: sessionNumber,
        starting_cash: 0,
        status: 'open'
      })
      .select()
      .single();

    if (createError) throw createError;
    return newSession;
  }

  /**
   * Update POS session
   */
  static async updatePOSSession(sessionId: string, updates: any) {
    const { data, error } = await supabase
      .from('pos_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Close POS session
   */
  static async closePOSSession(sessionId: string, endingCash: number) {
    const { data, error } = await supabase
      .from('pos_sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        ending_cash: endingCash
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== TRANSACTIONS =====
  
  /**
   * Create POS transaction
   */
  static async createPOSTransaction(transactionData: {
    pos_session_id: string;
    customer_id?: string;
    cashier_id: string;
    branch_id?: string;
    transaction_type?: string;
    subtotal: number;
    discount_amount?: number;
    discount_percentage?: number;
    tax_amount: number;
    total_amount: number;
    payment_status?: string;
    status?: string;
    notes?: string;
  }) {
    const transactionNumber = await this.generateTransactionNumber();
    
    const { data, error } = await supabase
      .from('pos_transactions')
      .insert({
        ...transactionData,
        transaction_number: transactionNumber
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create transaction items
   */
  static async createTransactionItems(transactionId: string, items: Array<{
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
  }>) {
    const itemsWithTransactionId = items.map(item => ({
      ...item,
      transaction_id: transactionId
    }));

    const { data, error } = await supabase
      .from('pos_transaction_items')
      .insert(itemsWithTransactionId)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Create payment record
   */
  static async createPayment(paymentData: {
    transaction_id: string;
    payment_method: string;
    payment_type?: string;
    amount: number;
    change_given?: number;
    reference_number?: string;
    payment_status?: string;
  }) {
    const { data, error } = await supabase
      .from('pos_payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get transaction with items and payments
   */
  static async getTransactionWithDetails(transactionId: string) {
    const { data, error } = await supabase
      .from('pos_transactions')
      .select(`
        *,
        pos_transaction_items(*),
        pos_payments(*),
        customers:customer_id(*),
        users:cashier_id(*),
        branches:branch_id(*)
      `)
      .eq('id', transactionId)
      .single();

    if (error) throw error;
    return data;
  }

  // ===== STOCK MANAGEMENT =====
  
  /**
   * Create stock movement
   */
  static async createStockMovement(movementData: {
    branch_id: string;
    product_id: string;
    movement_type: string;
    quantity: number;
    reference_type: string;
    reference_id?: string;
    batch_number?: string;
    expiry_date?: string;
    cost?: number;
    notes?: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movementData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get stock movements for product
   */
  static async getStockMovements(productId: string, branchId?: string) {
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        users:created_by(*),
        branches:branch_id(*)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // ===== REPORTS & ANALYTICS =====
  
  /**
   * Get session sales summary
   */
  static async getSessionSalesSummary(sessionId: string) {
    const { data, error } = await supabase
      .from('pos_transactions')
      .select(`
        id,
        total_amount,
        payment_status,
        pos_payments(*)
      `)
      .eq('pos_session_id', sessionId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(sessionId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('pos_transaction_items')
      .select(`
        product_name,
        product_sku,
        quantity,
        line_total
      `)
      .eq('transaction_id', sessionId);

    if (error) throw error;
    return data;
  }

  // ===== UTILITY FUNCTIONS =====
  
  /**
   * Generate session number
   */
  private static async generateSessionNumber(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from('pos_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`);
    
    return `S${today}${String((count || 0) + 1).padStart(3, '0')}`;
  }

  /**
   * Generate transaction number
   */
  private static async generateTransactionNumber(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from('pos_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`);
    
    return `T${today}${String((count || 0) + 1).padStart(4, '0')}`;
  }

  /**
   * Generate customer code
   */
  static async generateCustomerCode(): Promise<string> {
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    return `C${String((count || 0) + 1).padStart(6, '0')}`;
  }

  // ===== AUDIT LOGGING =====
  
  /**
   * Log POS action
   */
  static async logPOSAction(actionData: {
    session_id?: string;
    transaction_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_value?: string;
    new_value?: string;
    cashier_id: string;
    ip_address?: string;
    user_agent?: string;
  }) {
    const { data, error } = await supabase
      .from('pos_audit_logs')
      .insert(actionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default POSDatabaseService;
