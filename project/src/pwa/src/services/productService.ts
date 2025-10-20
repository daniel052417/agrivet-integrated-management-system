import { supabase } from './supabase'
import { ProductWithUnits, ProductUnit } from '../types'

interface ProductServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

class ProductService {
  private config: ProductServiceConfig

  constructor() {
    this.config = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  }

  /**
   * Get a single product with its available units
   */
  async getProductWithUnits(productId: string): Promise<ProductWithUnits> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (*),
          suppliers (*),
          product_units (*)
        `)
        .eq('id', productId)
        .single()

      if (error) throw error
      
      // Get the first sellable unit as the default
      const sellableUnits = product.product_units?.filter((unit: ProductUnit) => unit.is_sellable) || []
      const defaultUnit = sellableUnits.find((unit: ProductUnit) => unit.is_base_unit) || sellableUnits[0]
      
      if (!defaultUnit) {
        throw new Error('No sellable units found for this product')
      }

      return {
        id: defaultUnit.id,
        product_id: product.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        barcode: product.barcode,
        is_active: product.is_active,
        created_at: product.created_at,
        updated_at: product.updated_at,
        unit_name: defaultUnit.unit_name,
        unit_label: defaultUnit.unit_label,
        conversion_factor: defaultUnit.conversion_factor,
        is_base_unit: defaultUnit.is_base_unit,
        is_sellable: defaultUnit.is_sellable,
        price_per_unit: defaultUnit.price_per_unit,
        min_sellable_quantity: defaultUnit.min_sellable_quantity,
        sort_order: defaultUnit.sort_order,
        sku: product.sku,
        category_id: product.category_id,
        supplier_id: product.supplier_id,
        product: product,
        category: product.categories,
        supplier: product.suppliers,
        available_units: sellableUnits
      }
    } catch (error) {
      console.error('Error fetching product with units:', error)
      throw error
    }
  }

  /**
   * Get products for catalog with their units and inventory
   */
  async getProductsForCatalog(branchId: string): Promise<ProductWithUnits[]> {
    try {
      // Check if branchId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      
      if (!uuidRegex.test(branchId)) {
        console.warn('Invalid branch ID format, returning empty array for testing')
        return []
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (*),
          suppliers (*),
          product_units (*),
          inventory!inner (
            quantity_available,
            branch_id
          )
        `)
        .eq('inventory.branch_id', branchId)
        .eq('is_active', true)
        .gt('inventory.quantity_available', 0)

      if (error) throw error

      return data.map(product => {
        const sellableUnits = product.product_units?.filter((unit: ProductUnit) => unit.is_sellable) || []
        const defaultUnit = sellableUnits.find((unit: ProductUnit) => unit.is_base_unit) || sellableUnits[0]
        
        if (!defaultUnit) {
          console.warn(`No sellable units found for product ${product.id}`)
          return null
        }

        return {
          id: defaultUnit.id,
          product_id: product.id,
          name: product.name,
          description: product.description,
          brand: product.brand,
          barcode: product.barcode,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          unit_name: defaultUnit.unit_name,
          unit_label: defaultUnit.unit_label,
          conversion_factor: defaultUnit.conversion_factor,
          is_base_unit: defaultUnit.is_base_unit,
          is_sellable: defaultUnit.is_sellable,
          price_per_unit: defaultUnit.price_per_unit,
          min_sellable_quantity: defaultUnit.min_sellable_quantity,
          sort_order: defaultUnit.sort_order,
          sku: product.sku,
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          product: product,
          category: product.categories,
          supplier: product.suppliers,
          inventory: product.inventory,
          available_units: sellableUnits
        }
      }).filter(Boolean) as ProductWithUnits[]
    } catch (error) {
      console.error('Error fetching products for catalog:', error)
      throw error
    }
  }

  /**
   * Get products by category with units
   */
  async getProductsByCategory(categoryId: string, branchId: string): Promise<ProductWithUnits[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner (*),
          suppliers (*),
          product_units (*),
          inventory!inner (
            quantity_available,
            branch_id
          )
        `)
        .eq('category_id', categoryId)
        .eq('inventory.branch_id', branchId)
        .eq('is_active', true)
        .gt('inventory.quantity_available', 0)

      if (error) throw error

      return data.map(product => {
        const sellableUnits = product.product_units?.filter((unit: ProductUnit) => unit.is_sellable) || []
        const defaultUnit = sellableUnits.find((unit: ProductUnit) => unit.is_base_unit) || sellableUnits[0]
        
        if (!defaultUnit) {
          console.warn(`No sellable units found for product ${product.id}`)
          return null
        }

        return {
          id: defaultUnit.id,
          product_id: product.id,
          name: product.name,
          description: product.description,
          brand: product.brand,
          barcode: product.barcode,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          unit_name: defaultUnit.unit_name,
          unit_label: defaultUnit.unit_label,
          conversion_factor: defaultUnit.conversion_factor,
          is_base_unit: defaultUnit.is_base_unit,
          is_sellable: defaultUnit.is_sellable,
          price_per_unit: defaultUnit.price_per_unit,
          min_sellable_quantity: defaultUnit.min_sellable_quantity,
          sort_order: defaultUnit.sort_order,
          sku: product.sku,
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          product: product,
          category: product.categories,
          supplier: product.suppliers,
          inventory: product.inventory,
          available_units: sellableUnits
        }
      }).filter(Boolean) as ProductWithUnits[]
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  }

  /**
   * Search products with units
   */
  async searchProducts(query: string, branchId: string): Promise<ProductWithUnits[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (*),
          suppliers (*),
          product_units (*),
          inventory!inner (
            quantity_available,
            branch_id
          )
        `)
        .eq('inventory.branch_id', branchId)
        .eq('is_active', true)
        .gt('inventory.quantity_available', 0)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)

      if (error) throw error

      return data.map(product => {
        const sellableUnits = product.product_units?.filter((unit: ProductUnit) => unit.is_sellable) || []
        const defaultUnit = sellableUnits.find((unit: ProductUnit) => unit.is_base_unit) || sellableUnits[0]
        
        if (!defaultUnit) {
          console.warn(`No sellable units found for product ${product.id}`)
          return null
        }

        return {
          id: defaultUnit.id,
          product_id: product.id,
          name: product.name,
          description: product.description,
          brand: product.brand,
          barcode: product.barcode,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          unit_name: defaultUnit.unit_name,
          unit_label: defaultUnit.unit_label,
          conversion_factor: defaultUnit.conversion_factor,
          is_base_unit: defaultUnit.is_base_unit,
          is_sellable: defaultUnit.is_sellable,
          price_per_unit: defaultUnit.price_per_unit,
          min_sellable_quantity: defaultUnit.min_sellable_quantity,
          sort_order: defaultUnit.sort_order,
          sku: product.sku,
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          product: product,
          category: product.categories,
          supplier: product.suppliers,
          inventory: product.inventory,
          available_units: sellableUnits
        }
      }).filter(Boolean) as ProductWithUnits[]
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  }

  /**
   * Get product units for a specific product
   */
  async getProductUnits(productId: string): Promise<ProductUnit[]> {
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', productId)
        .eq('is_sellable', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching product units:', error)
      throw error
    }
  }

  /**
   * Get base unit for a product
   */
  async getBaseUnit(productId: string): Promise<ProductUnit | null> {
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', productId)
        .eq('is_base_unit', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }
      return data
    } catch (error) {
      console.error('Error fetching base unit:', error)
      throw error
    }
  }

  /**
   * Convert quantity from one unit to another
   */
  convertQuantity(quantity: number, fromUnit: ProductUnit, toUnit: ProductUnit): number {
    // Convert to base unit first, then to target unit
    const baseQuantity = quantity * fromUnit.conversion_factor
    return baseQuantity / toUnit.conversion_factor
  }

  /**
   * Convert quantity to base unit
   */
  convertToBaseUnit(quantity: number, unit: ProductUnit): number {
    return quantity * unit.conversion_factor
  }

  /**
   * Get the best unit for display based on quantity
   */
  getBestDisplayUnit(units: ProductUnit[], baseQuantity: number): ProductUnit {
    if (!units.length) throw new Error('No units available')

    // Find the unit that gives the most reasonable number
    let bestUnit = units[0]
    let bestScore = Math.abs(1 - (baseQuantity / bestUnit.conversion_factor))

    for (const unit of units) {
      const convertedQuantity = baseQuantity / unit.conversion_factor
      const score = Math.abs(1 - convertedQuantity)
      
      if (score < bestScore) {
        bestScore = score
        bestUnit = unit
      }
    }

    return bestUnit
  }

  /**
   * Validate if a quantity is valid for a unit
   */
  validateQuantity(quantity: number, unit: ProductUnit): { isValid: boolean; message?: string } {
    if (quantity <= 0) {
      return { isValid: false, message: 'Quantity must be greater than 0' }
    }

    if (quantity < unit.min_sellable_quantity) {
      return { 
        isValid: false, 
        message: `Minimum quantity is ${unit.min_sellable_quantity} ${unit.unit_label}` 
      }
    }

    // Check if quantity is a multiple of the minimum sellable quantity
    if (unit.min_sellable_quantity > 1 && quantity % unit.min_sellable_quantity !== 0) {
      return { 
        isValid: false, 
        message: `Quantity must be a multiple of ${unit.min_sellable_quantity}` 
      }
    }

    return { isValid: true }
  }

  /**
   * Get mock products for testing (when no real branch data is available)
   */
  getMockProductsForTesting(): ProductWithUnits[] {
    return [
      {
        id: 'unit-1',
        product_id: 'product-1',
        name: 'Pig Feed - Premium Quality',
        description: 'High-quality pig feed for optimal growth and health',
        brand: 'AgriGold',
        barcode: '123456789',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unit_name: 'kilogram',
        unit_label: 'Per Kilogram',
        conversion_factor: 1,
        is_base_unit: true,
        is_sellable: true,
        price_per_unit: 25,
        min_sellable_quantity: 0.25,
        sort_order: 1,
        sku: 'PROD-001',
        category_id: 'cat-1',
        supplier_id: 'supplier-1',
        product: {
          id: 'product-1',
          sku: 'PROD-001',
          name: 'Pig Feed - Premium Quality',
          description: 'High-quality pig feed for optimal growth and health',
          category_id: 'cat-1',
          brand: 'AgriGold',
          unit_of_measure: 'kg',
          weight: 0.5,
          dimensions: null,
          is_prescription_required: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          barcode: '123456789',
          supplier_id: 'supplier-1'
        },
        available_units: [
          {
            id: 'unit-1',
            product_id: 'product-1',
            unit_name: 'kilogram',
            unit_label: 'Per Kilogram',
            conversion_factor: 1,
            is_base_unit: true,
            is_sellable: true,
            price_per_unit: 25,
            min_sellable_quantity: 0.25,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'unit-2',
            product_id: 'product-1',
            unit_name: 'quarter_sack',
            unit_label: 'Quarter Sack',
            conversion_factor: 12.4,
            is_base_unit: false,
            is_sellable: true,
            price_per_unit: 310,
            min_sellable_quantity: 1,
            sort_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'unit-3',
            product_id: 'product-1',
            unit_name: 'full_sack',
            unit_label: 'Full Sack',
            conversion_factor: 48,
            is_base_unit: false,
            is_sellable: true,
            price_per_unit: 1200,
            min_sellable_quantity: 1,
            sort_order: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'unit-4',
        product_id: 'product-2',
        name: 'Test Product 2',
        description: 'Test product for demonstration',
        brand: 'TestBrand',
        barcode: '987654321',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unit_name: 'kilogram',
        unit_label: 'kg',
        conversion_factor: 1,
        is_base_unit: true,
        is_sellable: true,
        price_per_unit: 100,
        min_sellable_quantity: 0.5,
        sort_order: 1,
        sku: 'TEST-002',
        category_id: 'cat-2',
        supplier_id: 'supplier-2',
        product: {
          id: 'product-2',
          sku: 'TEST-002',
          name: 'Test Product 2',
          description: 'Test product for demonstration',
          category_id: 'cat-2',
          brand: 'TestBrand',
          unit_of_measure: 'kg',
          weight: 1,
          dimensions: null,
          is_prescription_required: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          barcode: '987654321',
          supplier_id: 'supplier-2'
        },
        available_units: [
          {
            id: 'unit-4',
            product_id: 'product-2',
            unit_name: 'kilogram',
            unit_label: 'kg',
            conversion_factor: 1,
            is_base_unit: true,
            is_sellable: true,
            price_per_unit: 100,
            min_sellable_quantity: 0.5,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'unit-5',
            product_id: 'product-2',
            unit_name: 'gram',
            unit_label: 'g',
            conversion_factor: 0.001,
            is_base_unit: false,
            is_sellable: true,
            price_per_unit: 0.1,
            min_sellable_quantity: 100,
            sort_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }
    ]
  }
}

export const productService = new ProductService()
export default productService