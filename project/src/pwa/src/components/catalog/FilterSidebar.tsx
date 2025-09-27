import React from 'react'
import { X, ChevronDown } from 'lucide-react'
import { SearchFilters, Category } from '../../types'

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  filters: SearchFilters
  onFilterChange: (filters: Partial<SearchFilters>) => void
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  categories,
  filters,
  onFilterChange
}) => {
  const handleCategoryChange = (categoryId: string | undefined) => {
    onFilterChange({ category: categoryId })
  }

  const handlePriceChange = (field: 'priceMin' | 'priceMax', value: string) => {
    const numValue = value ? parseFloat(value) : undefined
    onFilterChange({ [field]: numValue })
  }

  const handleStockChange = (inStock: boolean | undefined) => {
    onFilterChange({ inStock })
  }

  const clearFilters = () => {
    onFilterChange({
      category: undefined,
      priceMin: undefined,
      priceMax: undefined,
      inStock: undefined
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 lg:relative lg:shadow-none lg:border-r lg:border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={!filters.category}
                    onChange={() => handleCategoryChange(undefined)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">All Categories</span>
                </label>
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={filters.category === category.id}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Min Price (₱)
                  </label>
                  <input
                    type="number"
                    value={filters.priceMin || ''}
                    onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Max Price (₱)
                  </label>
                  <input
                    type="number"
                    value={filters.priceMax || ''}
                    onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                    placeholder="1000"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Availability</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="stock"
                    checked={filters.inStock === undefined}
                    onChange={() => handleStockChange(undefined)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">All Items</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="stock"
                    checked={filters.inStock === true}
                    onChange={() => handleStockChange(true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full btn-outline text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default FilterSidebar
