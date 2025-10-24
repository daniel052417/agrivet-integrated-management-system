import { useQuery, useInfiniteQuery, UseQueryResult, UseInfiniteQueryResult } from '@tanstack/react-query'
import { ProductWithUnits } from '../types'
import { supabase } from '../services/supabase'

/**
 * ============================================================================
 * PRODUCT HOOKS FOR REACT QUERY
 * ============================================================================
 * These hooks provide cached data fetching for products
 */

// ============================================================================
// TYPES
// ============================================================================

interface ProductsResponse {
  products: ProductWithUnits[]
  total: number
  hasMore: boolean
}

interface ProductQueryParams {
  branchId: string
  categoryId?: string
  searchQuery?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
}

interface PaginatedProductParams extends ProductQueryParams {
  page?: number
  pageSize?: number
}

// ============================================================================
// PRODUCT FETCHING FUNCTIONS
// ============================================================================

/**
 * Fetch products from Supabase
 */
async function fetchProducts(params: ProductQueryParams): Promise<ProductWithUnits[]> {
  const { branchId, categoryId, searchQuery, priceMin, priceMax, inStock = true } = params

  let query = supabase
    .from('products')
    .select(`
      *,
      categories (*),
      suppliers (*),
      product_units (*),
      inventory!inner (
        quantity_available,
        quantity_on_hand,
        quantity_reserved,
        branch_id
      )
    `)
    .eq('inventory.branch_id', branchId)
    .eq('is_active', true)

  if (inStock) {
    query = query.gt('inventory.quantity_available', 0)
  }

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  query = query.order('name', { ascending: true })

  const { data: productsData, error } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  if (!productsData || productsData.length === 0) {
    return []
  }

  // Transform to ProductWithUnits
  const productsWithUnits = productsData
    .map(product => {
      const sellableUnits = product.product_units?.filter((unit: any) => unit.is_sellable) || []
      const defaultUnit = sellableUnits.find((unit: any) => unit.is_base_unit) || sellableUnits[0]
      
      if (!defaultUnit) {
        return null
      }

      // Apply price filters
      if (priceMin !== undefined && defaultUnit.price_per_unit < priceMin) {
        return null
      }
      if (priceMax !== undefined && defaultUnit.price_per_unit > priceMax) {
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
      } as ProductWithUnits
    })
    .filter(Boolean) as ProductWithUnits[]

  return productsWithUnits
}

/**
 * Fetch paginated products
 */
async function fetchProductsPaginated(params: PaginatedProductParams): Promise<ProductsResponse> {
  const { page = 1, pageSize = 20, ...queryParams } = params

  const products = await fetchProducts(queryParams)
  
  // Client-side pagination (you can modify this to do server-side pagination)
  const from = (page - 1) * pageSize
  const to = from + pageSize
  const paginatedProducts = products.slice(from, to)
  
  return {
    products: paginatedProducts,
    total: products.length,
    hasMore: to < products.length
  }
}

/**
 * Fetch single product by ID
 */
async function fetchProductById(productId: string, branchId: string): Promise<ProductWithUnits | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (*),
      suppliers (*),
      product_units (*),
      inventory!inner (
        quantity_available,
        quantity_on_hand,
        quantity_reserved,
        branch_id
      )
    `)
    .eq('id', productId)
    .eq('inventory.branch_id', branchId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  const sellableUnits = data.product_units?.filter((unit: any) => unit.is_sellable) || []
  const defaultUnit = sellableUnits.find((unit: any) => unit.is_base_unit) || sellableUnits[0]
  
  if (!defaultUnit) {
    return null
  }

  return {
    id: defaultUnit.id,
    product_id: data.id,
    name: data.name,
    description: data.description,
    brand: data.brand,
    barcode: data.barcode,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
    unit_name: defaultUnit.unit_name,
    unit_label: defaultUnit.unit_label,
    conversion_factor: defaultUnit.conversion_factor,
    is_base_unit: defaultUnit.is_base_unit,
    is_sellable: defaultUnit.is_sellable,
    price_per_unit: defaultUnit.price_per_unit,
    min_sellable_quantity: defaultUnit.min_sellable_quantity,
    sort_order: defaultUnit.sort_order,
    sku: data.sku,
    category_id: data.category_id,
    supplier_id: data.supplier_id,
    product: data,
    category: data.categories,
    supplier: data.suppliers,
    inventory: data.inventory,
    available_units: sellableUnits
  } as ProductWithUnits
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all products for a branch
 * 
 * @example
 * const { data: products, isLoading, error } = useProducts({
 *   branchId: 'branch-123',
 *   categoryId: 'cat-456'
 * })
 */
export function useProducts(params: ProductQueryParams): UseQueryResult<ProductWithUnits[], Error> {
  return useQuery({
    queryKey: ['products', params.branchId, params.categoryId, params.searchQuery, params.priceMin, params.priceMax],
    queryFn: () => fetchProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.branchId
  })
}

/**
 * Hook to fetch paginated products
 * 
 * @example
 * const { data, isLoading, error } = useProductsPaginated({
 *   branchId: 'branch-123',
 *   page: 1,
 *   pageSize: 20
 * })
 */
export function useProductsPaginated(params: PaginatedProductParams): UseQueryResult<ProductsResponse, Error> {
  return useQuery({
    queryKey: ['products-paginated', params.branchId, params.page, params.categoryId, params.searchQuery],
    queryFn: () => fetchProductsPaginated(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!params.branchId
  })
}

/**
 * Hook for infinite scroll products
 * ✅ FIXED: Added initialPageParam
 * 
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isLoading
 * } = useProductsInfinite({ branchId: 'branch-123' })
 */
export function useProductsInfinite(
  params: ProductQueryParams
): UseInfiniteQueryResult<ProductsResponse, Error> {
  return useInfiniteQuery({
    queryKey: ['products-infinite', params.branchId, params.categoryId, params.searchQuery],
    queryFn: ({ pageParam = 1 }) => 
      fetchProductsPaginated({ ...params, page: pageParam as number, pageSize: 20 }),
    getNextPageParam: (lastPage: ProductsResponse) => {
      // Return next page number if there are more products
      return lastPage.hasMore ? Math.floor(lastPage.products.length / 20) + 1 : undefined
    },
    initialPageParam: 1, // ✅ REQUIRED in React Query v5
    staleTime: 5 * 60 * 1000,
    enabled: !!params.branchId
  })
}

/**
 * Hook to fetch a single product by ID
 * 
 * @example
 * const { data: product, isLoading } = useProduct('product-123', 'branch-456')
 */
export function useProduct(
  productId: string,
  branchId: string
): UseQueryResult<ProductWithUnits | null, Error> {
  return useQuery({
    queryKey: ['product', productId, branchId],
    queryFn: () => fetchProductById(productId, branchId),
    staleTime: 5 * 60 * 1000,
    enabled: !!productId && !!branchId
  })
}