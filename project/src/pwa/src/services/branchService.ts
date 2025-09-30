import { supabase, initializeAnonymousSession } from './supabase'
import { Branch, BranchAvailability, BranchOperatingHours } from '../types'

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
      
      // Initialize anonymous session for RLS access
      console.log('🔐 BranchService: Initializing anonymous session...')
      const authSuccess = await initializeAnonymousSession()
      if (!authSuccess) {
        console.warn('⚠️ BranchService: Anonymous auth failed, trying without auth...')
      }
      
      // Try the custom SQL function first
      console.log('🔄 BranchService: Trying custom SQL function...')
      const { data: customData, error: customError } = await supabase
        .rpc('get_branches_with_status')

      console.log('📊 BranchService: Custom function response:', { customData, customError })

      if (!customError && customData && customData.length > 0) {
        console.log('✅ BranchService: Using custom function data')
        return this.transformCustomQueryData(customData)
      }

      console.log('⚠️ BranchService: Custom function failed, trying direct SQL query...')
      
      // Try direct SQL query as fallback
      const { data: sqlData, error: sqlError } = await supabase
        .from('branches')
        .select(`
          id,
          name,
          code,
          address,
          city,
          province,
          phone,
          email,
          branch_type,
          branch_operating_hours!inner (
            day_of_week,
            is_open,
            open_time,
            close_time
          )
        `)
        .eq('is_active', true)
        .order('name')

      console.log('📊 BranchService: Direct SQL query response:', { sqlData, sqlError })

      if (!sqlError && sqlData && sqlData.length > 0) {
        console.log('✅ BranchService: Using direct SQL query data')
        return this.transformDirectQueryData(sqlData)
      }

      console.log('⚠️ BranchService: Direct SQL query failed, falling back to original query')
      
      // Fallback to original query - now using operating_hours JSONB column
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      console.log('📊 BranchService: Fallback query response:', { data, error })
      
      if (error) {
        console.error('❌ BranchService: Fallback query error:', error)
        throw error
      }
      
      console.log('📊 BranchService: Raw data from fallback query:', data)
      console.log('📊 BranchService: Number of branches found:', data?.length || 0)
      
      // Transform the data to include operating hours
      const transformedBranches = data?.map(branch => {
        console.log('🔄 BranchService: Processing branch:', branch.name)
        console.log('🔄 BranchService: Branch operating hours raw:', branch.operating_hours)
        
        let formattedHours = this.formatOperatingHoursFromJsonb(branch.operating_hours)
        
        // If no operating hours from database, create default ones
        if (!formattedHours) {
          console.log('⚠️ BranchService: No operating hours from database, creating default hours for:', branch.name)
          formattedHours = this.createDefaultOperatingHoursJsonb(branch.id)
        }
        
        console.log('🔄 BranchService: Formatted operating hours:', formattedHours)
        
        return {
          ...branch,
          operating_hours: formattedHours
        }
      }) || []
      
      console.log('✅ BranchService: Transformed branches:', transformedBranches)
      return transformedBranches
    } catch (error) {
      console.error('❌ BranchService: Error fetching branches:', error)
      throw new Error('Failed to fetch branches')
    }
  }

  // Transform data from the custom SQL function
  private transformCustomQueryData(data: any[]): Branch[] {
    console.log('🔄 BranchService: Transforming custom query data...')
    
    // Group by branch ID to handle multiple operating hours per branch
    const branchMap = new Map<string, any>()
    
    data.forEach((row: any) => {
      if (!branchMap.has(row.id)) {
        branchMap.set(row.id, {
          id: row.id,
          name: row.name,
          code: row.code,
          address: row.address,
          city: row.city,
          province: row.province,
          phone: row.phone,
          email: row.email,
          branch_type: row.branch_type,
          is_active: true,
          created_at: new Date().toISOString(),
          postal_code: null,
          manager_id: null,
          operating_hours: [],
          real_time_status: row.real_time_status,
          payment_options: row.payment_options
        })
      }
      
      // Add operating hours for this day
      const branch = branchMap.get(row.id)
      if (row.open_time && row.close_time) {
        branch.operating_hours.push({
          id: `${row.id}_${row.day_of_week || 1}`,
          branch_id: row.id,
          day_of_week: this.getDayOfWeekFromTime(row.open_time, row.close_time),
          is_open: row.is_open,
          open_time: row.open_time,
          close_time: row.close_time,
          created_at: new Date().toISOString()
        })
      }
    })
    
    const branches = Array.from(branchMap.values())
    console.log('✅ BranchService: Transformed custom query data:', branches)
    return branches
  }

  // Transform data from direct SQL query
  private transformDirectQueryData(data: any[]): Branch[] {
    console.log('🔄 BranchService: Transforming direct query data...')
    
    const branches = data.map((branch: any) => {
      console.log('🔄 BranchService: Processing branch (direct query):', branch.name)
      
      // Calculate real-time status
      const now = new Date()
      const currentDay = now.getDay()
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      
      const todayHours = branch.branch_operating_hours.find((oh: any) => oh.day_of_week === currentDay)
      let realTimeStatus = 'Closed'
      
      if (todayHours && todayHours.is_open && todayHours.open_time && todayHours.close_time) {
        if (currentTime >= todayHours.open_time && currentTime <= todayHours.close_time) {
          // Check if closing soon
          const closeTimeMinutes = this.timeToMinutes(todayHours.close_time)
          const currentTimeMinutes = this.timeToMinutes(currentTime)
          const timeUntilClose = closeTimeMinutes - currentTimeMinutes
          
          if (timeUntilClose <= 30 && timeUntilClose > 0) {
            realTimeStatus = `Closing Soon (${timeUntilClose} mins)`
          } else {
            realTimeStatus = 'Open'
          }
        } else if (currentTime < todayHours.open_time) {
          const openTimeMinutes = this.timeToMinutes(todayHours.open_time)
          const currentTimeMinutes = this.timeToMinutes(currentTime)
          const timeUntilOpen = openTimeMinutes - currentTimeMinutes
          
          if (timeUntilOpen <= 120 && timeUntilOpen > 0) {
            const hours = Math.floor(timeUntilOpen / 60)
            realTimeStatus = `Opening in ${hours} hours`
          } else {
            realTimeStatus = 'Closed'
          }
        }
      } else if (todayHours && !todayHours.is_open) {
        realTimeStatus = 'Closed Today'
      }
      
      return {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        city: branch.city,
        province: branch.province,
        phone: branch.phone,
        email: branch.email,
        branch_type: branch.branch_type,
        is_active: true,
        created_at: new Date().toISOString(),
        postal_code: null,
        manager_id: null,
        operating_hours: this.formatOperatingHoursFromJsonb(branch.operating_hours) || this.createDefaultOperatingHoursJsonb(branch.id),
        real_time_status: realTimeStatus,
        payment_options: ['GCash', 'PayMaya', 'Cash at Pickup']
      }
    })
    
    console.log('✅ BranchService: Transformed direct query data:', branches)
    return branches
  }

  // Helper method to convert time to minutes
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Format operating hours from JSONB structure
  private formatOperatingHoursFromJsonb(operatingHours: any): BranchOperatingHours | null {
    console.log('🔄 BranchService: formatOperatingHoursFromJsonb called with:', operatingHours)
    
    if (!operatingHours || typeof operatingHours !== 'object') {
      console.log('❌ BranchService: No valid operating hours data')
      return null
    }

    console.log('✅ BranchService: Formatted operating hours from JSONB:', operatingHours)
    return operatingHours as BranchOperatingHours
  }

  // Create default operating hours JSONB structure when none exist in database
  private createDefaultOperatingHoursJsonb(branchId: string): BranchOperatingHours {
    console.log('🔄 BranchService: Creating default operating hours JSONB for branch:', branchId)
    
    const defaultHours: BranchOperatingHours = {
      monday: { open: '08:00', close: '21:00' },
      tuesday: { open: '08:00', close: '21:00' },
      wednesday: { open: '08:00', close: '21:00' },
      thursday: { open: '08:00', close: '21:00' },
      friday: { open: '08:00', close: '21:00' },
      saturday: { open: '08:00', close: '21:00' },
      sunday: { closed: true }
    }
    
    console.log('✅ BranchService: Created default operating hours JSONB:', defaultHours)
    return defaultHours
  }

  // Helper method to determine day of week (simplified for now)
  private getDayOfWeekFromTime(_openTime: string, _closeTime: string): number {
    // For now, assume Monday (1) - this would need to be more sophisticated
    // in a real implementation where we track the actual day
    return 1
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
      
      return {
        ...data,
        operating_hours: this.formatOperatingHoursFromJsonb(data.operating_hours) || this.createDefaultOperatingHoursJsonb(data.id)
      }
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
        console.log('🔄 BranchService: Checking availability for branch:', branch.name)
        const now = new Date()
        const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })

        console.log('🕐 BranchService: Current time info:', { currentDay, currentTime })
        const isOpen = this.isBranchOpenNow(branch, currentDay, currentTime)
        console.log('🕐 BranchService: Branch is open:', isOpen)

        // Convert JSONB operating hours to the expected format
        const mondayHours = branch.operating_hours?.monday
        const operatingHours = branch.operating_hours ? {
          open: (mondayHours && 'open' in mondayHours) ? mondayHours.open : '08:00',
          close: (mondayHours && 'open' in mondayHours) ? mondayHours.close : '18:00',
          days: Object.keys(branch.operating_hours).filter(day => 
            !('closed' in (branch.operating_hours?.[day as keyof typeof branch.operating_hours] || {}))
          )
        } : {
          open: '08:00',
          close: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        }

        const availabilityData = {
          branchId: branch.id,
          isOpen,
          operatingHours,
          lastUpdated: new Date().toISOString()
        }
        
        console.log('📊 BranchService: Availability data for', branch.name, ':', availabilityData)
        return availabilityData
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

  private isBranchOpenNow(branch: Branch, currentDay: number, currentTime: string): boolean {
    console.log('🔄 BranchService: isBranchOpenNow called for branch:', branch.name)
    console.log('🕐 BranchService: Current day:', currentDay, 'Current time:', currentTime)
    
    if (!branch.operating_hours) {
      console.log('❌ BranchService: No operating hours for branch:', branch.name)
      return false
    }

    // Get today's day name
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[currentDay]
    
    // Find today's operating hours from JSONB
    const todayHours = branch.operating_hours[todayName as keyof typeof branch.operating_hours]
    console.log('📅 BranchService: Today\'s hours:', todayHours)
    
    // Check if the day is closed
    if (!todayHours || 'closed' in todayHours) {
      console.log('❌ BranchService: Branch is closed today')
      return false
    }

    const openTime = todayHours.open
    const closeTime = todayHours.close
    console.log('🕐 BranchService: Operating hours:', { openTime, closeTime })
    
    if (!openTime || !closeTime) {
      console.log('❌ BranchService: No time data for today')
      return false
    }
    
    const isWithinHours = currentTime >= openTime && currentTime <= closeTime
    console.log('🕐 BranchService: Is within operating hours?', isWithinHours)
    
    return isWithinHours
  }
}

export const branchService = new BranchService()
