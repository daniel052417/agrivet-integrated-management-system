// ============================================================================
// ENHANCED AUTHENTICATION HOOK
// ============================================================================
// React hook for easy integration with the enhanced authentication service

import { useState, useEffect, useCallback } from 'react'
import { enhancedAuthService, AuthUser, RegisterData, LoginCredentials, GuestUpgradeData } from '../services/enhancedAuthService'

// ============================================================================
// TYPES
// ============================================================================

export interface UseAuthReturn {
  // State
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  
  // Actions
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  createGuest: () => Promise<{ success: boolean; error?: string }>
  upgradeGuest: (data: GuestUpgradeData) => Promise<{ success: boolean; error?: string }>
  
  // Utilities
  refreshUser: () => Promise<void>
}

// ============================================================================
// ENHANCED AUTHENTICATION HOOK
// ============================================================================

export const useEnhancedAuth = (): UseAuthReturn => {
  // State
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Computed state
  const isAuthenticated = !!user
  const isGuest = user?.is_guest || false

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        
        // Check for existing session
        const currentUser = await enhancedAuthService.getCurrentUser()
        
        if (currentUser) {
          setUser(currentUser)
          console.log('✅ useEnhancedAuth: User session restored:', currentUser.customer_code)
        } else {
          console.log('ℹ️ useEnhancedAuth: No active session found')
        }
      } catch (error) {
        console.error('❌ useEnhancedAuth: Initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // ============================================================================
  // AUTHENTICATION ACTIONS
  // ============================================================================

  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true)
      console.log('🔄 useEnhancedAuth: Starting registration...')
      
      const result = await enhancedAuthService.register(data)
      
      if (result.user) {
        setUser(result.user)
        console.log('✅ useEnhancedAuth: Registration successful:', result.user.customer_code)
        return { success: true }
      } else {
        console.error('❌ useEnhancedAuth: Registration failed:', result.error)
        return { success: false, error: result.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('❌ useEnhancedAuth: Registration error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      console.log('🔄 useEnhancedAuth: Starting login...')
      
      const result = await enhancedAuthService.login(credentials)
      
      if (result.user) {
        setUser(result.user)
        console.log('✅ useEnhancedAuth: Login successful:', result.user.customer_code)
        return { success: true }
      } else {
        console.error('❌ useEnhancedAuth: Login failed:', result.error)
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      console.error('❌ useEnhancedAuth: Login error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('🔄 useEnhancedAuth: Starting logout...')
      
      await enhancedAuthService.logout()
      setUser(null)
      
      console.log('✅ useEnhancedAuth: Logout successful')
    } catch (error) {
      console.error('❌ useEnhancedAuth: Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ============================================================================
  // GUEST USER ACTIONS
  // ============================================================================

  const createGuest = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('🔄 useEnhancedAuth: Creating guest user...')
      
      const result = await enhancedAuthService.createGuestUser()
      
      if (result.user) {
        setUser(result.user)
        console.log('✅ useEnhancedAuth: Guest user created:', result.user.customer_code)
        return { success: true }
      } else {
        console.error('❌ useEnhancedAuth: Guest creation failed:', result.error)
        return { success: false, error: result.error || 'Failed to create guest user' }
      }
    } catch (error) {
      console.error('❌ useEnhancedAuth: Guest creation error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create guest user' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const upgradeGuest = useCallback(async (data: GuestUpgradeData) => {
    if (!user || !isGuest) {
      return { success: false, error: 'No guest user to upgrade' }
    }

    try {
      setIsLoading(true)
      console.log('🔄 useEnhancedAuth: Upgrading guest user...')
      
      const result = await enhancedAuthService.upgradeGuestToCustomer(user.id, data)
      
      if (result.user) {
        setUser(result.user)
        console.log('✅ useEnhancedAuth: Guest upgraded successfully:', result.user.customer_code)
        return { success: true }
      } else {
        console.error('❌ useEnhancedAuth: Guest upgrade failed:', result.error)
        return { success: false, error: result.error || 'Failed to upgrade guest account' }
      }
    } catch (error) {
      console.error('❌ useEnhancedAuth: Guest upgrade error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upgrade guest account' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, isGuest])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const refreshUser = useCallback(async () => {
    try {
      console.log('🔄 useEnhancedAuth: Refreshing user data...')
      
      const currentUser = await enhancedAuthService.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        console.log('✅ useEnhancedAuth: User data refreshed:', currentUser.customer_code)
      } else {
        setUser(null)
        console.log('ℹ️ useEnhancedAuth: No user found, clearing state')
      }
    } catch (error) {
      console.error('❌ useEnhancedAuth: Refresh error:', error)
      setUser(null)
    }
  }, [])

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    isGuest,
    
    // Actions
    register,
    login,
    logout,
    createGuest,
    upgradeGuest,
    
    // Utilities
    refreshUser
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default useEnhancedAuth












