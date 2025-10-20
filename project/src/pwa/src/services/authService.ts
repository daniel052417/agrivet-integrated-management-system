import { supabase } from './supabase'

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
  preferred_branch_id?: string
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
    // Anonymous session is now initialized at app level
    // No need to initialize here to prevent duplicate calls
  }

  // Register a new PWA customer using Supabase Auth
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting to register user:', data.email)
      
      // Use Supabase Auth to create user with customer role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            customer_type: 'individual'
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

      console.log('✅ User created in auth.users, trigger should create public.customers record')

      // Wait a moment for the trigger to create the public.customers record
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get the customer from public.customers (created by trigger)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (customerError || !customer) {
        console.error('❌ Error getting customer from public.customers:', customerError)
        return {
          user: null,
          session: null,
          error: 'User created but failed to retrieve customer data'
        }
      }

      // Convert customer to AuthUser format
      const publicUser: AuthUser = {
        id: customer.user_id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        user_type: 'customer',
        is_active: customer.is_active,
        email_verified: authData.user.email_confirmed_at !== null,
        created_at: customer.created_at,
        updated_at: customer.updated_at
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
      console.log('🔐 AuthService: Starting login process...', {
        email: credentials.email,
        passwordLength: credentials.password.length
      })
      
      // Use Supabase Auth to sign in
      console.log('🔐 AuthService: Calling Supabase auth.signInWithPassword...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      console.log('🔐 AuthService: Supabase auth response:', {
        hasUser: !!authData.user,
        hasSession: !!authData.session,
        error: authError,
        userEmail: authData.user?.email,
        userId: authData.user?.id
      })

      if (authError) {
        console.error('❌ AuthService: Supabase Auth error:', authError)
        return {
          user: null,
          session: null,
          error: 'Invalid email or password'
        }
      }

      if (!authData.user) {
        console.error('❌ AuthService: No user data returned from Supabase Auth')
        return {
          user: null,
          session: null,
          error: 'Login failed: No user data returned'
        }
      }

      // Get customer from public.customers
      console.log('🔐 AuthService: Fetching customer data from customers table...', {
        userId: authData.user.id
      })
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      console.log('🔐 AuthService: Customer query result:', {
        hasCustomer: !!customer,
        customerError: customerError,
        customerId: customer?.id,
        customerEmail: customer?.email
      })

      if (customerError || !customer) {
        console.error('❌ AuthService: Error getting customer from public.customers:', customerError)
        return {
          user: null,
          session: null,
          error: 'Customer not found in public.customers'
        }
      }

      // Convert customer to AuthUser format
      console.log('🔐 AuthService: Converting customer to AuthUser format...')
      const publicUser: AuthUser = {
        id: customer.user_id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        user_type: 'customer',
        is_active: customer.is_active,
        email_verified: authData.user.email_confirmed_at !== null,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      }

      console.log('✅ AuthService: Login successful, returning user:', {
        userId: publicUser.id,
        email: publicUser.email,
        firstName: publicUser.first_name,
        isActive: publicUser.is_active,
        emailVerified: publicUser.email_verified
      })

      // Update last login (if you have this field in customers table)
      // await supabase
      //   .from('customers')
      //   .update({ last_login: new Date().toISOString() })
      //   .eq('user_id', publicUser.id)

      // Session will be handled by Supabase Auth and pwa_sessions
      return {
        user: publicUser,
        session: null, // Session managed by Supabase Auth
        error: null
      }
    } catch (error) {
      console.error('❌ AuthService: Login caught an error:', error)
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
      const { error: authError } = await supabase.auth.signInWithOAuth({
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

  // Send email verification
  async sendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email verification failed' 
      }
    }
  }

  // Verify email with code
  async verifyEmail(code: string, email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token: code,
        type: 'email',
        email: email
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email verification failed' 
      }
    }
  }
}

export const authService = new AuthService()
