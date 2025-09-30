import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ShoppingCart, ArrowLeft, Grid, List, Star, Package, Clock, TrendingUp } from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'
import { useCart } from '../contexts/CartContext'
import { ProductVariant, SearchFilters, Category, Promotion, NotificationData } from '../types'
import { promotionService } from '../services/promotionService'
import ProductGrid from '../components/catalog/ProductGrid'
import SearchBar from '../components/catalog/SearchBar'
import FilterSidebar from '../components/catalog/FilterSidebar'
import PromoBanner from '../components/promotions/PromoBanner'
import PromoModal from '../components/promotions/PromoModal'
import PushNotificationSimulator from '../components/promotions/PushNotificationSimulator'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

// Sample product data for demonstration
const sampleProducts: ProductVariant[] = [
  {
    id: '1',
    name: 'Premium Chicken Feed 50kg',
    sku: 'PCF-50KG',
    price: 1250.00,
    cost: 1000.00,
    weight_kg: 50,
    unit_of_measure: 'bag',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product_id: '1',
    products: {
      id: '1',
      name: 'Premium Chicken Feed',
      sku: 'PCF',
      description: 'High-quality complete feed for broiler chickens',
      category_id: '1',
      supplier_id: '1',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      categories: {
        id: '1',
        name: 'Poultry Feeds',
        description: 'Complete feeds for poultry',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  },
  {
    id: '2',
    name: 'Layer Feed 25kg',
    sku: 'LF-25KG',
    price: 650.00,
    cost: 520.00,
    weight_kg: 25,
    unit_of_measure: 'bag',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product_id: '2',
    products: {
      id: '2',
      name: 'Layer Feed',
      sku: 'LF',
      description: 'Specialized feed for laying hens',
      category_id: '1',
      supplier_id: '1',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      categories: {
        id: '1',
        name: 'Poultry Feeds',
        description: 'Complete feeds for poultry',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  },
  {
    id: '3',
    name: 'Vitamin B Complex 100ml',
    sku: 'VBC-100ML',
    price: 180.00,
    cost: 120.00,
    weight_kg: 0.1,
    unit_of_measure: 'bottle',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product_id: '3',
    products: {
      id: '3',
      name: 'Vitamin B Complex',
      sku: 'VBC',
      description: 'Essential vitamins for livestock health',
      category_id: '2',
      supplier_id: '2',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      categories: {
        id: '2',
        name: 'Veterinary Supplies',
        description: 'Medicines and supplements for animals',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  },
  {
    id: '4',
    name: 'Antibiotic Injection 10ml',
    sku: 'ABI-10ML',
    price: 95.00,
    cost: 65.00,
    weight_kg: 0.01,
    unit_of_measure: 'vial',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product_id: '4',
    products: {
      id: '4',
      name: 'Antibiotic Injection',
      sku: 'ABI',
      description: 'Broad-spectrum antibiotic for livestock',
      category_id: '2',
      supplier_id: '2',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      categories: {
        id: '2',
        name: 'Veterinary Supplies',
        description: 'Medicines and supplements for animals',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  },
  {
    id: '5',
    name: 'Fertilizer NPK 15-15-15 50kg',
    sku: 'NPK-50KG',
    price: 850.00,
    cost: 680.00,
    weight_kg: 50,
    unit_of_measure: 'bag',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product_id: '5',
    products: {
      id: '5',
      name: 'NPK Fertilizer',
      sku: 'NPK',
      description: 'Balanced fertilizer for crops',
      category_id: '3',
      supplier_id: '3',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      categories: {
        id: '3',
        name: 'Crop Inputs',
        description: 'Fertilizers and crop protection',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  },
  {
    id: '6',
    name: 'Pesticide Spray 1L',
    sku: 'PS-1L',
    price: 320.00,
    cost: 240.00,
    weight_kg: 1,
    unit_of_measure: 'bottle',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product_id: '6',
    products: {
      id: '6',
      name: 'Pesticide Spray',
      sku: 'PS',
      description: 'Effective pest control for crops',
      category_id: '3',
      supplier_id: '3',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      categories: {
        id: '3',
        name: 'Crop Inputs',
        description: 'Fertilizers and crop protection',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  }
]

const sampleCategories: Category[] = [
  {
    id: '1',
    name: 'Poultry Feeds',
    description: 'Complete feeds for poultry',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Veterinary Supplies',
    description: 'Medicines and supplements for animals',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Crop Inputs',
    description: 'Fertilizers and crop protection',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const ProductCatalog: React.FC = () => {
  const navigate = useNavigate()
  const { selectedBranch } = useBranch()
  const { getItemCount } = useCart()
  
  const [products, setProducts] = useState<ProductVariant[]>([])
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
    loadPromotions()
  }, [selectedBranch, filters, currentPage])

  // Load promotional data
  useEffect(() => {
    if (selectedBranch) {
      loadPromotions()
    }
  }, [selectedBranch])

  // Check for modal display
  useEffect(() => {
    if (modalPromotions.length > 0 && promotionService.shouldShowModal()) {
      setCurrentModalIndex(0)
      setShowModal(true)
      promotionService.markModalAsShown()
    }
  }, [modalPromotions])

  const loadProducts = async () => {
    if (!selectedBranch) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Use sample data for demonstration
      await new Promise(resolve => setTimeout(resolve, 800))
      
      let filteredProducts = [...sampleProducts]
      
      // Apply filters
      if (filters.searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(filters.searchQuery!.toLowerCase()) ||
          product.products?.name.toLowerCase().includes(filters.searchQuery!.toLowerCase()) ||
          product.products?.description.toLowerCase().includes(filters.searchQuery!.toLowerCase())
        )
      }
      
      if (filters.category) {
        filteredProducts = filteredProducts.filter(product => 
          product.products?.category_id === filters.category
        )
      }
      
      if (filters.priceMin) {
        filteredProducts = filteredProducts.filter(product => product.price >= filters.priceMin!)
      }
      
      if (filters.priceMax) {
        filteredProducts = filteredProducts.filter(product => product.price <= filters.priceMax!)
      }
      
      setProducts(filteredProducts)
      setTotalPages(Math.ceil(filteredProducts.length / 20))
      
      // In real app, this would be:
      // const response = await productService.getProducts(
      //   selectedBranch.id,
      //   filters,
      //   currentPage,
      //   20
      // )
      // setProducts(response.data)
      // setTotalPages(response.pagination.totalPages)
    } catch (err) {
      setError('Failed to load products. Please try again.')
      console.error('Error loading products:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      // Use sample data for demonstration
      setCategories(sampleCategories)
      
      // In real app, this would be:
      // const categoriesData = await productService.getCategories()
      // setCategories(categoriesData)
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadPromotions = async () => {
    try {
      const [bannerPromos, modalPromos] = await Promise.all([
        promotionService.getBannerPromotions(),
        promotionService.getModalPromotions()
      ])
      
      setBannerPromotions(bannerPromos)
      setModalPromotions(modalPromos)
    } catch (err) {
      console.error('Error loading promotions:', err)
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

  const handleModalClose = () => {
    setShowModal(false)
    setCurrentModalIndex(0)
  }

  const handleModalAction = (promotion: Promotion) => {
    handleBannerAction(promotion)
    handleModalClose()
  }

  const handleModalIndexChange = (index: number) => {
    setCurrentModalIndex(index)
  }

  const handleSendNotification = async (notificationData: NotificationData) => {
    try {
      await promotionService.sendNotification(notificationData)
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  if (!selectedBranch) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Promotional Banners */}
      {bannerPromotions
        .filter(promo => !dismissedBanners.has(promo.id))
        .map((promotion) => (
          <PromoBanner
            key={promotion.id}
            promotion={promotion}
            onDismiss={() => handleBannerDismiss(promotion.id)}
            onAction={() => handleBannerAction(promotion)}
          />
        ))}

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
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedBranch?.name || 'Product Catalog'}
                </h1>
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
              <span>Updated Today</span>
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

      {/* Push Notification Simulator */}
      <PushNotificationSimulator
        onSendNotification={handleSendNotification}
      />
    </div>
  )
}

export default ProductCatalog
