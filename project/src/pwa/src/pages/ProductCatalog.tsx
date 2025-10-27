import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ShoppingCart, ArrowLeft, Grid, List, Star, Package, Clock, TrendingUp, User } from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
// import { useRealtime } from '../contexts/RealtimeContext'
// import { realtimeService } from '../services/realtimeService'
import { ProductWithUnits, SearchFilters, Category, Promotion } from '../types'
import { promotionService } from '../services/promotionService'
import { supabase } from '../services/supabase'
import ProductGrid from '../components/catalog/ProductGrid'
import SearchBar from '../components/catalog/SearchBar'
import FilterSidebar from '../components/catalog/FilterSidebar'
import PromoBanner from '../components/promotions/PromoBanner'
import PromoModal from '../components/promotions/PromoModal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'


const ProductCatalog: React.FC = () => {
  const navigate = useNavigate()
  const { selectedBranch } = useBranch()
  const { getItemCount } = useCart()
  const { isAuthenticated } = useAuth()
  // const { isConnected: isRealtimeConnected } = useRealtime()
  const isLoadingPromotionsRef = useRef(false)
  const [products, setProducts] = useState<ProductWithUnits[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    category: undefined,
    priceMin: undefined,
    priceMax: undefined,
    inStock: true
  })

  // Promotional state
  const [bannerPromotions, setBannerPromotions] = useState<Promotion[]>([])
  const [modalPromotions, setModalPromotions] = useState<Promotion[]>([])
  const [showModal, setShowModal] = useState(false)
  const [currentModalIndex, setCurrentModalIndex] = useState(0)
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!selectedBranch) {
      navigate('/branch-selection')
      return
    }
    loadProducts()
    loadCategories()
    // Only load promotions once on mount
    loadPromotions()
  }, [selectedBranch]) 
  // Load promotional data
 
  // Check for modal display
  useEffect(() => {
    console.log('🔄 Modal promotions changed:', modalPromotions.length)
    
    // Don't do anything here - let loadPromotions handle showing the modal
    // This prevents the race condition where the modal gets shown then immediately hidden
  }, [modalPromotions])


 

  const loadProducts = async () => {
    if (!selectedBranch) return

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 ProductCatalog: Loading products for branch:', selectedBranch.id)
      
      // Use the new product_units schema
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

      // Apply search filter
      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,sku.ilike.%${filters.searchQuery}%`)
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }

      // Order by name
      query = query.order('name', { ascending: true })

      // Get total count for pagination
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Apply pagination
      const from = (currentPage - 1) * 20
      const to = from + 19
      query = query.range(from, to)

      const { data: productsData, error: productsError } = await query

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

      // Transform the data to ProductWithUnits format
      const productsWithUnits = productsData.map(product => {
        const sellableUnits = product.product_units?.filter((unit: any) => unit.is_sellable) || []
        const defaultUnit = sellableUnits.find((unit: any) => unit.is_base_unit) || sellableUnits[0]
        
        if (!defaultUnit) {
          console.warn(`No sellable units found for product ${product.id}`)
          return null
        }

        // Apply price filters to the default unit
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
      }).filter(Boolean) as ProductWithUnits[]

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

  const loadCategories = async () => {
    try {
      console.log('🔄 ProductCatalog: Loading categories...')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ ProductCatalog: Error loading categories:', error)
        setError('Failed to load categories. Please try again.')
        setCategories([])
        return
      }

      if (!data || data.length === 0) {
        console.log('⚠️ ProductCatalog: No categories found')
        setCategories([])
        return
      }

      console.log(`✅ ProductCatalog: Successfully loaded ${data.length} categories`)
      setCategories(data)
      
    } catch (err) {
      console.error('❌ ProductCatalog: Error loading categories:', err)
      setError('Failed to load categories. Please try again.')
      setCategories([])
    }
  }

  const loadPromotions = async () => {
  // Prevent multiple simultaneous loads
  if (isLoadingPromotionsRef.current) {
    console.log('⏭️ Skipping promotion load - already in progress')
    return
  }

  try {
    isLoadingPromotionsRef.current = true
    console.log('🎉 Loading promotions...')
    
    // Fetch modal promotions with carousel detection
    const carouselData = await promotionService.getModalPromotionsForCarousel({
      branchId: selectedBranch?.id
    })

    console.log('📋 Loaded promotions:', {
      count: carouselData.promotions.length,
      useCarousel: carouselData.useCarousel,
      autoplayInterval: carouselData.autoplayInterval,
      promotionIds: carouselData.promotions.map(p => p.id)
    })
    
    setBannerPromotions([])
    setModalPromotions(carouselData.promotions)
    
    // If we have modal promotions and should show modal, display it
    if (carouselData.promotions.length > 0) {
      console.log('✅ Found modal promotions, checking if should show...')
      
      // Pass the promotion IDs to check if there are NEW promotions to show
      const promotionIds = carouselData.promotions.map(p => p.id)
      const shouldShow = promotionService.shouldShowModal(promotionIds)
      
      console.log('🎯 Should show modal:', shouldShow)
      
      if (shouldShow) {
        console.log('🎊 Displaying modal with carousel!')
        
        // Set modal to show FIRST, before marking as shown
        setShowModal(true)
        setCurrentModalIndex(0)
        
        // Small delay before marking as shown to prevent race condition
        setTimeout(() => {
          if (carouselData.useCarousel) {
            // Mark all promotions in carousel as shown
            promotionService.markCarouselAsShown(promotionIds)
            
            // Track carousel view
            promotionService.trackCarouselView(
              carouselData.promotions,
              selectedBranch?.id
            ).catch(err => console.error('Error tracking carousel view:', err))
            
            console.log('✅ Marked all carousel promotions as shown:', promotionIds)
          } else {
            // Single promotion - mark only first one as shown
            promotionService.markModalAsShown(carouselData.promotions[0].id)
            
            // Track single view
            promotionService.trackPromotionEvent({
              promotionId: carouselData.promotions[0].id,
              eventType: 'view',
              sessionId: promotionService['getSessionId'](),
              branchId: selectedBranch?.id,
              eventData: { displayMode: 'modal' }
            }).catch(err => console.error('Error tracking view:', err))
            
            console.log('✅ Marked single promotion as shown:', carouselData.promotions[0].id)
          }
        }, 100) // Small delay to ensure modal state is set first
        
      } else {
        console.log('⏭️ Skipping modal - already shown in this session')
      }
    } else {
      console.log('⚠️ No modal promotions found')
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

  // Promotional handlers
  const handleBannerDismiss = (promotionId: string) => {
    setDismissedBanners(prev => new Set([...prev, promotionId]))
  }

  const handleBannerAction = (promotion: Promotion) => {
    // Navigate to relevant products or apply filter
    if (promotion.conditions?.applicableProducts) {
      // Filter by applicable products
      setFilters(prev => ({ 
        ...prev, 
        searchQuery: promotion.conditions?.applicableProducts?.join(' ') || '',
        category: undefined 
      }))
    }
    // Scroll to products
    document.querySelector('.product-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleModalClose = async () => {
    console.log('❌ Closing modal')
    
    // Track dismissal for current promotion
    if (modalPromotions[currentModalIndex]) {
      await promotionService.trackPromotionDismissal(
        modalPromotions[currentModalIndex].id,
        undefined,
        selectedBranch?.id,
        'user_action'
      ).catch(err => console.error('Error tracking dismissal:', err))
    }
    
    setShowModal(false)
    setCurrentModalIndex(0)
  }
  const handleModalAction = async (promotion: Promotion) => {
    console.log('👆 Modal action clicked for:', promotion.title)
    
    // Track click event with carousel context
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
    
    handleBannerAction(promotion)
    handleModalClose()
  }

  const handleModalIndexChange = async (index: number) => {
    setCurrentModalIndex(index)
    
    // Track view when user navigates to a different slide
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
      {/* Promotional banners disabled: using modal-only display */}

      {/* Header */}
      <div className="bg-white shadow-lg border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/branch-selection')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedBranch?.name || 'Product Catalog'}
                  </h1>
                  {/* Real-time connection indicator - temporarily disabled */}
                  {/* <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isRealtimeConnected 
                        ? 'bg-green-500 animate-pulse' 
                        : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      isRealtimeConnected 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {isRealtimeConnected ? 'Live' : 'Offline'}
                    </span>
                  </div> */}
                </div>
                <p className="text-gray-600">
                  Agricultural Supplies & Veterinary Products
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Settings"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => navigate('/cart')}
                className="relative p-3 bg-agrivet-green text-white rounded-lg hover:bg-agrivet-green/90 transition-colors"
                title="View Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {getItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search for feeds, medicines, fertilizers..."
                value={filters.searchQuery || ''}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center space-x-2 px-4 py-3"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4" />
              <span>{products.length} Products</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>In Stock</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Real-time Inventory</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <FilterSidebar
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12">
                <LoadingSpinner message="Loading products..." />
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <ErrorMessage message={error} />
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No Products Found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We couldn't find any products matching your search criteria. 
                  Try adjusting your search terms or filters.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      setFilters({})
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
                {/* Products Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {products.length} Products Found
                    </h2>
                    <p className="text-sm text-gray-600">
                      Showing results for {selectedBranch?.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Star className="w-4 h-4" />
                    <span>All products in stock</span>
                  </div>
                </div>

                <ProductGrid
                  products={products}
                  viewMode={viewMode}
                />
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const page = i + 1
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                              <span className="text-gray-400">...</span>
                              <button
                                onClick={() => handlePageChange(totalPages)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
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

      {/* Promotional Modal */}
      {modalPromotions.length > 0 && (
        <PromoModal
          promotions={modalPromotions}
          isOpen={showModal}
          onClose={handleModalClose}
          onAction={handleModalAction}
          currentIndex={currentModalIndex}
          onIndexChange={handleModalIndexChange}
        />
      )}

      
    </div>
  )
}

export default ProductCatalog