import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Cart, CartItem, CartContextType } from '../types'
import CartService from '../services/cartService'

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
  sessionId?: string
  userId?: string
  isGuest?: boolean
}

export const CartProvider: React.FC<CartProviderProps> = ({ 
  children, 
  sessionId = 'default-session',
  userId,
  isGuest = true 
}) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    itemCount: 0
  })
  const [cartService] = useState(() => new CartService({
    sessionId,
    userId,
    isGuest
  }))
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)

  // Initialize cart on mount
  useEffect(() => {
    initializeCart()
  }, [])

  // Save cart to local storage whenever it changes (with debounce)
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveCartToLocalStorage()
      }, 500) // 500ms debounce for faster response

      return () => clearTimeout(timeoutId)
    }
  }, [cart, isLoading])

  const initializeCart = async () => {
    try {
      setIsLoading(true)
      
      // Load from local storage (IndexedDB with localStorage fallback)
      const localCart = await cartService.loadCartFromLocalStorage()
      
      if (localCart) {
        setCart(localCart)
        setLastSaveTime(new Date())
      }
    } catch (error) {
      console.error('Error initializing cart:', error)
      // Cart will remain empty if loading fails
    } finally {
      setIsLoading(false)
    }
  }

  const saveCartToLocalStorage = async () => {
    try {
      const result = await cartService.saveCartToLocalStorage(cart)
      if (result.success) {
        setLastSaveTime(new Date())
      } else {
        console.warn('Failed to save cart locally:', result.error)
      }
    } catch (error) {
      console.error('Error saving cart locally:', error)
      // Don't break user flow - cart still works in memory
    }
  }

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const tax = 0 // VAT removed
    const total = subtotal // Total equals subtotal without VAT
    const itemCount = items.length // Count actual items, not quantities

    return { subtotal, tax, total, itemCount }
  }

  const addItem = (newItem: Omit<CartItem, 'id' | 'lineTotal' | 'base_unit_quantity'>) => {
    setCart(prevCart => {
      // Check if item with same product and unit already exists
      const existingItemIndex = prevCart.items.findIndex(
        item => item.product.id === newItem.product.id && 
                item.product_unit?.id === newItem.product_unit?.id
      )

      let updatedItems: CartItem[]

      if (existingItemIndex > -1) {
        // Update existing item
        updatedItems = prevCart.items.map((item, index) => {
          if (index === existingItemIndex) {
            const updatedQuantity = item.quantity + newItem.quantity
            const updatedLineTotal = cartService.calculateLineTotal({
              ...item,
              quantity: updatedQuantity
            })
            const updatedBaseUnitQuantity = cartService.calculateBaseUnitQuantity({
              ...item,
              quantity: updatedQuantity
            })
            return {
              ...item,
              quantity: updatedQuantity,
              lineTotal: updatedLineTotal,
              base_unit_quantity: updatedBaseUnitQuantity
            }
          }
          return item
        })
      } else {
        // Add new item
        const tempItem = {
          id: '', // Will be set below
          ...newItem,
          lineTotal: 0, // Will be calculated below
          base_unit_quantity: 0 // Will be calculated below
        } as CartItem
        
        const lineTotal = cartService.calculateLineTotal(tempItem)
        const baseUnitQuantity = cartService.calculateBaseUnitQuantity(tempItem)
        const cartItem: CartItem = {
          ...newItem,
          id: `${newItem.product.id}-${newItem.product_unit?.id || 'default'}-${Date.now()}`,
          lineTotal,
          base_unit_quantity: baseUnitQuantity
        }
        updatedItems = [...prevCart.items, cartItem]
      }

      const totals = calculateTotals(updatedItems)
      return {
        items: updatedItems,
        ...totals
      }
    })
  }

  const removeItem = (itemId: string) => {
    setCart(prevCart => {
      const updatedItems = prevCart.items.filter(item => item.id !== itemId)
      const totals = calculateTotals(updatedItems)
      return {
        items: updatedItems,
        ...totals
      }
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item => {
        if (item.id === itemId) {
          const updatedLineTotal = cartService.calculateLineTotal({
            ...item,
            quantity
          })
          const updatedBaseUnitQuantity = cartService.calculateBaseUnitQuantity({
            ...item,
            quantity
          })
          return {
            ...item,
            quantity,
            lineTotal: updatedLineTotal,
            base_unit_quantity: updatedBaseUnitQuantity
          }
        }
        return item
      })

      const totals = calculateTotals(updatedItems)
      return {
        items: updatedItems,
        ...totals
      }
    })
  }

  const clearCart = async () => {
    try {
      // Clear from local storage
      await cartService.clearCart()
    } catch (error) {
      console.error('Error clearing cart from storage:', error)
      // Still clear from state even if storage fails
    }
    
    setCart({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0
    })
  }

  const getItemCount = () => {
    return cart.itemCount
  }

  const getTotal = () => {
    return cart.total
  }

  // Handle user authentication changes
  const handleUserAuthentication = async (newUserId?: string, newIsGuest: boolean = true) => {
    try {
      setIsLoading(true)
      cartService.updateConfig({ userId: newUserId, isGuest: newIsGuest })
      // For local-only cart, we just update the config - no need to migrate
      setLastSaveTime(new Date())
    } catch (error) {
      console.error('Error handling user authentication:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manual save to local storage
  const saveToLocalStorage = async () => {
    try {
      setIsLoading(true)
      await saveCartToLocalStorage()
      return { success: true, message: 'Cart saved locally' }
    } catch (error) {
      console.error('Error saving cart locally:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsLoading(false)
    }
  }

  // Update session configuration
  const updateSession = (sessionId: string, userId?: string, isGuest: boolean = true) => {
    cartService.updateConfig({ sessionId, userId, isGuest })
  }

  // Get storage info for debugging
  const getStorageInfo = async () => {
    return await cartService.getStorageInfo()
  }

  const value: CartContextType & {
    isLoading: boolean
    lastSaveTime: Date | null
    handleUserAuthentication: (userId?: string, isGuest?: boolean) => Promise<void>
    saveToLocalStorage: () => Promise<any>
    updateSession: (sessionId: string, userId?: string, isGuest?: boolean) => void
    getStorageInfo: () => Promise<any>
  } = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getTotal,
    isLoading,
    lastSaveTime,
    handleUserAuthentication,
    saveToLocalStorage,
    updateSession,
    getStorageInfo
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
