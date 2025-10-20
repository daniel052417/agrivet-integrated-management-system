import { useEffect, useCallback } from 'react'
import { useCart } from '../contexts/CartContext'

interface UseCartSyncOptions {
  autoSave?: boolean
  saveInterval?: number
  onSaveStart?: () => void
  onSaveComplete?: (result: any) => void
  onSaveError?: (error: any) => void
}

/**
 * Hook for managing cart local storage
 */
export const useCartSync = (options: UseCartSyncOptions = {}) => {
  const {
    autoSave = true,
    saveInterval = 10000, // 10 seconds
    onSaveStart,
    onSaveComplete,
    onSaveError
  } = options

  const cartContext = useCart()

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !cartContext.saveToLocalStorage) return

    const interval = setInterval(async () => {
      try {
        onSaveStart?.()
        const result = await cartContext.saveToLocalStorage()
        onSaveComplete?.(result)
      } catch (error) {
        onSaveError?.(error)
      }
    }, saveInterval)

    return () => clearInterval(interval)
  }, [autoSave, saveInterval, cartContext.saveToLocalStorage, onSaveStart, onSaveComplete, onSaveError])

  // Save when coming back online (in case we missed saves while offline)
  useEffect(() => {
    const handleOnline = async () => {
      if (cartContext.saveToLocalStorage) {
        try {
          onSaveStart?.()
          const result = await cartContext.saveToLocalStorage()
          onSaveComplete?.(result)
        } catch (error) {
          onSaveError?.(error)
        }
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [cartContext.saveToLocalStorage, onSaveStart, onSaveComplete, onSaveError])

  // Manual save function
  const saveNow = useCallback(async () => {
    if (!cartContext.saveToLocalStorage) return

    try {
      onSaveStart?.()
      const result = await cartContext.saveToLocalStorage()
      onSaveComplete?.(result)
      return result
    } catch (error) {
      onSaveError?.(error)
      throw error
    }
  }, [cartContext.saveToLocalStorage, onSaveStart, onSaveComplete, onSaveError])

  // Handle user authentication
  const handleAuthChange = useCallback(async (userId?: string, isGuest: boolean = true) => {
    if (!cartContext.handleUserAuthentication) return

    try {
      onSaveStart?.()
      await cartContext.handleUserAuthentication(userId, isGuest)
      onSaveComplete?.({ success: true, message: 'Authentication handled successfully' })
    } catch (error) {
      onSaveError?.(error)
      throw error
    }
  }, [cartContext.handleUserAuthentication, onSaveStart, onSaveComplete, onSaveError])

  // Get storage info
  const getStorageInfo = useCallback(async () => {
    if (!cartContext.getStorageInfo) return null
    return await cartContext.getStorageInfo()
  }, [cartContext.getStorageInfo])

  return {
    saveNow,
    handleAuthChange,
    getStorageInfo,
    isLoading: cartContext.isLoading,
    lastSaveTime: cartContext.lastSaveTime,
    cart: cartContext.cart
  }
}

export default useCartSync
