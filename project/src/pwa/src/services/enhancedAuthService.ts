// ============================================================================
// ENHANCED AUTHENTICATION SERVICE
// ============================================================================
// This service provides a robust authentication flow with automatic customer
// creation, guest user support, and proper error handling

import { supabase } from './supabase'
import { getAuthRedirectUrl } from '../utils/authUtils'

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  address?: string
  city?: string
  province?: string
  date_of_birth?: string
  customer_type?: 'individual' | 'business'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  user_type: 'customer'
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
  customer_number?: string
  customer_code?: string
  is_guest?: boolean
}

export interface AuthResponse {
  user: AuthUser | null
  session: any | null
  error?: string
}

export interface GuestUpgradeData {
  first_name: string
  last_name: string
  phone?: string
  address?: string
  city?: string
  province?: string
  date_of_birth?: string
  customer_type?: 'individual' | 'business'
}

// ============================================================================
// ENHANCED AUTHENTICATION SERVICE
// ============================================================================

class EnhancedAuthService {
  constructor() {
    console.log('🔧 EnhancedAuthService: Service initialized')
  }

  // ============================================================================
  // CUSTOMER REGISTRATION
  // ============================================================================

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔐 EnhancedAuth: Starting customer registration...', { email: data.email })
      
      // Prepare user metadata
      const userMetaData = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        province: data.province,
        date_of_birth: data.date_of_birth,
        customer_type: data.customer_type || 'individual'
      }

      // Use Supabase Auth to create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetaData,
          emailRedirectTo: getAuthRedirectUrl('/auth/callback')
        }
      })

      if (authError) {
        console.error('❌ EnhancedAuth: Auth signup error:', authError)
        return {
          user: null,
          session: null,
          error: `Registration failed: ${authError.message}`
        }
      }

      if (!authData.user) {
        console.error('❌ EnhancedAuth: No user data returned')
        return {
          user: null,
          session: null,
          error: 'Registration failed: No user data returned'
        }
      }

      console.log('✅ EnhancedAuth: User created in auth.users, waiting for trigger...')

      // Wait for trigger to create customer record (with retry logic)
      const customer = await this.waitForCustomerRecord(authData.user.id, 3)
      
      if (!customer) {
        console.error('❌ EnhancedAuth: Customer record not created by trigger')
        return {
          user: null,
          session: null,
          error: 'User created but customer record not found. Please try logging in.'
        }
      }

      console.log('✅ EnhancedAuth: Customer record found:', customer.customer_code)

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
        updated_at: customer.updated_at,
        customer_number: customer.customer_number,
        customer_code: customer.customer_code,
        is_guest: customer.is_guest || false
      }

      // Session will be handled by Supabase Auth and pwa_sessions
      return {
        user: publicUser,
        session: null, // Session managed by Supabase Auth
        error: null
      }
    } catch (error) {
      console.error('❌ EnhancedAuth: Registration error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  // ============================================================================
  // CUSTOMER LOGIN
  // ============================================================================

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 EnhancedAuth: Starting customer login...', { email: credentials.email })
      
      // Use Supabase Auth to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        console.error('❌ EnhancedAuth: Auth login error:', authError)
        return {
          user: null,
          session: null,
          error: 'Invalid email or password'
        }
      }

      if (!authData.user) {
        console.error('❌ EnhancedAuth: No user data returned')
        return {
          user: null,
          session: null,
          error: 'Login failed: No user data returned'
        }
      }

      console.log('✅ EnhancedAuth: User authenticated, fetching customer data...')

      // Get customer from public.customers
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (customerError || !customer) {
        console.error('❌ EnhancedAuth: Customer not found:', customerError)
        return {
          user: null,
          session: null,
          error: 'Customer profile not found. Please contact support.'
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
        updated_at: customer.updated_at,
        customer_number: customer.customer_number,
        customer_code: customer.customer_code,
        is_guest: customer.is_guest || false
      }

      // Update last login
      await supabase
        .from('customers')
        .update({ updated_at: new Date().toISOString() })
        .eq('user_id', publicUser.id)

      // Session will be handled by Supabase Auth and pwa_sessions
      return {
        user: publicUser,
        session: null, // Session managed by Supabase Auth
        error: null
      }
    } catch (error) {
      console.error('❌ EnhancedAuth: Login error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  // ============================================================================
  // GUEST USER SUPPORT
  // ============================================================================

  async createGuestUser(): Promise<AuthResponse> {
    try {
      console.log('👤 EnhancedAuth: Creating guest user...')
      
      // Create anonymous session
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

      if (authError || !authData.user) {
        console.error('❌ EnhancedAuth: Failed to create anonymous session:', authError)
        return {
          user: null,
          session: null,
          error: 'Failed to create guest session'
        }
      }

      // Create guest customer record
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: authData.user.id,
          email: `guest_${authData.user.id}@temp.com`,
          first_name: 'Guest',
          last_name: 'User',
          is_active: true,
          is_guest: true
        })
        .select()
        .single()

      if (customerError) {
        console.error('❌ EnhancedAuth: Failed to create guest customer:', customerError)
        return {
          user: null,
          session: null,
          error: 'Failed to create guest profile'
        }
      }

      const guestUser: AuthUser = {
        id: customer.user_id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        user_type: 'customer',
        is_active: customer.is_active,
        email_verified: false,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        customer_number: customer.customer_number,
        customer_code: customer.customer_code,
        is_guest: true
      }

      // Session will be handled by Supabase Auth and pwa_sessions
      return {
        user: guestUser,
        session: null, // Session managed by Supabase Auth
        error: null
      }
    } catch (error) {
      console.error('❌ EnhancedAuth: Guest creation error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Failed to create guest user'
      }
    }
  }

  async upgradeGuestToCustomer(guestUserId: string, data: GuestUpgradeData): Promise<AuthResponse> {
    try {
      console.log('🔄 EnhancedAuth: Upgrading guest to customer...', { guestUserId })
      
      // Call the database function to upgrade guest
      const { data: result, error } = await supabase.rpc('upgrade_guest_to_customer', {
        guest_user_id: guestUserId,
        customer_data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          province: data.province,
          date_of_birth: data.date_of_birth,
          customer_type: data.customer_type || 'individual'
        }
      })

      if (error || !result) {
        console.error('❌ EnhancedAuth: Failed to upgrade guest:', error)
        return {
          user: null,
          session: null,
          error: 'Failed to upgrade guest account'
        }
      }

      // Fetch the updated customer record
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', guestUserId)
        .single()

      if (customerError || !customer) {
        console.error('❌ EnhancedAuth: Failed to fetch upgraded customer:', customerError)
        return {
          user: null,
          session: null,
          error: 'Failed to fetch upgraded customer data'
        }
      }

      const upgradedUser: AuthUser = {
        id: customer.user_id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        user_type: 'customer',
        is_active: customer.is_active,
        email_verified: false, // Will be true after email confirmation
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        customer_number: customer.customer_number,
        customer_code: customer.customer_code,
        is_guest: false
      }

      return {
        user: upgradedUser,
        session: null, // Keep existing session
        error: null
      }
    } catch (error) {
      console.error('❌ EnhancedAuth: Guest upgrade error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Failed to upgrade guest account'
      }
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async waitForCustomerRecord(userId: string, maxRetries: number = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`🔄 EnhancedAuth: Waiting for customer record (attempt ${i + 1}/${maxRetries})...`)
      
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (customer && !error) {
        console.log('✅ EnhancedAuth: Customer record found')
        return customer
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      }
    }

    console.error('❌ EnhancedAuth: Customer record not found after retries')
    return null
  }


  // ============================================================================
  // LOGOUT
  // ============================================================================

  async logout(): Promise<void> {
    try {
      // Sign out from Supabase Auth
      await supabase.auth.signOut()
      
      // Clear local session
      localStorage.removeItem('pwa_session_token')
      
      console.log('✅ EnhancedAuth: User logged out successfully')
    } catch (error) {
      console.error('❌ EnhancedAuth: Logout error:', error)
    }
  }

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (customerError || !customer) {
        return null
      }

      return {
        id: customer.user_id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        user_type: 'customer',
        is_active: customer.is_active,
        email_verified: user.email_confirmed_at !== null,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        customer_number: customer.customer_number,
        customer_code: customer.customer_code,
        is_guest: customer.is_guest || false
      }
    } catch (error) {
      console.error('❌ EnhancedAuth: Get current user error:', error)
      return null
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const enhancedAuthService = new EnhancedAuthService()
export default enhancedAuthService


