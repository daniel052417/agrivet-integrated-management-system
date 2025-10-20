import { useState, useEffect, useCallback } from 'react'
import { customerAuthService, Customer, SignUpData, SignInData, AuthResponse } from '../services/customerAuth'

// ============================================================================
// CUSTOMER AUTH HOOK
// ============================================================================

export const useCustomerAuth = () => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = customerAuthService.supabase?.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 useCustomerAuth: Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadCustomerProfile()
        } else if (event === 'SIGNED_OUT') {
          setCustomer(null)
          setIsAuthenticated(false)
          setError(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const authenticated = await customerAuthService.isAuthenticated()
      setIsAuthenticated(authenticated)

      if (authenticated) {
        await loadCustomerProfile()
      }
    } catch (err) {
      console.error('❌ useCustomerAuth: Initialization error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCustomerProfile = async () => {
    try {
      const customerProfile = await customerAuthService.getCurrentCustomer()
      setCustomer(customerProfile)
      setIsAuthenticated(!!customerProfile)
    } catch (err) {
      console.error('❌ useCustomerAuth: Error loading customer profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load customer profile')
    }
  }

  const signUp = useCallback(async (data: SignUpData): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await customerAuthService.signUpWithEmail(data)
      
      if (result.success && result.customer) {
        setCustomer(result.customer)
        setIsAuthenticated(true)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signIn = useCallback(async (data: SignInData): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await customerAuthService.signInWithEmail(data)
      
      if (result.success && result.customer) {
        setCustomer(result.customer)
        setIsAuthenticated(true)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signin failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signInWithGoogle = useCallback(async (): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await customerAuthService.signInWithGoogle()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google signin failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await customerAuthService.signOut()
      
      if (result.success) {
        setCustomer(null)
        setIsAuthenticated(false)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signout failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<Customer>): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await customerAuthService.updateCustomerProfile(updates)
      
      if (result.success && result.customer) {
        setCustomer(result.customer)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await loadCustomerProfile()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh profile'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    customer,
    isLoading,
    isAuthenticated,
    error,
    
    // Actions
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
    clearError
  }
}

// ============================================================================
// CUSTOMER AUTH CONTEXT (Optional - for global state management)
// ============================================================================

import { createContext, useContext, ReactNode } from 'react'

interface CustomerAuthContextType {
  customer: Customer | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  signUp: (data: SignUpData) => Promise<AuthResponse>
  signIn: (data: SignInData) => Promise<AuthResponse>
  signInWithGoogle: () => Promise<AuthResponse>
  signOut: () => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<Customer>) => Promise<AuthResponse>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined)

interface CustomerAuthProviderProps {
  children: ReactNode
}

export const CustomerAuthProvider: React.FC<CustomerAuthProviderProps> = ({ children }) => {
  const auth = useCustomerAuth()

  return (
    <CustomerAuthContext.Provider value={auth}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuthContext = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext)
  if (context === undefined) {
    throw new Error('useCustomerAuthContext must be used within a CustomerAuthProvider')
  }
  return context
}






