import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { authService, AuthUser } from '../services/authService'
import { supabase } from '../services/supabase'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitializing: boolean
  isGuest: boolean
  lastSyncTime: number | null
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
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Cache configuration
const CACHE_KEYS = {
  USER_DATA: 'agrivet_user_data',
  AUTH_STATE: 'agrivet_auth_state',
  LAST_SYNC: 'agrivet_last_sync'
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const SYNC_INTERVAL = 2 * 60 * 1000 // 2 minutes

export const OptimizedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  const isAuthenticated = !!user

  // Load cached user data immediately for instant UI
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedUser = localStorage.getItem(CACHE_KEYS.USER_DATA)
        const cachedAuthState = localStorage.getItem(CACHE_KEYS.AUTH_STATE)
        const cachedSyncTime = localStorage.getItem(CACHE_KEYS.LAST_SYNC)

        if (cachedUser && cachedAuthState) {
          const userData = JSON.parse(cachedUser)
          const authState = JSON.parse(cachedAuthState)
          const syncTime = cachedSyncTime ? parseInt(cachedSyncTime) : 0

          // Check if cache is still valid
          const isCacheValid = Date.now() - syncTime < CACHE_TTL

          if (isCacheValid) {
            console.log('🚀 AuthContext: Loading cached user data for instant UI')
            setUser(userData)
            setIsGuest(authState.isGuest || false)
            setLastSyncTime(syncTime)
          } else {
            console.log('⏰ AuthContext: Cache expired, will refresh in background')
          }
        }
      } catch (error) {
        console.error('❌ AuthContext: Error loading cached data:', error)
      }
    }

    loadCachedData()
  }, [])

  // Initialize auth state and start background sync
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthContext: Initializing auth state...')
        
        // Check for active Supabase Auth session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session?.user && !error) {
          await loadUserData(session.user.id, true)
        } else {
          // No session, but we might have cached data
          console.log('ℹ️ AuthContext: No active session, using cached data if available')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error initializing auth:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth state changed:', { event, hasSession: !!session })
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id, true)
        } else if (event === 'SIGNED_OUT') {
          clearUserData()
        }
      }
    )

    initializeAuth()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Background sync interval
  useEffect(() => {
    if (!isAuthenticated) return

    const syncInterval = setInterval(async () => {
      console.log('🔄 AuthContext: Background sync...')
      await refreshUserData()
    }, SYNC_INTERVAL)

    return () => clearInterval(syncInterval)
  }, [isAuthenticated])

  const loadUserData = async (userId: string, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true)
      }

      console.log('🔄 AuthContext: Loading user data for:', userId)
      
      const userData = await authService.getUserProfile(userId)
      
      if (userData) {
        console.log('✅ AuthContext: User data loaded successfully')
        setUser(userData)
        setIsGuest(false)
        
        // Cache the data
        cacheUserData(userData, { isGuest: false })
        
        if (isInitialLoad) {
          setLastSyncTime(Date.now())
        }
      } else {
        console.log('⚠️ AuthContext: No user data found')
        if (isInitialLoad) {
          clearUserData()
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Error loading user data:', error)
      if (isInitialLoad) {
        clearUserData()
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false)
      }
    }
  }

  const cacheUserData = (userData: AuthUser, authState: { isGuest: boolean }) => {
    try {
      localStorage.setItem(CACHE_KEYS.USER_DATA, JSON.stringify(userData))
      localStorage.setItem(CACHE_KEYS.AUTH_STATE, JSON.stringify(authState))
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString())
    } catch (error) {
      console.error('❌ AuthContext: Error caching user data:', error)
    }
  }

  const clearUserData = () => {
    setUser(null)
    setIsGuest(false)
    setLastSyncTime(null)
    
    // Clear cache
    localStorage.removeItem(CACHE_KEYS.USER_DATA)
    localStorage.removeItem(CACHE_KEYS.AUTH_STATE)
    localStorage.removeItem(CACHE_KEYS.LAST_SYNC)
  }

  const refreshUserData = useCallback(async () => {
    if (!user?.id) return

    try {
      console.log('🔄 AuthContext: Refreshing user data...')
      await loadUserData(user.id, false)
      setLastSyncTime(Date.now())
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing user data:', error)
    }
  }, [user?.id])

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Starting login process...', { email })
      setIsLoading(true)
      
      const response = await authService.login({ email, password })
      
      if (response.user) {
        console.log('✅ AuthContext: Login successful')
        setUser(response.user)
        cacheUserData(response.user, { isGuest: false })
        setLastSyncTime(Date.now())
        return { success: true }
      } else {
        console.error('❌ AuthContext: Login failed:', response.error)
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
        cacheUserData(response.user, { isGuest: false })
        setLastSyncTime(Date.now())
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
      const response = await authService.upgradeGuestAccount(data)
      
      if (response.user) {
        setUser(response.user)
        setIsGuest(false)
        cacheUserData(response.user, { isGuest: false })
        setLastSyncTime(Date.now())
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Account upgrade failed' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Account upgrade failed' 
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
      clearUserData()
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
    isInitializing,
    isGuest,
    lastSyncTime,
    login,
    register,
    upgradeGuestAccount,
    socialLogin,
    logout,
    sendEmailVerification,
    verifyEmail,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useOptimizedAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider')
  }
  return context
}













