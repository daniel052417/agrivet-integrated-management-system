import React from 'react';
import { AlertTriangle } from 'lucide-react';

const LowStockAlert: React.FC = () => {
  const lowStockItems = [
    { name: 'Veterinary Syringes', stock: 12, minimum: 50, category: 'Medicines' },
    { name: 'Organic Fertilizer', stock: 8, minimum: 25, category: 'Agriculture' },
    { name: 'Animal Feed', stock: 15, minimum: 40, category: 'Agriculture' },
    { name: 'Pruning Shears', stock: 3, minimum: 15, category: 'Tools' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h3>
        <div className="flex items-center space-x-1 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{lowStockItems.length}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {lowStockItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">{item.category}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-orange-600">{item.stock}</p>
              <p className="text-xs text-gray-500">Min: {item.minimum}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
        View All Alerts
      </button>
    </div>
  );
};

export default LowStockAlert;