import React from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const InventorySummary: React.FC = () => {
  const categories = [
    { name: 'Medicines', stock: 1245, value: '₱485K', trend: '+5.2%', color: 'bg-red-500', isPositive: true },
    { name: 'Agriculture', stock: 892, value: '₱320K', trend: '+8.1%', color: 'bg-green-500', isPositive: true },
    { name: 'Fruits', stock: 456, value: '₱180K', trend: '-2.3%', color: 'bg-orange-500', isPositive: false },
    { name: 'Tools', stock: 254, value: '₱95K', trend: '+12.5%', color: 'bg-blue-500', isPositive: true },
  ];

  const totalValue = categories.reduce((sum, cat) => {
    const value = parseInt(cat.value.replace('₱', '').replace('K', '')) * 1000;
    return sum + value;
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Summary</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>Total Value: ₱{(totalValue / 1000)}K</span>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500">{category.stock} items</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{category.value}</p>
              <div className="flex items-center space-x-1">
                {category.isPositive ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />
                )}
                <span className={`text-xs ${category.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {category.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">2,847</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">23</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 text-red-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Out of Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">8</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummary;