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

      // Wait a moment for any database triggers
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create customer record manually (linked to auth.users via user_id)
      const timestamp = Date.now().toString().slice(-8)
      const customerNumber = `CUST-${timestamp}`
      const customerCode = `C${timestamp}`

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: authData.user.id, // Links to auth.users
          customer_number: customerNumber,
          customer_code: customerCode,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          customer_type: 'individual',
          is_active: true,
          is_guest: false,
          registration_date: new Date().toISOString(),
          total_spent: 0.00,
          total_lifetime_spent: 0.00,
          loyalty_points: 0,
          loyalty_tier: 'bronze',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (customerError || !customer) {
        console.error('❌ Error creating customer:', customerError)
        return {
          user: null,
          session: null,
          error: 'User created but failed to create customer record'
        }
      }

      console.log('✅ Customer record created:', customer.id)

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
          last_purchase_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authData.user.id)

      return {
        user: publicUser,
        session: authData.session,
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
      console.log('🔐 Current origin:', window.location.origin)
      console.log('🔐 Redirect will be to:', `${window.location.origin}/auth/callback`)
      
      // Use Supabase Auth for social login (creates in auth.users automatically)
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `http://localhost:3001/auth/callback`,
          skipBrowserRedirect: false
        }
      })

      console.log('🔐 signInWithOAuth response:', { data, error: authError })

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
        error: null
      }
    } catch (error) {
      console.error('❌ Social login exception:', error)
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

      // Step 1: Check if we have a code to exchange (PKCE flow)
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      
      console.log('🔍 OAuth Callback: Checking URL params...', {
        hasCode: !!code,
        fullURL: window.location.href
      })

      // Step 2: Exchange code for session if present
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
        
        console.log('✅ OAuth Callback: Code exchange successful')
      }

      // Step 3: Get the current session from auth.users
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
      console.log('✅ OAuth Callback: Session found from auth.users:', {
        authUserId: authUser.id,
        email: authUser.email,
        provider: authUser.app_metadata?.provider
      })

      // Step 4: Extract user data from OAuth metadata
      const email = authUser.email || ''
      if (!email) {
        console.error('❌ OAuth Callback: No email in user data')
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

      console.log('👤 OAuth Callback: Extracted user data:', {
        email,
        firstName,
        lastName,
        phone,
        authUserId: authUser.id
      })

      // Step 5: Check if customer exists (linked to auth.users via user_id)
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (customerCheckError && customerCheckError.code !== 'PGRST116') {
        console.error('❌ OAuth Callback: Error checking customer:', customerCheckError)
        throw customerCheckError
      }

      let customer: any

      if (existingCustomer) {
        console.log('✅ OAuth Callback: Existing customer found:', existingCustomer.id)
        
        // Update customer last activity
        await supabase
          .from('customers')
          .update({
            last_purchase_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCustomer.id)
        
        customer = existingCustomer
      } else {
        // Step 6: Create new customer record (auth.users already exists from OAuth)
        console.log('📝 OAuth Callback: Creating new customer record...')
        console.log('📝 OAuth Callback: auth.users ID:', authUser.id)
        console.log('📝 OAuth Callback: Will create customer with data:', {
          firstName,
          lastName,
          email,
          phone,
          authUserId: authUser.id
        })
        
        // Generate unique customer identifiers
        const timestamp = Date.now().toString().slice(-8)
        const customerNumber = `CUST-${timestamp}`
        const customerCode = `C${timestamp}`
        
        console.log('📝 OAuth Callback: Generated IDs:', {
          customerNumber,
          customerCode,
          timestamp
        })

        console.log('📝 OAuth Callback: Attempting INSERT into customers table...')
        
        const { data: newCustomer, error: createCustomerError } = await supabase
          .from('customers')
          .insert({
            user_id: authUser.id, // Links to auth.users
            customer_number: customerNumber,
            customer_code: customerCode,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            customer_type: 'individual',
            is_active: true,
            is_guest: false,
            registration_date: new Date().toISOString(),
            total_spent: 0.00,
            total_lifetime_spent: 0.00,
            loyalty_points: 0,
            loyalty_tier: 'bronze',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single()

        console.log('📝 OAuth Callback: INSERT completed')
        console.log('📝 OAuth Callback: New customer data:', newCustomer)
        console.log('📝 OAuth Callback: Insert error:', createCustomerError)

        if (createCustomerError) {
          console.error('❌ OAuth Callback: Error creating customer:', createCustomerError)
          console.error('❌ OAuth Callback: Error details:', {
            code: createCustomerError.code,
            message: createCustomerError.message,
            details: createCustomerError.details,
            hint: createCustomerError.hint
          })
          console.error('❌ OAuth Callback: Full error object:', JSON.stringify(createCustomerError, null, 2))
          
          // Check if it's an RLS policy error
          if (createCustomerError.code === '42501' || createCustomerError.message?.includes('policy')) {
            console.error('❌ OAuth Callback: This is an RLS POLICY error!')
            console.error('❌ OAuth Callback: You need to check your Row Level Security policies on the customers table')
          }
          
          // Check if it's a foreign key error
          if (createCustomerError.code === '23503') {
            console.error('❌ OAuth Callback: This is a FOREIGN KEY error!')
            console.error('❌ OAuth Callback: The user_id column might not be properly set up')
          }
          
          throw createCustomerError
        }

        customer = newCustomer
        console.log('✅ OAuth Callback: Customer created successfully!')
        console.log('✅ OAuth Callback: Customer ID:', customer.id)
        console.log('✅ OAuth Callback: Customer email:', customer.email)
      }

      if (!customer) {
        throw new Error('Customer record not found or created.')
      }

      // Step 7: Return AuthUser format
      const publicUser: AuthUser = {
        id: authUser.id, // This is the auth.users ID
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        user_type: 'customer',
        is_active: true,
        email_verified: true,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        preferred_branch_id: customer.preferred_branch_id
      }

      console.log('✅ OAuth Callback: Success! User ready:', {
        authUserId: publicUser.id,
        email: publicUser.email,
        customerEmail: customer.email
      })
      
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
}

export const authService = new AuthService()