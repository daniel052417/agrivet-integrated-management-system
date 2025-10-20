import { supabase } from './supabase'

export interface GuestUpgradeData {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  date_of_birth?: string
}

export interface GuestUpgradeResponse {
  success: boolean
  error?: string
  customer?: any
  message?: string
}

class GuestUpgradeService {
  /**
   * Upgrade a guest account to a full account
   * This method updates the existing guest record instead of creating a new one
   */
  async upgradeGuestAccount(upgradeData: GuestUpgradeData): Promise<GuestUpgradeResponse> {
    try {
      console.log('🔄 Starting guest account upgrade process...')
      
      // Get current user (should be the guest user)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return {
          success: false,
          error: 'No authenticated user found. Please ensure you are logged in as a guest.'
        }
      }

      console.log('👤 Current guest user ID:', user.id)

      // Check if current user is actually a guest
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_guest', true)
        .single()

      if (customerError || !customer) {
        return {
          success: false,
          error: 'No guest account found or account already upgraded.'
        }
      }

      console.log('✅ Guest account found')

      // Step 1: Update auth.users - this triggers handle_guest_upgrade()
      const { error: authError } = await supabase.auth.updateUser({
        email: upgradeData.email,
        password: upgradeData.password,
        data: {
          first_name: upgradeData.first_name,
          last_name: upgradeData.last_name,
          phone: upgradeData.phone,
          address: upgradeData.address,
          city: upgradeData.city,
          province: upgradeData.province,
          date_of_birth: upgradeData.date_of_birth
        }
      })

      if (authError) {
        console.error('❌ Auth update failed:', authError)
        return {
          success: false,
          error: `Failed to update authentication: ${authError.message}`
        }
      }

      console.log('✅ Auth record updated, trigger should update customer')

      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 2: Verify the upgrade completed
      const { data: updatedCustomer, error: verifyError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (verifyError || updatedCustomer.is_guest) {
        console.error('❌ Customer verification failed:', verifyError)
        return {
          success: false,
          error: 'Guest upgrade trigger failed to update customer record'
        }
      }

      console.log('✅ Customer record updated successfully')

      // Step 3: Migrate session data
      await this.migrateGuestSessionData(user.id)

      return {
        success: true,
        customer: updatedCustomer,
        message: 'Guest account successfully upgraded to full account!'
      }

    } catch (error) {
      console.error('❌ Guest upgrade error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Migrate guest session data to the upgraded account
   */
  private async migrateGuestSessionData(userId: string): Promise<void> {
    try {
      console.log('🔄 Migrating guest session data...')

      // Migrate cart items (if you have a cart table)
      // const { error: cartError } = await supabase
      //   .from('cart_items')
      //   .update({ user_id: userId })
      //   .eq('session_id', userId) // or however you track guest sessions

      // Migrate user preferences (if you have a preferences table)
      // const { error: prefsError } = await supabase
      //   .from('user_preferences')
      //   .update({ user_id: userId })
      //   .eq('session_id', userId)

      // Migrate analytics data
      const { error: analyticsError } = await supabase
        .from('pwa_analytics')
        .update({ session_id: userId })
        .eq('session_id', userId) // This might need adjustment based on your analytics structure

      if (analyticsError) {
        console.warn('⚠️ Analytics migration warning:', analyticsError)
      }

      console.log('✅ Guest session data migration completed')

    } catch (error) {
      console.warn('⚠️ Session data migration warning:', error)
      // Don't fail the upgrade if migration fails
    }
  }

  /**
   * Check if current user is a guest
   */
  async isCurrentUserGuest(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data: customer } = await supabase
        .from('customers')
        .select('is_guest')
        .eq('user_id', user.id)
        .single()

      return customer?.is_guest === true
    } catch (error) {
      console.error('Error checking guest status:', error)
      return false
    }
  }

  /**
   * Get current guest customer data
   */
  async getCurrentGuestData(): Promise<any | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_guest', true)
        .single()

      return customer
    } catch (error) {
      console.error('Error getting guest data:', error)
      return null
    }
  }

  /**
   * Alternative method using the database function (if you prefer server-side logic)
   */
  async upgradeGuestAccountViaFunction(upgradeData: GuestUpgradeData): Promise<GuestUpgradeResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user found'
        }
      }

      // Call the database function
      const { data, error } = await supabase.rpc('upgrade_guest_account_api', {
        guest_user_id: user.id,
        new_email: upgradeData.email,
        first_name: upgradeData.first_name,
        last_name: upgradeData.last_name,
        phone: upgradeData.phone,
        address: upgradeData.address,
        city: upgradeData.city,
        province: upgradeData.province,
        date_of_birth: upgradeData.date_of_birth
      })

      if (error) {
        return {
          success: false,
          error: `Database function error: ${error.message}`
        }
      }

      return {
        success: data.success,
        error: data.error,
        customer: data.upgrade?.customer,
        message: data.upgrade?.message
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const guestUpgradeService = new GuestUpgradeService()

