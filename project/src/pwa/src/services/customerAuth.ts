import { supabase } from './supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface Customer {
  id: string
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  postal_code?: string
  date_of_birth?: string
  customer_type: 'individual' | 'business'
  registration_date: string
  is_active: boolean
  total_spent: number
  last_purchase_date?: string
  loyalty_points: number
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  total_lifetime_spent: number
  assigned_staff_id?: string
  created_at: string
  updated_at: string
}

export interface SignUpData {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  postal_code?: string
  date_of_birth?: string
  customer_type?: 'individual' | 'business'
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  customer?: Customer
  error?: string
}

// ============================================================================
// CUSTOMER AUTHENTICATION SERVICE
// ============================================================================

class CustomerAuthService {
  /**
   * Sign up a new customer with email and password
   */
  async signUpWithEmail(data: SignUpData): Promise<AuthResponse> {
    try {
      console.log('🔄 CustomerAuth: Starting email signup...', { email: data.email })
      
      // Prepare user metadata
      const userMetaData = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
        date_of_birth: data.date_of_birth,
        customer_type: data.customer_type || 'individual'
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetaData,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        console.error('❌ CustomerAuth: Auth signup error:', authError)
        return {
          success: false,
          error: authError.message
        }
      }

      if (!authData.user) {
        console.error('❌ CustomerAuth: No user data returned')
        return {
          success: false,
          error: 'No user data returned from signup'
        }
      }

      console.log('✅ CustomerAuth: User created successfully:', authData.user.id)

      // Wait a moment for the trigger to create the customer record
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Fetch the customer profile
      const customer = await this.getCurrentCustomer()
      
      if (customer) {
        console.log('✅ CustomerAuth: Customer profile created successfully')
        return {
          success: true,
          customer
        }
      } else {
        console.warn('⚠️ CustomerAuth: Customer profile not found after signup')
        return {
          success: true,
          error: 'Customer profile will be created after email verification'
        }
      }
    } catch (error) {
      console.error('❌ CustomerAuth: Signup error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(data: SignInData): Promise<AuthResponse> {
    try {
      console.log('🔄 CustomerAuth: Starting email signin...', { email: data.email })
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) {
        console.error('❌ CustomerAuth: Auth signin error:', authError)
        return {
          success: false,
          error: authError.message
        }
      }

      if (!authData.user) {
        console.error('❌ CustomerAuth: No user data returned')
        return {
          success: false,
          error: 'No user data returned from signin'
        }
      }

      console.log('✅ CustomerAuth: User signed in successfully:', authData.user.id)

      // Fetch the customer profile
      const customer = await this.getCurrentCustomer()
      
      if (customer) {
        console.log('✅ CustomerAuth: Customer profile loaded successfully')
        return {
          success: true,
          customer
        }
      } else {
        console.warn('⚠️ CustomerAuth: Customer profile not found')
        return {
          success: false,
          error: 'Customer profile not found. Please contact support.'
        }
      }
    } catch (error) {
      console.error('❌ CustomerAuth: Signin error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      console.log('🔄 CustomerAuth: Starting Google signin...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) {
        console.error('❌ CustomerAuth: Google OAuth error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      console.log('✅ CustomerAuth: Google OAuth initiated successfully')
      return {
        success: true
      }
    } catch (error) {
      console.error('❌ CustomerAuth: Google signin error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get the current customer's profile
   */
  async getCurrentCustomer(): Promise<Customer | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('🔄 CustomerAuth: No authenticated user')
        return null
      }

      console.log('🔄 CustomerAuth: Fetching customer profile for user:', user.id)

      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('❌ CustomerAuth: Error fetching customer profile:', error)
        return null
      }

      console.log('✅ CustomerAuth: Customer profile loaded:', customer)
      return customer
    } catch (error) {
      console.error('❌ CustomerAuth: Error getting current customer:', error)
      return null
    }
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(updates: Partial<Customer>): Promise<AuthResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user'
        }
      }

      console.log('🔄 CustomerAuth: Updating customer profile...')

      const { data: customer, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ CustomerAuth: Error updating customer profile:', error)
        return {
          success: false,
          error: error.message
        }
      }

      console.log('✅ CustomerAuth: Customer profile updated successfully')
      return {
        success: true,
        customer
      }
    } catch (error) {
      console.error('❌ CustomerAuth: Error updating customer profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 CustomerAuth: Signing out...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ CustomerAuth: Signout error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      console.log('✅ CustomerAuth: Signed out successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ CustomerAuth: Signout error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch (error) {
      console.error('❌ CustomerAuth: Error checking authentication:', error)
      return false
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('❌ CustomerAuth: Error getting session:', error)
      return null
    }
  }
}

// Export singleton instance
export const customerAuthService = new CustomerAuthService()

// Export types
export type { Customer, SignUpData, SignInData, AuthResponse }









