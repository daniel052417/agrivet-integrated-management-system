import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ShoppingCart, ArrowLeft, Grid, List, Star, User } from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { ProductWithUnits, SearchFilters, Category, Promotion, ProductUnit } from '../types'
import { promotionService } from '../services/promotionService'
import { supabase } from '../services/supabase'
import ProductGrid from '../components/catalog/ProductGrid'
import SearchBar from '../components/catalog/SearchBar'
import FilterSidebar from '../components/catalog/FilterSidebar'
import PromoModal from '../components/promotions/PromoModal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import ProductSelectionModal from '../components/catalog/ProductSelectionModal'

// ✅ Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const ProductCatalog: React.FC = () => {
  const navigate = useNavigate()
  const { selectedBranch } = useBranch()
  const { getItemCount, addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const isLoadingPromotionsRef = useRef(false)
  
  // Product and category state
  const [products, setProducts] = useState<ProductWithUnits[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    category: undefined,
    priceMin: undefined,
    priceMax: undefined,
    inStock: true
  })

  // ✅ Debounce search query
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 500)

  // Product selection modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductWithUnits | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Promotional state
  const [modalPromotions, setModalPromotions] = useState<Promotion[]>([])
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [currentModalIndex, setCurrentModalIndex] = useState(0)

  useEffect(() => {
    if (!selectedBranch) {
      navigate('/branch-selection')
      return
    }
    loadCategories()
    loadPromotions()
  }, [selectedBranch])

  // ✅ Separate effect for products with debounced search
  useEffect(() => {
    if (selectedBranch) {
      loadProducts()
    }
  }, [selectedBranch, debouncedSearchQuery, filters.category, filters.priceMin, filters.priceMax, filters.inStock, currentPage])

  const loadProducts = async () => {
    if (!selectedBranch) return

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 ProductCatalog: Loading products for branch:', selectedBranch.id)
      
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
        .eq('inventory.branch_id', selectedBranch.id)
        .eq('is_active', true)
        .gt('inventory.quantity_available', 0)

      // ✅ Use debounced search query
      if (debouncedSearchQuery) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%,sku.ilike.%${debouncedSearchQuery}%`)
      }

      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }

      query = query.order('name', { ascending: true })

      // ✅ Get count in parallel
      const countPromise = supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const from = (currentPage - 1) * 20
      const to = from + 19
      query = query.range(from, to)

      // ✅ Execute both queries in parallel
      const [productsResult, countResult] = await Promise.all([
        query,
        countPromise
      ])

      const { data: productsData, error: productsError } = productsResult
      const { count } = countResult

      if (productsError) {
        console.error('❌ ProductCatalog: Database error:', productsError)
        throw new Error(`Failed to fetch products: ${productsError.message}`)
      }

      if (!productsData || productsData.length === 0) {
        console.log('⚠️ ProductCatalog: No products found')
        setProducts([])
        setTotalPages(1)
        return
      }

      const productsWithUnits = productsData
        .map(product => {
          const sellableUnits = product.product_units?.filter((unit: any) => unit.is_sellable) || []
          const defaultUnit = sellableUnits.find((unit: any) => unit.is_base_unit) || sellableUnits[0]
          
          if (!defaultUnit) {
            console.warn(`No sellable units found for product ${product.id}`)
            return null
          }

          if (filters.priceMin !== undefined && defaultUnit.price_per_unit < filters.priceMin) {
            return null
          }
          if (filters.priceMax !== undefined && defaultUnit.price_per_unit > filters.priceMax) {
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
        })
        .filter(Boolean) as ProductWithUnits[]

      console.log(`✅ ProductCatalog: Successfully loaded ${productsWithUnits.length} products`)
      setProducts(productsWithUnits)
      setTotalPages(Math.ceil((count || 0) / 20))
      
    } catch (err) {
      console.error('❌ ProductCatalog: Error loading products:', err)
      setError('Failed to load products. Please try again.')
      setProducts([])
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Cache categories in sessionStorage
  const loadCategories = async () => {
    const cachedCategories = sessionStorage.getItem('categories')
    if (cachedCategories) {
      try {
        const parsed = JSON.parse(cachedCategories)
        console.log('✅ Using cached categories')
        setCategories(parsed)
        return
      } catch (e) {
        console.warn('Failed to parse cached categories')
      }
    }

    try {
      console.log('🔄 ProductCatalog: Loading categories...')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ ProductCatalog: Error loading categories:', error)
        setCategories([])
        return
      }

      console.log(`✅ ProductCatalog: Successfully loaded ${data?.length || 0} categories`)
      setCategories(data || [])
      
      if (data) {
        sessionStorage.setItem('categories', JSON.stringify(data))
      }
      
    } catch (err) {
      console.error('❌ ProductCatalog: Error loading categories:', err)
      setCategories([])
    }
  }

  const loadPromotions = async () => {
    if (isLoadingPromotionsRef.current) {
      console.log('⏭️ Skipping promotion load - already in progress')
      return
    }

    try {
      isLoadingPromotionsRef.current = true
      console.log('🎉 Loading promotions...')
      
      const carouselData = await promotionService.getModalPromotionsForCarousel({
        branchId: selectedBranch?.id
      })

      console.log('📋 Loaded promotions:', carouselData.promotions.length)
      
      setModalPromotions(carouselData.promotions)
      
      if (carouselData.promotions.length > 0) {
        const promotionIds = carouselData.promotions.map(p => p.id)
        const shouldShow = promotionService.shouldShowModal(promotionIds)
        
        if (shouldShow) {
          setShowPromoModal(true)
          setCurrentModalIndex(0)
          
          setTimeout(() => {
            if (carouselData.useCarousel) {
              promotionService.markCarouselAsShown(promotionIds)
              promotionService.trackCarouselView(
                carouselData.promotions,
                selectedBranch?.id
              ).catch(err => console.error('Error tracking carousel view:', err))
            } else {
              promotionService.markModalAsShown(carouselData.promotions[0].id)
              promotionService.trackPromotionEvent({
                promotionId: carouselData.promotions[0].id,
                eventType: 'view',
                sessionId: promotionService['getSessionId'](),
                branchId: selectedBranch?.id,
                eventData: { displayMode: 'modal' }
              }).catch(err => console.error('Error tracking view:', err))
            }
          }, 100)
        }
      }
    } catch (err) {
      console.error('❌ Error loading promotions:', err)
    } finally {
      isLoadingPromotionsRef.current = false
    }
  }

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
    setCurrentPage(1)
  }

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProductClick = (product: ProductWithUnits) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleAddToCart = (product: ProductWithUnits, unit: ProductUnit, quantity: number) => {
    const baseUnitQuantity = quantity * unit.conversion_factor
    
    addItem({
      product: product,
      product_unit: unit,
      quantity: quantity,
      unitPrice: unit.price_per_unit,
      base_unit_quantity: baseUnitQuantity
    })
    
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const handlePromoModalClose = async () => {
    if (modalPromotions[currentModalIndex]) {
      await promotionService.trackPromotionDismissal(
        modalPromotions[currentModalIndex].id,
        undefined,
        selectedBranch?.id,
        'user_action'
      ).catch(err => console.error('Error tracking dismissal:', err))
    }
    
    setShowPromoModal(false)
    setCurrentModalIndex(0)
  }

  const handlePromoModalAction = async (promotion: Promotion) => {
    if (modalPromotions.length > 1) {
      await promotionService.trackCarouselAction(
        promotion,
        currentModalIndex,
        modalPromotions.length,
        selectedBranch?.id
      ).catch(err => console.error('Error tracking action:', err))
    } else {
      await promotionService.trackPromotionEvent({
        promotionId: promotion.id,
        eventType: 'click',
        sessionId: promotionService['getSessionId'](),
        branchId: selectedBranch?.id,
        eventData: { 
          displayMode: 'modal',
          buttonText: promotion.buttonText,
          buttonLink: promotion.buttonLink
        }
      }).catch(err => console.error('Error tracking click:', err))
    }
    
    handlePromoModalClose()
  }

  const handlePromoModalIndexChange = async (index: number) => {
    setCurrentModalIndex(index)
    
    if (modalPromotions[index]) {
      await promotionService.trackPromotionEvent({
        promotionId: modalPromotions[index].id,
        eventType: 'view',
        sessionId: promotionService['getSessionId'](),
        branchId: selectedBranch?.id,
        eventData: {
          displayMode: 'carousel',
          carouselIndex: index,
          carouselSize: modalPromotions.length,
          navigationType: 'user_navigation'
        }
      }).catch(err => console.error('Error tracking navigation:', err))
    }
  }

  if (!selectedBranch) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/branch-selection')}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  {selectedBranch?.name || 'Product Catalog'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate hidden sm:block">
                  Agricultural Supplies & Veterinary Products
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4 sm:w-5 sm:h-5" /> : <Grid className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/settings')}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search products..."
                value={filters.searchQuery || ''}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1.5 flex-shrink-0"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Filters</span>
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4">
            <div className="flex space-x-2 min-w-max pb-1">
              <button
                onClick={() => handleFilterChange({ category: undefined })}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  !filters.category
                    ? 'bg-agrivet-green text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleFilterChange({ category: category.id })}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    filters.category === category.id
                      ? 'bg-agrivet-green text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-4 sm:gap-6">
          <FilterSidebar
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
                <LoadingSpinner message="Loading products..." />
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                {/* ✅ FIXED: ErrorMessage expects no arguments or check your component definition */}
                <ErrorMessage message={error} />
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                  No Products Found
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
                  We couldn't find any products matching your search criteria. 
                  Try adjusting your search terms or filters.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={() => {
                      setFilters({
                        searchQuery: '',
                        category: undefined,
                        priceMin: undefined,
                        priceMax: undefined,
                        inStock: true
                      })
                      setCurrentPage(1)
                    }}
                    className="btn-primary"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => navigate('/branch-selection')}
                    className="btn-outline"
                  >
                    Change Branch
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      {products.length} Products Found
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Showing results for {selectedBranch?.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">All products in stock</span>
                    <span className="sm:hidden">In stock</span>
                  </div>
                </div>

                <ProductGrid
                  products={products}
                  viewMode={viewMode}
                  onProductClick={handleProductClick}
                />
                
                {totalPages > 1 && (
                  <div className="mt-8 sm:mt-12 flex justify-center">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 sm:px-4 sm:py-2 text-sm"
                        >
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const page = i + 1
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                  page === currentPage
                                    ? 'bg-agrivet-green text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          })}
                          {totalPages > 5 && (
                            <>
                              <span className="text-gray-400 px-1">...</span>
                              <button
                                onClick={() => handlePageChange(totalPages)}
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                  totalPages === currentPage
                                    ? 'bg-agrivet-green text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 sm:px-4 sm:py-2 text-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ProductSelectionModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProduct(null)
        }}
        onAddToCart={handleAddToCart}
      />

      {modalPromotions.length > 0 && (
        <PromoModal
          promotions={modalPromotions}
          isOpen={showPromoModal}
          onClose={handlePromoModalClose}
          onAction={handlePromoModalAction}
          currentIndex={currentModalIndex}
          onIndexChange={handlePromoModalIndexChange}
        />
      )}

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default ProductCatalog