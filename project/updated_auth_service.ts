import { supabase, initializeAnonymousSession } from './supabase'

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  user_type: 'staff' | 'customer' | 'admin'
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

export interface AuthResponse {
  user: AuthUser | null
  session: any | null
  error: string | null
}

class AuthService {
  constructor() {
    // Initialize anonymous session for RLS access
    this.initializeSession()
  }

  private async initializeSession() {
    try {
      await initializeAnonymousSession()
    } catch (error) {
      console.error('Failed to initialize anonymous session:', error)
    }
  }

  // Register a new PWA customer using Supabase Auth
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting to register user:', data.email)
      
      // Use Supabase Auth to create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone
          }
        }
      })

      if (authError) {
        console.error('❌ Supabase Auth error:', authError)
        return {
          user: null,
          session: null,
          error: `Registration failed: ${authError.message}`
        }
      }

      if (!authData.user) {
        return {
          user: null,
          session: null,
          error: 'Registration failed: No user data returned'
        }
      }

      console.log('✅ User created in auth.users, trigger should create public.users record')

      // Wait a moment for the trigger to create the public.users record
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get the user from public.users (created by trigger)
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError || !publicUser) {
        console.error('❌ Error getting user from public.users:', userError)
        return {
          user: null,
          session: null,
          error: 'User created but failed to retrieve user data'
        }
      }

      // Session will be handled by Supabase Auth and pwa_sessions
      return {
        user: publicUser,
        session: null, // Session managed by Supabase Auth
        error: null
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  // Login with email and password using Supabase Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting to login user:', credentials.email)
      
      // Use Supabase Auth to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        console.error('❌ Supabase Auth error:', authError)
        return {
          user: null,
          session: null,
          error: 'Invalid email or password'
        }
      }

      if (!authData.user) {
        return {
          user: null,
          session: null,
          error: 'Login failed: No user data returned'
        }
      }

      // Get user from public.users
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('user_type', 'customer')
        .single()

      if (userError || !publicUser) {
        console.error('❌ Error getting user from public.users:', userError)
        return {
          user: null,
          session: null,
          error: 'User not found in public.users'
        }
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', publicUser.id)

      // Session will be handled by Supabase Auth and pwa_sessions
      return {
        user: publicUser,
        session: null, // Session managed by Supabase Auth
        error: null
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  // Social login (Google/Facebook) using Supabase Auth
  async socialLogin(provider: 'google' | 'facebook'): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting social login with:', provider)
      
      // Use Supabase Auth for social login
      const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        console.error('❌ Supabase Auth error:', authError)
        return {
          user: null,
          session: null,
          error: `Social login failed: ${authError.message}`
        }
      }

      // Note: For OAuth, the user will be redirected to the provider
      // and then back to your app. The actual user creation happens
      // in the callback handler, not here.
      
      return {
        user: null,
        session: null,
        error: null // No error, but user needs to complete OAuth flow
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Social login failed'
      }
    }
  }

  // Handle OAuth callback
  async handleOAuthCallback(): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()

      if (authError || !authData.session?.user) {
        return {
          user: null,
          session: null,
          error: 'OAuth callback failed'
        }
      }

      // Get user from public.users (created by trigger)
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.session.user.id)
        .single()

      if (userError || !publicUser) {
        console.error('❌ Error getting user from public.users:', userError)
        return {
          user: null,
          session: null,
          error: 'User not found in public.users'
        }
      }

      // Session will be handled by Supabase Auth and pwa_sessions
      return {
        user: publicUser,
        session: null, // Session managed by Supabase Auth
        error: null
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'OAuth callback failed'
      }
    }
  }

  // Logout
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // Sign out from Supabase Auth (this handles session cleanup)
      await supabase.auth.signOut()

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      }
    }
  }
}

export const authService = new AuthService()

