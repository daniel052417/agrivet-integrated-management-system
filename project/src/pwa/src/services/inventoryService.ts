import { Inventory, InventoryTransaction } from '../types'
import { supabase } from './supabase'
import { getManilaTimestamp } from '../utils/dateTime'

interface InventoryServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

interface InventoryUpdateRequest {
  productId: string
  branchId: string
  quantityChange: number
  transactionType: 'sale' | 'adjustment' | 'restock' | 'return' | 'reservation' | 'release'
  orderId?: string
  referenceNumber?: string
  notes?: string
  createdBy?: string
  createdByName?: string
}

interface InventoryUpdateResponse {
  success: boolean
  transaction?: InventoryTransaction
  error?: string
}

class InventoryService {
  private config: InventoryServiceConfig

  constructor(config: InventoryServiceConfig) {
    this.config = config
  }

  /**
   * Get inventory for a product at a branch
   */
  async getInventory(productId: string, branchId: string): Promise<{ success: boolean; inventory?: Inventory; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .single()

      if (error) {
        throw new Error(`Failed to get inventory: ${error.message}`)
      }

      return {
        success: true,
        inventory
      }

    } catch (error) {
      console.error('Error getting inventory:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update inventory with transaction tracking
   */
  async updateInventory(request: InventoryUpdateRequest): Promise<InventoryUpdateResponse> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { productId, branchId, quantityChange, transactionType, orderId, referenceNumber, notes, createdBy, createdByName } = request

      // Get current inventory
      const inventoryResult = await this.getInventory(productId, branchId)
      
      if (!inventoryResult.success || !inventoryResult.inventory) {
        throw new Error('Inventory record not found')
      }

      const currentInventory = inventoryResult.inventory
      const quantityBefore = currentInventory.quantity_on_hand
      const quantityAfter = quantityBefore + quantityChange

      // Check if we have enough inventory for sales
      if (transactionType === 'sale' && quantityAfter < 0) {
        throw new Error('Insufficient inventory for sale')
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity_on_hand: quantityAfter,
          updated_at: getManilaTimestamp()
        })
        .eq('product_id', productId)
        .eq('branch_id', branchId)

      if (updateError) {
        throw new Error(`Failed to update inventory: ${updateError.message}`)
      }

      // Create inventory transaction record
      const transactionData = {
        product_id: productId,
        branch_id: branchId,
        order_id: orderId || null,
        transaction_type: transactionType,
        quantity_change: quantityChange,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reference_number: referenceNumber || null,
        notes: notes || null,
        created_by: createdBy || null,
        created_by_name: createdByName || null,
        created_at: getManilaTimestamp()
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert(transactionData)
        .select()
        .single()

      if (transactionError) {
        throw new Error(`Failed to create inventory transaction: ${transactionError.message}`)
      }

      return {
        success: true,
        transaction
      }

    } catch (error) {
      console.error('Error updating inventory:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Deduct inventory for order items
   */
  async deductInventoryForOrder(orderId: string, orderItems: Array<{
    productId: string
    productUnitId: string
    quantity: number
    baseUnitQuantity: number
  }>, branchId: string, createdBy?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const results = []

      for (const item of orderItems) {
        const result = await this.updateInventory({
          productId: item.productId,
          branchId,
          quantityChange: -item.baseUnitQuantity, // Negative for deduction
          transactionType: 'sale',
          orderId,
          referenceNumber: `ORDER-${orderId}`,
          notes: `Deducted for order ${orderId}`,
          createdBy: null, // Customer-initiated action, no staff user
          createdByName: 'Customer Order'
        })

        if (!result.success) {
          console.error(`Failed to deduct inventory for product ${item.productId}:`, result.error)
          results.push({ productId: item.productId, success: false, error: result.error })
        } else {
          results.push({ productId: item.productId, success: true })
        }
      }

      const hasErrors = results.some(r => !r.success)
      
      return {
        success: !hasErrors,
        error: hasErrors ? 'Some inventory deductions failed' : undefined
      }

    } catch (error) {
      console.error('Error deducting inventory for order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Restore inventory for cancelled order
   */
  async restoreInventoryForOrder(orderId: string, orderItems: Array<{
    productId: string
    productUnitId: string
    quantity: number
    baseUnitQuantity: number
  }>, branchId: string, createdBy?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const results = []

      for (const item of orderItems) {
        const result = await this.updateInventory({
          productId: item.productId,
          branchId,
          quantityChange: item.baseUnitQuantity, // Positive for restoration
          transactionType: 'return',
          orderId,
          referenceNumber: `CANCEL-${orderId}`,
          notes: `Restored for cancelled order ${orderId}`,
          createdBy: null, // Customer-initiated action, no staff user
          createdByName: 'Customer Cancellation'
        })

        if (!result.success) {
          console.error(`Failed to restore inventory for product ${item.productId}:`, result.error)
          results.push({ productId: item.productId, success: false, error: result.error })
        } else {
          results.push({ productId: item.productId, success: true })
        }
      }

      const hasErrors = results.some(r => !r.success)
      
      return {
        success: !hasErrors,
        error: hasErrors ? 'Some inventory restorations failed' : undefined
      }

    } catch (error) {
      console.error('Error restoring inventory for order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reserve inventory for pending orders
   */
  async reserveInventory(productId: string, branchId: string, quantity: number, orderId: string, createdBy?: string): Promise<InventoryUpdateResponse> {
    try {
      return await this.updateInventory({
        productId,
        branchId,
        quantityChange: -quantity, // Negative for reservation
        transactionType: 'reservation',
        orderId,
        referenceNumber: `RESERVE-${orderId}`,
        notes: `Reserved for order ${orderId}`,
        createdBy,
        createdByName: 'System'
      })

    } catch (error) {
      console.error('Error reserving inventory:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Release reserved inventory
   */
  async releaseInventory(productId: string, branchId: string, quantity: number, orderId: string, createdBy?: string): Promise<InventoryUpdateResponse> {
    try {
      return await this.updateInventory({
        productId,
        branchId,
        quantityChange: quantity, // Positive for release
        transactionType: 'release',
        orderId,
        referenceNumber: `RELEASE-${orderId}`,
        notes: `Released for order ${orderId}`,
        createdBy,
        createdByName: 'System'
      })

    } catch (error) {
      console.error('Error releasing inventory:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get inventory transactions for a product
   */
  async getInventoryTransactions(productId: string, branchId?: string): Promise<{ success: boolean; transactions?: InventoryTransaction[]; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('inventory_transactions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data: transactions, error } = await query

      if (error) {
        throw new Error(`Failed to get inventory transactions: ${error.message}`)
      }

      return {
        success: true,
        transactions
      }

    } catch (error) {
      console.error('Error getting inventory transactions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if product is in stock
   */
  async isInStock(productId: string, branchId: string, requiredQuantity: number = 1): Promise<{ success: boolean; inStock: boolean; availableQuantity: number; error?: string }> {
    try {
      const inventoryResult = await this.getInventory(productId, branchId)
      
      if (!inventoryResult.success || !inventoryResult.inventory) {
        return {
          success: false,
          inStock: false,
          availableQuantity: 0,
          error: 'Inventory record not found'
        }
      }

      const inventory = inventoryResult.inventory
      const availableQuantity = inventory.quantity_available || 0
      const inStock = availableQuantity >= requiredQuantity

      return {
        success: true,
        inStock,
        availableQuantity
      }

    } catch (error) {
      console.error('Error checking stock:', error)
      return {
        success: false,
        inStock: false,
        availableQuantity: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get low stock products for a branch
   */
  async getLowStockProducts(branchId: string): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: products, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('branch_id', branchId)
        .lte('quantity_on_hand', supabase.raw('reorder_level'))
        .order('quantity_on_hand', { ascending: true })

      if (error) {
        throw new Error(`Failed to get low stock products: ${error.message}`)
      }

      return {
        success: true,
        products
      }

    } catch (error) {
      console.error('Error getting low stock products:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!supabase
  }
}

export default InventoryService
