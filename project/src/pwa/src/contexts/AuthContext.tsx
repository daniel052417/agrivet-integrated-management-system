import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, AuthUser } from '../services/authService'
import { supabase } from '../services/supabase'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isGuest: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
  }) => Promise<{ success: boolean; error?: string }>
  upgradeGuestAccount: (data: {
    email: string
    password: string
    first_name?: string
    last_name?: string
    phone?: string
    address?: string
    city?: string
    province?: string
    date_of_birth?: string
  }) => Promise<{ success: boolean; error?: string }>
  socialLogin: (provider: 'google' | 'facebook') => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  sendEmailVerification: (email: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (code: string, email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  const isAuthenticated = !!user

  // Load cached user data immediately for instant UI
  useEffect(() => {
    const loadCachedUser = () => {
      try {
        const cachedUser = localStorage.getItem('agrivet_user_cache')
        const cachedGuest = localStorage.getItem('agrivet_guest_cache')
        
        if (cachedUser) {
          const userData = JSON.parse(cachedUser)
          setUser(userData)
          console.log('✅ AuthContext: Loaded cached user data for instant UI')
        }
        
        if (cachedGuest === 'true') {
          setIsGuest(true)
          console.log('✅ AuthContext: Loaded cached guest state')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error loading cached user data:', error)
      }
    }

    loadCachedUser()
  }, [])

  // Check for existing session on mount and set up auth state listener
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Don't block - just check silently
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session?.user && !error) {
          console.log('🔄 AuthContext: Found active session, loading user data...')
          await loadUserData(session.user.id)
        } else {
          console.log('ℹ️ AuthContext: No active session found')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking session:', error)
      } finally {
        setIsLoading(false) // This should happen quickly
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth state changed:', { event, hasSession: !!session })
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsGuest(false)
        }
      }
    )

    checkSession()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      // Get customer data from the customers table
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (customer && !customerError) {
        const authUser: AuthUser = {
          id: customer.user_id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          user_type: 'customer',
          is_active: customer.is_active,
          email_verified: customer.email_verified || false,
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          preferred_branch_id: customer.preferred_branch_id
        }
        setUser(authUser)
        setIsGuest(false)
        
        // Cache user data for instant loading next time
        localStorage.setItem('agrivet_user_cache', JSON.stringify(authUser))
        localStorage.removeItem('agrivet_guest_cache')
        
        console.log('✅ AuthContext: User data loaded and cached:', { 
          id: authUser.id, 
          email: authUser.email,
          preferred_branch_id: authUser.preferred_branch_id 
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Starting login process...', { email })
      setIsLoading(true)
      
      const response = await authService.login({ email, password })
      console.log('🔐 AuthContext: AuthService response:', {
        hasUser: !!response.user,
        hasSession: !!response.session,
        error: response.error,
        fullResponse: response
      })
      
      if (response.user) {
        console.log('✅ AuthContext: User found, setting user state')
        setUser(response.user)
        // Note: Session is now managed by Supabase Auth, no need for custom session token
        return { success: true }
      } else {
        console.error('❌ AuthContext: No user in response:', response.error)
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
  }) => {
    try {
      setIsLoading(true)
      const response = await authService.register(data)
      
      if (response.user && response.session) {
        setUser(response.user)
        setIsGuest(false)
        localStorage.setItem('pwa_session_token', response.session.session_token)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const upgradeGuestAccount = async (data: {
    email: string
    password: string
    first_name?: string
    last_name?: string
    phone?: string
    address?: string
    city?: string
    province?: string
    date_of_birth?: string
  }) => {
    try {
      setIsLoading(true)
      
      // Import the guest upgrade service
      const { guestUpgradeService } = await import('../services/guestUpgradeService')
      
      const response = await guestUpgradeService.upgradeGuestAccount(data)
      
      if (response.success && response.customer) {
        // Convert customer to AuthUser format
        const upgradedUser: AuthUser = {
          id: response.customer.user_id,
          email: response.customer.email,
          first_name: response.customer.first_name,
          last_name: response.customer.last_name,
          phone: response.customer.phone,
          user_type: 'customer',
          is_active: response.customer.is_active,
          email_verified: true, // Assume verified after upgrade
          created_at: response.customer.created_at,
          updated_at: response.customer.updated_at
        }
        
        setUser(upgradedUser)
        setIsGuest(false)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Guest upgrade failed' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Guest upgrade failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const socialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true)
      const response = await authService.socialLogin(provider)
      
      if (response.error) {
        return { success: false, error: response.error }
      } else {
        // For OAuth, the user will be redirected to the provider
        // The actual login happens in the callback
        return { success: true }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Social login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('pwa_session_token')
      if (sessionToken) {
        await authService.logout(sessionToken)
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setUser(null)
      setIsGuest(false)
      localStorage.removeItem('pwa_session_token')
      localStorage.removeItem('agrivet_user_cache')
      localStorage.removeItem('agrivet_guest_cache')
    }
  }

  const sendEmailVerification = async (email: string) => {
    return await authService.sendEmailVerification(email)
  }

  const verifyEmail = async (code: string, email: string) => {
    return await authService.verifyEmail(code, email)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isGuest,
    login,
    register,
    upgradeGuestAccount,
    socialLogin,
    logout,
    sendEmailVerification,
    verifyEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
