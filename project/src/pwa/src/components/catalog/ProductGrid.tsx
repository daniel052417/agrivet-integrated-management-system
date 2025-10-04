import React from 'react'
import { ProductWithUnits } from '../../types'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: ProductWithUnits[]
  viewMode: 'grid' | 'list'
  onProductClick?: (product: ProductWithUnits) => void
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  viewMode,
  onProductClick 
}) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            viewMode="list"
            onAddToCart={onProductClick}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          viewMode="grid"
          onAddToCart={onProductClick}
        />
      ))}
    </div>
  )
}

export default ProductGrid
