import { Cart, CartItem } from '../types'
import { supabase } from './supabase'

interface CartServiceConfig {
  sessionId: string
  userId?: string
  isGuest: boolean
}

interface CartStorageResult {
  success: boolean
  cart: Cart
  error?: string
}

class CartService {
  private config: CartServiceConfig
  private dbName = 'AgriVetCartDB'
  private dbVersion = 1
  private storeName = 'carts'
  private db: IDBDatabase | null = null

  constructor(config: CartServiceConfig) {
    this.config = config
    this.initIndexedDB()
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage')
        resolve()
      }
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'sessionId' })
        }
      }
    })
  }

  /**
   * Calculate line total for a cart item
   */
  calculateLineTotal(item: CartItem): number {
    return item.quantity * (item.product_unit?.price_per_unit || item.unitPrice)
  }

  /**
   * Calculate base unit quantity for inventory tracking
   */
  calculateBaseUnitQuantity(item: CartItem): number {
    if (!item.product_unit) return item.quantity
    return item.quantity * item.product_unit.conversion_factor
  }

  /**
   * Reserve inventory for cart items
   */
  async reserveInventory(cartItems: CartItem[], branchId: string): Promise<void> {
    try {
      for (const item of cartItems) {
        const baseQuantity = this.calculateBaseUnitQuantity(item)
        
        // Call the reserve_inventory RPC function
        const { error } = await supabase.rpc('reserve_inventory', {
          p_branch_id: branchId,
          p_product_id: item.product.product_id, // Changed from p_product_variant_id to p_product_id
          p_quantity: baseQuantity // Always in base units
        })

        if (error) {
          console.error('Error reserving inventory for item:', item.product.name, error)
          throw error
        }
      }
    } catch (error) {
      console.error('Error reserving inventory:', error)
      throw error
    }
  }

  /**
   * Release inventory reservation for cart items
   */
  async releaseInventory(cartItems: CartItem[], branchId: string): Promise<void> {
    try {
      for (const item of cartItems) {
        const baseQuantity = this.calculateBaseUnitQuantity(item)
        
        // Call the release_inventory RPC function
        const { error } = await supabase.rpc('release_inventory', {
          p_branch_id: branchId,
          p_product_id: item.product.product_id, // Changed from p_product_variant_id to p_product_id
          p_quantity: baseQuantity // Always in base units
        })

        if (error) {
          console.error('Error releasing inventory for item:', item.product.name, error)
          throw error
        }
      }
    } catch (error) {
      console.error('Error releasing inventory:', error)
      throw error
    }
  }

  /**
   * Save cart to local storage (IndexedDB with localStorage fallback)
   */
  async saveCartToLocalStorage(cart: Cart): Promise<CartStorageResult> {
    try {
      // Try IndexedDB first
      if (this.db) {
        await this.saveToIndexedDB(cart)
        return { success: true, cart }
      }
      
      // Fallback to localStorage
      this.saveToLocalStorage(cart)
      return { success: true, cart }
    } catch (error) {
      console.error('CartService: Failed to save cart locally:', error)
      return { 
        success: false, 
        cart, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Load cart from local storage (IndexedDB with localStorage fallback)
   */
  async loadCartFromLocalStorage(): Promise<Cart | null> {
    try {
      // Try IndexedDB first
      if (this.db) {
        const cart = await this.loadFromIndexedDB()
        if (cart) return cart
      }
      
      // Fallback to localStorage
      return this.loadFromLocalStorage()
    } catch (error) {
      console.error('CartService: Failed to load cart locally:', error)
      return this.loadFromLocalStorage()
    }
  }

  /**
   * Save cart to IndexedDB
   */
  private async saveToIndexedDB(cart: Cart): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not available')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({
        sessionId: this.config.sessionId,
        cart,
        timestamp: Date.now()
      })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Load cart from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<Cart | null> {
    if (!this.db) return null
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(this.config.sessionId)
      
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.cart : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save cart to localStorage (fallback)
   */
  private saveToLocalStorage(cart: Cart): void {
    try {
      localStorage.setItem(`agrivet-cart-${this.config.sessionId}`, JSON.stringify(cart))
    } catch (error) {
      console.error('CartService: Failed to save cart to localStorage:', error)
    }
  }

  /**
   * Load cart from localStorage (fallback)
   */
  private loadFromLocalStorage(): Cart | null {
    try {
      const savedCart = localStorage.getItem(`agrivet-cart-${this.config.sessionId}`)
      return savedCart ? JSON.parse(savedCart) : null
    } catch (error) {
      console.error('CartService: Failed to load cart from localStorage:', error)
      return null
    }
  }

  /**
   * Get empty cart
   */
  getEmptyCart(): Cart {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0
    }
  }

  /**
   * Clear cart from local storage
   */
  async clearCart(): Promise<void> {
    try {
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(this.config.sessionId)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
      
      // Also clear from localStorage
      localStorage.removeItem(`agrivet-cart-${this.config.sessionId}`)
    } catch (error) {
      console.error('CartService: Failed to clear cart:', error)
    }
  }

  /**
   * Update session configuration
   */
  updateConfig(newConfig: Partial<CartServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): CartServiceConfig {
    return { ...this.config }
  }

  /**
   * Get cart storage info for debugging
   */
  async getStorageInfo(): Promise<{
    hasIndexedDB: boolean
    hasLocalStorage: boolean
    sessionId: string
  }> {
    const hasIndexedDB = !!this.db
    const hasLocalStorage = !!localStorage.getItem(`agrivet-cart-${this.config.sessionId}`)
    
    return {
      hasIndexedDB,
      hasLocalStorage,
      sessionId: this.config.sessionId
    }
  }
}

export default CartService
