import React from 'react';
import { Package, TrendingUp, Star } from 'lucide-react';

const SalesByProduct: React.FC = () => {
  const products = [
    {
      name: 'Veterinary Medicines',
      category: 'Medicines',
      sales: '₱145K',
      units: 2847,
      growth: '+18.5%',
      isPositive: true,
      rating: 4.8,
      color: 'bg-red-500'
    },
    {
      name: 'Organic Fertilizers',
      category: 'Agriculture',
      sales: '₱98K',
      units: 1923,
      growth: '+12.3%',
      isPositive: true,
      rating: 4.6,
      color: 'bg-green-500'
    },
    {
      name: 'Fresh Fruits',
      category: 'Fruits',
      sales: '₱87K',
      units: 1456,
      growth: '+8.7%',
      isPositive: true,
      rating: 4.9,
      color: 'bg-orange-500'
    },
    {
      name: 'Garden Tools',
      category: 'Tools',
      sales: '₱65K',
      units: 892,
      growth: '+15.2%',
      isPositive: true,
      rating: 4.5,
      color: 'bg-blue-500'
    },
    {
      name: 'Animal Feed',
      category: 'Agriculture',
      sales: '₱54K',
      units: 734,
      growth: '-3.2%',
      isPositive: false,
      rating: 4.3,
      color: 'bg-yellow-500'
    }
  ];

  const totalSales = products.reduce((sum, product) => {
    const value = parseInt(product.sales.replace('₱', '').replace('K', ''));
    return sum + value;
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Top Products</h3>
        <div className="text-sm text-gray-600">
          Total: ₱{totalSales}K
        </div>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-500">{product.category}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-500">{product.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">{product.units} units</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{product.sales}</p>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-3 h-3 ${product.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                <span className={`text-xs ${product.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {product.growth}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Best Seller</p>
            <p className="text-xs font-bold text-red-600">Vet Medicines</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Highest Growth</p>
            <p className="text-xs font-bold text-green-600">+18.5%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Top Rated</p>
            <p className="text-xs font-bold text-orange-600">4.9★</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByProduct;