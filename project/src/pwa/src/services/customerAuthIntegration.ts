import { customerAuthService, Customer, CustomerSignUpData, CustomerSignInData, CustomerAuthResponse } from './customerAuthService'

// ============================================================================
// CUSTOMER AUTH INTEGRATION
// ============================================================================
// This file provides a bridge between the existing auth system and the new customer system

export interface AuthUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  postal_code?: string
  date_of_birth?: string
  customer_type?: 'individual' | 'business'
  registration_date?: string
  is_active?: boolean
  total_spent?: number
  last_purchase_date?: string
  loyalty_points?: number
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
  total_lifetime_spent?: number
  assigned_staff_id?: string
  created_at?: string
  updated_at?: string
}

export interface AuthResponse {
  user: AuthUser | null
  session: any | null
  error: string | null
}

// Convert Customer to AuthUser format for compatibility
const customerToAuthUser = (customer: Customer): AuthUser => ({
  id: customer.id,
  email: customer.email,
  first_name: customer.first_name,
  last_name: customer.last_name,
  phone: customer.phone,
  address: customer.address,
  city: customer.city,
  province: customer.province,
  postal_code: customer.postal_code,
  date_of_birth: customer.date_of_birth,
  customer_type: customer.customer_type,
  registration_date: customer.registration_date,
  is_active: customer.is_active,
  total_spent: customer.total_spent,
  last_purchase_date: customer.last_purchase_date,
  loyalty_points: customer.loyalty_points,
  loyalty_tier: customer.loyalty_tier,
  total_lifetime_spent: customer.total_lifetime_spent,
  assigned_staff_id: customer.assigned_staff_id,
  created_at: customer.created_at,
  updated_at: customer.updated_at
})

class CustomerAuthIntegration {
  /**
   * Register a new customer (compatible with existing auth system)
   */
  async register(data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
  }): Promise<AuthResponse> {
    try {
      console.log('🔄 CustomerAuthIntegration: Starting customer registration...')
      
      const customerData: CustomerSignUpData = {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        customer_type: 'individual'
      }

      const result = await customerAuthService.signUpWithEmail(customerData)
      
      if (result.success && result.customer) {
        const authUser = customerToAuthUser(result.customer)
        return {
          user: authUser,
          session: null, // Session will be handled by Supabase Auth
          error: null
        }
      } else {
        return {
          user: null,
          session: null,
          error: result.error || 'Registration failed'
        }
      }
    } catch (error) {
      console.error('❌ CustomerAuthIntegration: Registration error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  /**
   * Login a customer (compatible with existing auth system)
   */
  async login(credentials: {
    email: string
    password: string
  }): Promise<AuthResponse> {
    try {
      console.log('🔄 CustomerAuthIntegration: Starting customer login...')
      
      const customerData: CustomerSignInData = {
        email: credentials.email,
        password: credentials.password
      }

      const result = await customerAuthService.signInWithEmail(customerData)
      
      if (result.success && result.customer) {
        const authUser = customerToAuthUser(result.customer)
        return {
          user: authUser,
          session: null, // Session will be handled by Supabase Auth
          error: null
        }
      } else {
        return {
          user: null,
          session: null,
          error: result.error || 'Login failed'
        }
      }
    } catch (error) {
      console.error('❌ CustomerAuthIntegration: Login error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  /**
   * Get current customer (compatible with existing auth system)
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const customer = await customerAuthService.getCurrentCustomer()
      return customer ? customerToAuthUser(customer) : null
    } catch (error) {
      console.error('❌ CustomerAuthIntegration: Error getting current user:', error)
      return null
    }
  }

  /**
   * Update customer profile (compatible with existing auth system)
   */
  async updateProfile(updates: Partial<AuthUser>): Promise<AuthResponse> {
    try {
      const result = await customerAuthService.updateCustomerProfile(updates)
      
      if (result.success && result.customer) {
        const authUser = customerToAuthUser(result.customer)
        return {
          user: authUser,
          session: null,
          error: null
        }
      } else {
        return {
          user: null,
          session: null,
          error: result.error || 'Profile update failed'
        }
      }
    } catch (error) {
      console.error('❌ CustomerAuthIntegration: Profile update error:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Profile update failed'
      }
    }
  }

  /**
   * Sign out (compatible with existing auth system)
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    return await customerAuthService.signOut()
  }

  /**
   * Check if authenticated (compatible with existing auth system)
   */
  async isAuthenticated(): Promise<boolean> {
    return await customerAuthService.isAuthenticated()
  }
}

// Export singleton instance
export const customerAuthIntegration = new CustomerAuthIntegration()

// Export types
export type { AuthUser, AuthResponse }










