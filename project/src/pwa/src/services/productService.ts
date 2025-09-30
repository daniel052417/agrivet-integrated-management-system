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
      let query = supabase
        .from('product_variants')
        .select(`
          *,
          products:product_id (
            id,
            name,
            description,
            unit_of_measure,
            barcode,
            is_active,
            categories:category_id (
              id,
              name
            )
          ),
          inventory:inventory!product_variant_id (
            id,
            branch_id,
            product_variant_id,
            quantity_on_hand,
            quantity_reserved,
            quantity_available,
            reorder_level,
            max_stock_level,
            last_counted,
            updated_at
          )
        `)
        .eq('is_active', true)
        .eq('products.is_active', true)

      // Apply filters
      if (filters.category) {
        query = query.eq('products.category_id', filters.category)
      }

      if (filters.priceMin !== undefined) {
        query = query.gte('price', filters.priceMin)
      }

      if (filters.priceMax !== undefined) {
        query = query.lte('price', filters.priceMax)
      }

      if (filters.inStock !== undefined) {
        if (filters.inStock) {
          query = query.gt('inventory.quantity_available', 0)
        } else {
          query = query.lte('inventory.quantity_available', 0)
        }
      }

      if (filters.searchQuery) {
        query = query.or(`variant_name.ilike.%${filters.searchQuery}%,products.name.ilike.%${filters.searchQuery}%,sku.ilike.%${filters.searchQuery}%`)
      }

      // Apply branch filter
      query = query.eq('inventory.branch_id', branchId)

      // Get total count for pagination
      const { count } = await query
        .select('*', { count: 'exact', head: true })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error } = await query
        .range(from, to)
        .order('variant_name')

      if (error) throw error

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
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
          *,
          products:product_id (
            id,
            name,
            description,
            unit_of_measure,
            barcode,
            is_active,
            categories:category_id (
              id,
              name
            )
          ),
          inventory:inventory!product_variant_id (
            id,
            branch_id,
            product_variant_id,
            quantity_on_hand,
            quantity_reserved,
            quantity_available,
            reorder_level,
            max_stock_level,
            last_counted,
            updated_at
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
          *,
          products:product_id (
            id,
            name,
            description,
            unit_of_measure,
            barcode,
            is_active,
            categories:category_id (
              id,
              name
            )
          ),
          inventory:inventory!product_variant_id (
            id,
            branch_id,
            product_variant_id,
            quantity_on_hand,
            quantity_reserved,
            quantity_available,
            reorder_level,
            max_stock_level,
            last_counted,
            updated_at
          )
        `)
        .eq('is_active', true)
        .eq('products.is_active', true)
        .eq('inventory.branch_id', branchId)
        .or(`variant_name.ilike.%${query}%,products.name.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(limit)
        .order('variant_name')

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