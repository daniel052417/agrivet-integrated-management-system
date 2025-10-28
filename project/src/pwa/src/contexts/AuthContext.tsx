import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, AuthUser } from '../services/authService'
import { supabase } from '../services/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isGuest: boolean
  needsProfile: boolean
  pendingEmailVerification: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
  }) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>
  upgradeGuestAccount: (data: any) => Promise<{ success: boolean; error?: string }>
  socialLogin: (provider: 'google' | 'facebook') => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  sendEmailVerification: (email: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (code: string, email: string) => Promise<{ success: boolean; error?: string }>
  markProfileComplete: () => void
  checkEmailVerification: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [needsProfile, setNeedsProfile] = useState(false)
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false)
  const navigate = useNavigate()

  const isAuthenticated = !!user

  // Load cached user data immediately
  useEffect(() => {
    const cachedUser = localStorage.getItem('agrivet_user_cache')
    if (cachedUser) {
      const userData = JSON.parse(cachedUser)
      setUser(userData)
      console.log('✅ Loaded cached user')
      
      // Check if user has pending email verification
      if (!userData.email_verified) {
        setPendingEmailVerification(true)
      }
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session?.user && !error) {
          console.log('🔄 Found active session, loading user data...')
          
          // Check if email is verified
          const emailVerified = session.user.email_confirmed_at !== null
          if (!emailVerified) {
            setPendingEmailVerification(true)
            console.log('⚠️ Email not verified yet')
          }
          
          const result = await loadUserData(session.user.id)
          if (!result.found) {
            console.log('⚠️ No customer record found – redirecting to profile completion')
            setNeedsProfile(true)
            
            // Store temporary user data for profile completion
            const tempUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              phone: session.user.user_metadata?.phone || '',
              user_type: 'customer',
              is_active: true,
              email_verified: emailVerified,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at
            }
            setUser(tempUser)
            
            // Navigate to profile completion
            navigate('/complete-profile')
          }
        }
      } catch (error) {
        console.error('❌ Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔔 Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const emailVerified = session.user.email_confirmed_at !== null
          setPendingEmailVerification(!emailVerified)
          
          const result = await loadUserData(session.user.id)
          if (!result.found) {
            setNeedsProfile(true)
            
            // Store temporary user data for profile completion
            const tempUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              phone: session.user.user_metadata?.phone || '',
              user_type: 'customer',
              is_active: true,
              email_verified: emailVerified,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at
            }
            setUser(tempUser)
            
            navigate('/complete-profile')
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setNeedsProfile(false)
          setPendingEmailVerification(false)
        } else if (event === 'USER_UPDATED') {
          // Check if email has been verified
          if (session?.user) {
            const emailVerified = session.user.email_confirmed_at !== null
            setPendingEmailVerification(!emailVerified)
            
            if (user) {
              const updatedUser = { ...user, email_verified: emailVerified }
              setUser(updatedUser)
              localStorage.setItem('agrivet_user_cache', JSON.stringify(updatedUser))
            }
          }
        }
      }
    )

    checkSession()
    return () => subscription.unsubscribe()
  }, [navigate])

  const loadUserData = async (userId?: string): Promise<{ found: boolean; data?: any }> => {
    if (!userId) return { found: false }
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error || !customer) return { found: false }

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
        preferred_branch_id: customer.preferred_branch_id,
      }

      setUser(authUser)
      setIsGuest(false)
      localStorage.setItem('agrivet_user_cache', JSON.stringify(authUser))
      return { found: true, data: authUser }
    } catch (err) {
      console.error('❌ Error loading user data:', err)
      return { found: false }
    }
  }

  const markProfileComplete = () => {
    setNeedsProfile(false)
    navigate('/catalog')
  }

  const checkEmailVerification = async (email: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email === email) {
        return user.email_confirmed_at !== null
      }
      return false
    } catch (error) {
      console.error('Error checking email verification:', error)
      return false
    }
  }

  // Enhanced login with email verification check
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authService.login({ email, password })
      
      if (response.error) {
        // Check if error is due to unverified email
        if (response.error.includes('Email not confirmed')) {
          setPendingEmailVerification(true)
          return { 
            success: false, 
            error: 'Please verify your email before logging in. Check your inbox for the verification link.',
            requiresVerification: true
          }
        }
        return { success: false, error: response.error }
      }
      
      if (response.user) {
        setUser(response.user)
        setPendingEmailVerification(!response.user.email_verified)
        
        // If email not verified, return special response
        if (!response.user.email_verified) {
          return { 
            success: false, 
            error: 'Please verify your email before logging in.',
            requiresVerification: true
          }
        }
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced register with automatic email verification flag
  const register = async (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data)
      
      if (response.error) {
        return { success: false, error: response.error }
      }
      
      // Registration successful - set pending verification flag
      setPendingEmailVerification(true)
      
      // Store the user but don't navigate yet
      if (response.user) {
        setUser(response.user)
      }
      
      return { 
        success: true, 
        requiresVerification: true 
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    } finally {
      setIsLoading(false)
    }
  }

  const socialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const response = await authService.socialLogin(provider)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setNeedsProfile(false)
    setPendingEmailVerification(false)
    localStorage.removeItem('agrivet_user_cache')
    navigate('/auth-selection')
  }

  const sendEmailVerification = async (email: string) => {
    return authService.sendEmailVerification(email)
  }

  const verifyEmail = async (code: string, email: string) => {
    const result = await authService.verifyEmail(code, email)
    if (result.success) {
      setPendingEmailVerification(false)
    }
    return result
  }

  const upgradeGuestAccount = async (data: any) => {
    // Implementation for guest account upgrade
    return { success: false, error: 'Not implemented' }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isGuest,
    needsProfile,
    pendingEmailVerification,
    login,
    register,
    upgradeGuestAccount,
    socialLogin,
    logout,
    sendEmailVerification,
    verifyEmail,
    markProfileComplete,
    checkEmailVerification,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}