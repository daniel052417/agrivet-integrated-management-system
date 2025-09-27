import { supabase } from './supabase'
import { Product, ProductVariant, Category, SearchFilters, PaginatedResponse } from '../types'

class ProductService {
  async getProducts(
    branchId: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ProductVariant>> {
    try {
      // If Supabase is not available, return empty response
      if (!supabase) {
        console.warn('Supabase not available, returning empty products response')
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      }

      let query = supabase
        .from('product_variants')
        .select(`
          id,
          name,
          sku,
          price,
          cost,
          weight_kg,
          unit_of_measure,
          is_active,
          products!inner(
            id,
            name,
            sku,
            description,
            category_id,
            supplier_id,
            is_active,
            categories!inner(
              id,
              name,
              description
            )
          ),
          inventory!inner(
            branch_id,
            quantity_available,
            quantity_on_hand
          )
        `)
        .eq('is_active', true)
        .eq('products.is_active', true)
        .eq('inventory.branch_id', branchId)
        .gt('inventory.quantity_available', 0)

      // Apply filters
      if (filters.category) {
        query = query.eq('products.category_id', filters.category)
      }

      if (filters.priceMin) {
        query = query.gte('price', filters.priceMin)
      }

      if (filters.priceMax) {
        query = query.lte('price', filters.priceMax)
      }

      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,products.name.ilike.%${filters.searchQuery}%,products.description.ilike.%${filters.searchQuery}%`)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await query
        .range(from, to)
        .order('name')

      if (error) throw error

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }
  }

  async getProductById(productId: string, branchId: string): Promise<ProductVariant | null> {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          name,
          sku,
          price,
          cost,
          weight_kg,
          unit_of_measure,
          is_active,
          products!inner(
            id,
            name,
            sku,
            description,
            category_id,
            supplier_id,
            is_active,
            categories!inner(
              id,
              name,
              description
            )
          ),
          inventory!inner(
            branch_id,
            quantity_available,
            quantity_on_hand
          )
        `)
        .eq('id', productId)
        .eq('is_active', true)
        .eq('products.is_active', true)
        .eq('inventory.branch_id', branchId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  async searchProducts(
    query: string,
    branchId: string,
    limit: number = 10
  ): Promise<ProductVariant[]> {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          name,
          sku,
          price,
          products!inner(
            id,
            name,
            description
          ),
          inventory!inner(
            branch_id,
            quantity_available
          )
        `)
        .eq('is_active', true)
        .eq('products.is_active', true)
        .eq('inventory.branch_id', branchId)
        .gt('inventory.quantity_available', 0)
        .or(`name.ilike.%${query}%,products.name.ilike.%${query}%,products.description.ilike.%${query}%`)
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching products:', error)
      return []
    }
  }

  async checkProductAvailability(
    productId: string,
    branchId: string,
    quantity: number = 1
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity_available')
        .eq('product_variant_id', productId)
        .eq('branch_id', branchId)
        .single()

      if (error) throw error
      return (data?.quantity_available || 0) >= quantity
    } catch (error) {
      console.error('Error checking product availability:', error)
      return false
    }
  }
}

export const productService = new ProductService()
