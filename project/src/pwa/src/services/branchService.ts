import { supabase } from './supabase'
import { Branch, BranchAvailability, ApiResponse } from '../types'

class BranchService {
  async getBranches(): Promise<Branch[]> {
    try {
      // If Supabase is not available, return empty array
      if (!supabase) {
        console.warn('Supabase not available, returning empty branches array')
        return []
      }

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching branches:', error)
      throw new Error('Failed to fetch branches')
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
      // For now, return mock data. In production, this would come from a real-time service
      const branches = await this.getBranches()
      
      return branches.map(branch => ({
        branchId: branch.id,
        isOpen: true, // This would be determined by current time and operating hours
        operatingHours: {
          open: '08:00',
          close: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        lastUpdated: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error fetching branch availability:', error)
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
        .from('branches')
        .select('operating_hours')
        .eq('id', branchId)
        .single()

      if (error) throw error
      return data?.operating_hours || null
    } catch (error) {
      console.error('Error fetching operating hours:', error)
      return null
    }
  }
}

export const branchService = new BranchService()
