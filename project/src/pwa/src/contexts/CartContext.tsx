import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Cart, CartItem, CartContextType, ProductVariant } from '../types'

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    itemCount: 0
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('agrivet-cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('agrivet-cart', JSON.stringify(cart))
  }, [cart])

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const tax = subtotal * 0.12 // 12% VAT
    const total = subtotal + tax
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return { subtotal, tax, total, itemCount }
  }

  const addItem = (newItem: Omit<CartItem, 'id' | 'lineTotal'>) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(
        item => item.product.id === newItem.product.id
      )

      let updatedItems: CartItem[]

      if (existingItemIndex > -1) {
        // Update existing item
        updatedItems = prevCart.items.map((item, index) => {
          if (index === existingItemIndex) {
            const updatedQuantity = item.quantity + newItem.quantity
            const updatedLineTotal = updatedQuantity * item.unitPrice
            return {
              ...item,
              quantity: updatedQuantity,
              lineTotal: updatedLineTotal
            }
          }
          return item
        })
      } else {
        // Add new item
        const lineTotal = newItem.quantity * newItem.unitPrice
        const cartItem: CartItem = {
          ...newItem,
          id: `${newItem.product.id}-${Date.now()}`,
          lineTotal
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
          const updatedLineTotal = quantity * item.unitPrice
          return {
            ...item,
            quantity,
            lineTotal: updatedLineTotal
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

  const clearCart = () => {
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

  const value: CartContextType = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getTotal
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
