import React from 'react';
import { ProductWithUnits } from '../../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: ProductWithUnits[];
  viewMode?: 'grid' | 'list';
  onProductClick: (product: ProductWithUnits) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  viewMode = 'grid',
  onProductClick
}) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4 w-full max-w-full overflow-hidden">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            viewMode="list"
            onAddToCart={onProductClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          viewMode="grid"
          onAddToCart={onProductClick}
        />
      ))}
    </div>
  );
};

export default ProductGrid;