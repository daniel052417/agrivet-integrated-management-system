import { supabase } from './supabase'
import { getAuthRedirectUrl } from '../utils/authUtils'
import { getManilaTimestamp } from '../utils/dateTime'

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
  requiresProfileCompletion?: boolean 
  requiresPasswordReset?: boolean
  passwordResetEmailSent?: boolean
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
      
      // Use Supabase Auth to create user (creates in auth.users automatically)
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

      console.log('✅ User created in auth.users:', authData.user.id)

      // Create customer record using Edge Function
      console.log('📞 Registration: Calling Edge Function to create customer...')
      const customerResult = await this.createCustomerViaEdgeFunction({
        user_id: authData.user.id,
        email: data.email,
        user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone
        },
        raw_user_meta_data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone
        },
        source: 'pwa-registration'
      })

      if (!customerResult.success) {
        console.error('❌ Registration: Edge Function failed:', customerResult.error)
        return {
          user: null,
          session: null,
          error: `User created but customer creation failed: ${customerResult.error}`
        }
      }

      console.log('✅ Customer record created via Edge Function:', customerResult.customer.id)
      
      // Get the full customer record
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (customerError || !customer) {
        console.error('❌ Registration: Could not fetch customer record:', customerError)
        return {
          user: null,
          session: null,
          error: 'User created but could not fetch customer record'
        }
      }

      // Convert to AuthUser format
      const publicUser: AuthUser = {
        id: authData.user.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        user_type: 'customer',
        is_active: customer.is_active,
        email_verified: authData.user.email_confirmed_at !== null,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        preferred_branch_id: customer.preferred_branch_id
      }

      return {
        user: publicUser,
        session: authData.session,
        error: null
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
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
      
      // Use Supabase Auth to sign in (checks auth.users)
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

        if (this.isInvalidCredentialsError(authError)) {
          const resetResult = await this.initiatePasswordResetFlow(credentials.email)
          return {
            user: null,
            session: null,
            error: resetResult.message,
            requiresPasswordReset: resetResult.requiresPasswordReset,
            passwordResetEmailSent: resetResult.emailSent
          }
        }

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

      // Get customer from public.customers using auth.users ID
      console.log('🔐 AuthService: Fetching customer data from customers table...', {
        authUserId: authData.user.id
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
        console.error('❌ AuthService: Customer not found:', customerError)
        return {
          user: null,
          session: null,
          error: 'Customer record not found. Please contact support.'
        }
      }

      // Convert customer to AuthUser format
      console.log('🔐 AuthService: Converting customer to AuthUser format...')
      const publicUser: AuthUser = {
        id: authData.user.id, // auth.users ID
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        user_type: 'customer',
        is_active: customer.is_active,
        email_verified: authData.user.email_confirmed_at !== null,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        preferred_branch_id: customer.preferred_branch_id
      }

      console.log('✅ AuthService: Login successful, returning user:', {
        authUserId: publicUser.id,
        email: publicUser.email,
        firstName: publicUser.first_name,
        isActive: publicUser.is_active,
        emailVerified: publicUser.email_verified
      })

      // Update last purchase date as proxy for last login
      await supabase
        .from('customers')
        .update({ 
          last_purchase_date: getManilaTimestamp(),
          updated_at: getManilaTimestamp()
        })
        .eq('user_id', authData.user.id)

      return {
        user: publicUser,
        session: authData.session,
        error: null
      }
    } catch (error) {
      console.error('❌ AuthService: Login caught an error:', error)
      if (this.isInvalidCredentialsError(error)) {
        const resetResult = await this.initiatePasswordResetFlow(credentials.email)
        return {
          user: null,
          session: null,
          error: resetResult.message,
          requiresPasswordReset: resetResult.requiresPasswordReset,
          passwordResetEmailSent: resetResult.emailSent
        }
      }

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
      console.log('🔐 Social Login: Starting OAuth flow with provider:', provider)
      const redirectUrl = getAuthRedirectUrl('/auth/callback')
      console.log('🔐 Social Login: Current origin:', window.location.origin)
      console.log('🔐 Social Login: Current URL:', window.location.href)
      console.log('🔐 Social Login: Redirect will be to:', redirectUrl)
      console.log('🔐 Social Login: Supabase client ready:', !!supabase)
      
      // Use Supabase Auth for social login (creates in auth.users automatically)
      console.log('🔐 Social Login: Calling supabase.auth.signInWithOAuth...')
      console.log('🔐 Social Login: Provider:', provider)
      console.log('🔐 Social Login: Using redirect URL:', redirectUrl)
      
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      console.log('🔐 Social Login: signInWithOAuth response:', { 
        hasData: !!data, 
        hasError: !!authError,
        errorMessage: authError?.message,
        errorCode: authError?.code,
        dataUrl: data?.url,
        dataProvider: data?.provider
      })

      if (authError) {
        console.error('❌ Social Login: Supabase Auth error:', authError)
        console.error('❌ Social Login: Error details:', {
          code: authError.code,
          message: authError.message,
          status: authError.status,
          statusText: authError.statusText
        })
        console.error('❌ Social Login: Full error object:', JSON.stringify(authError, null, 2))
        return {
          user: null,
          session: null,
          error: `Social login failed: ${authError.message}`
        }
      }

      console.log('✅ Social Login: OAuth redirect initiated successfully')
      console.log('✅ Social Login: Data received:', data)
      console.log('✅ Social Login: Redirect URL from Supabase:', data?.url)
      console.log('✅ Social Login: User will be redirected to provider')
      console.log('✅ Social Login: After OAuth, user will return to /auth/callback')
      
      // Check if we got a redirect URL
      if (data?.url) {
        console.log('🔄 Social Login: Redirecting to:', data.url)
        // The redirect should happen automatically, but let's log it
      } else {
        console.warn('⚠️ Social Login: No redirect URL received from Supabase')
        console.warn('⚠️ Social Login: This might indicate a configuration issue')
      }
      
      // Note: For OAuth, the user will be redirected to the provider
      // and then back to your app. The actual user creation happens
      // in the callback handler, not here.
      
      return {
        user: null,
        session: null,
        error: null
      }
    } catch (error) {
      console.error('❌ Social Login: Exception caught:', error)
      console.error('❌ Social Login: Error type:', typeof error)
      console.error('❌ Social Login: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Social login failed'
      }
    }
  }

  // ✅ Handle OAuth callback - Only uses auth.users + customers tables
  async handleOAuthCallback(provider?: string): Promise<AuthResponse> {
    try {
      console.log('🔐 OAuth Callback: Starting handler...', { provider })
  
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      
      // Exchange code for session if present
      if (code) {
        console.log('🔄 OAuth Callback: Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('❌ OAuth Callback: Code exchange failed:', error)
          return { 
            user: null, 
            session: null, 
            error: `OAuth code exchange failed: ${error.message}` 
          }
        }
      }
  
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        console.error('❌ OAuth Callback: No session found:', sessionError)
        return {
          user: null,
          session: null,
          error: 'OAuth callback failed - no session found after exchange',
        }
      }
  
      const authUser = session.user
      console.log('✅ OAuth Callback: Session found:', authUser.id)
  
      // Extract user data
      const email = authUser.email || ''
      if (!email) {
        return {
          user: null,
          session: null,
          error: 'No email found in OAuth account',
        }
      }
  
      const metadata = authUser.user_metadata || {}
      const fullName = metadata.full_name || metadata.name || ''
      const firstName = metadata.given_name || metadata.first_name || fullName.split(' ')[0] || email.split('@')[0] || 'User'
      const lastName = metadata.family_name || metadata.last_name || fullName.split(' ').slice(1).join(' ') || ''
      const phone = metadata.phone || metadata.phone_number || null
  
      // ✅ NEW: Check if customer exists
      console.log('🔍 OAuth Callback: Checking if customer exists...')
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()
  
      if (customerCheckError && customerCheckError.code !== 'PGRST116') {
        console.error('❌ OAuth Callback: Error checking customer:', customerCheckError)
        throw customerCheckError
      }
  
      // ✅ NEW: If no customer exists, require profile completion
      if (!existingCustomer) {
        console.log('📝 OAuth Callback: No customer found - profile completion required')
        
        const publicUser: AuthUser = {
          id: authUser.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          user_type: 'customer',
          is_active: true,
          email_verified: true,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at
        }
  
        return { 
          user: publicUser, 
          session, 
          error: null,
          requiresProfileCompletion: true  // ✅ Signal that profile is needed
        }
      }
  
      // Existing customer - proceed normally
      console.log('✅ OAuth Callback: Existing customer found:', existingCustomer.id)
      
      // Update customer last activity
      await supabase
        .from('customers')
        .update({
          last_purchase_date: getManilaTimestamp(),
          updated_at: getManilaTimestamp(),
        })
        .eq('id', existingCustomer.id)
  
      const publicUser: AuthUser = {
        id: authUser.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        user_type: 'customer',
        is_active: true,
        email_verified: true,
        created_at: existingCustomer.created_at,
        updated_at: existingCustomer.updated_at,
        preferred_branch_id: existingCustomer.preferred_branch_id
      }
  
      return { user: publicUser, session, error: null }
      
    } catch (error) {
      console.error('❌ OAuth Callback: Fatal error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
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

  // Create customer record via Edge Function
  private async createCustomerViaEdgeFunction(userData: {
    user_id: string
    email: string
    user_metadata: any
    raw_user_meta_data: any
    address?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    customer_type?: string
    source?: string
  }): Promise<{ success: boolean; customer?: any; error?: string }> {
    try {
      console.log('📞 Edge Function: Calling create-customer function...')
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(userData)
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('❌ Edge Function: HTTP error:', response.status, result)
        return { success: false, error: result.error || 'Edge Function failed' }
      }

      if (!result.success) {
        console.error('❌ Edge Function: Function error:', result.error)
        return { success: false, error: result.error }
      }

      console.log('✅ Edge Function: Customer created successfully:', result.customer)
      return { success: true, customer: result.customer }
      
    } catch (error) {
      console.error('❌ Edge Function: Network error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Edge Function call failed' 
      }
    }
  }

  private isInvalidCredentialsError(error: unknown): boolean {
    if (!error) return false
    const message = (error as { message?: string })?.message?.toLowerCase() ?? ''
    return message.includes('invalid login credentials')
  }

  private async initiatePasswordResetFlow(email: string): Promise<{ emailSent: boolean; requiresPasswordReset: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('/auth/password-reset')
      })

      if (error) {
        console.error('❌ AuthService: Failed to send password reset email:', error)
        return {
          emailSent: false,
          requiresPasswordReset: false,
          message: error.message || 'Invalid email or password'
        }
      }

      console.log('✉️ AuthService: Password reset email sent')
      return {
        emailSent: true,
        requiresPasswordReset: true,
        message: 'We couldn’t sign you in. If you originally used Google, check your email to set a password.'
      }
    } catch (err) {
      console.error('❌ AuthService: Error initiating password reset flow:', err)
      return {
        emailSent: false,
        requiresPasswordReset: false,
        message: 'Invalid email or password'
      }
    }
  }
}

export const authService = new AuthService()