import { supabase } from './supabase'
import { Branch, BranchAvailability } from '../types'

class BranchService {
  // Test method to verify database connection and table structure
  async testDatabaseConnection() {
    try {
      console.log('🧪 BranchService: Testing database connection...')
      
      // Test 1: Check if we can connect to Supabase
      const { data: testData, error: testError } = await supabase
        .from('branches')
        .select('count')
        .limit(1)
      
      console.log('🧪 BranchService: Connection test result:', { testData, testError })
      
      // Test 2: Check table structure
      const { data: structureData, error: structureError } = await supabase
        .from('branches')
        .select('*')
        .limit(1)
      
      console.log('🧪 BranchService: Table structure test:', { structureData, structureError })
      
      // Test 3: Check if there are any branches at all
      const { count, error: countError } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
      
      console.log('🧪 BranchService: Total branches count:', { count, countError })
      
      // Test 4: Try different table name variations
      console.log('🧪 BranchService: Testing different table name variations...')
      
      // Try with public schema explicitly
      const { data: publicData, error: publicError } = await supabase
        .from('public.branches')
        .select('id, name')
        .limit(1)
      
      console.log('🧪 BranchService: Public schema test:', { publicData, publicError })
      
      // Try without schema (default)
      const { data: defaultData, error: defaultError } = await supabase
        .from('branches')
        .select('id, name')
        .limit(1)
      
      console.log('🧪 BranchService: Default schema test:', { defaultData, defaultError })
      
      return { testData, structureData, count }
    } catch (error) {
      console.error('🧪 BranchService: Database connection test failed:', error)
      return null
    }
  }
  async getBranches(): Promise<Branch[]> {
    try {
      console.log('🔄 BranchService: Starting getBranches()...')
      
      console.log('🔄 BranchService: Fetching branches from database...')
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ BranchService: Database error:', error)
        throw new Error(`Failed to fetch branches: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ BranchService: No branches found in database')
        return []
      }

      console.log(`✅ BranchService: Successfully fetched ${data.length} branches`)
      return data
    } catch (error) {
      console.error('❌ BranchService: Error fetching branches:', error)
      throw error
    }
  }


  async getBranchById(branchId: string): Promise<Branch | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching branch:', error)
      return null
    }
  }

  async getBranchAvailability(): Promise<BranchAvailability[]> {
    try {
      console.log('🔄 BranchService: Starting getBranchAvailability()...')
      const branches = await this.getBranches()
      console.log('📊 BranchService: Branches for availability check:', branches.length)
      
      const availability = branches.map(branch => {
        const now = new Date()
        const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.toLocaleTimeString('en-PH', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Manila'
        })

        const isOpen = this.isBranchOpenNow(branch, currentDay, currentTime)

        return {
          branchId: branch.id,
          isOpen,
          operatingHours: {
            open: '08:00',
            close: '18:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          },
          lastUpdated: new Date().toISOString()
        }
      })
      
      console.log('✅ BranchService: Final availability array:', availability)
      return availability
    } catch (error) {
      console.error('❌ BranchService: Error fetching branch availability:', error)
      return []
    }
  }

  async checkBranchStock(branchId: string, productId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity_available')
        .eq('branch_id', branchId)
        .eq('product_variant_id', productId)
        .single()

      if (error) throw error
      return (data?.quantity_available || 0) > 0
    } catch (error) {
      console.error('Error checking branch stock:', error)
      return false
    }
  }

  async getBranchOperatingHours(branchId: string): Promise<{
    open: string
    close: string
    days: string[]
  } | null> {
    try {
      const { data, error } = await supabase
        .from('branch_operating_hours')
        .select('open_time, close_time, day_of_week')
        .eq('branch_id', branchId)
        .eq('is_open', true)
        .order('day_of_week')

      if (error) throw error
      
      if (data && data.length > 0) {
        const days = data.map(d => this.dayOfWeekToString(d.day_of_week))
        return {
          open: data[0].open_time || '08:00',
          close: data[0].close_time || '18:00',
          days
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching operating hours:', error)
      return null
    }
  }


  private dayOfWeekToString(dayOfWeek: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[dayOfWeek] || 'monday'
  }

  private isBranchOpenNow(_branch: Branch, currentDay: number, currentTime: string): boolean {
    // Simple check - assume branches are open Monday-Saturday 8AM-6PM
    const isWeekday = currentDay >= 1 && currentDay <= 6
    const isWithinHours = currentTime >= '08:00' && currentTime <= '18:00'
    
    return isWeekday && isWithinHours
  }
}

export const branchService = new BranchService()
