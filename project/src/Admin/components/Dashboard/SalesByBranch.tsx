import React from 'react';
import { MapPin, TrendingUp, Users } from 'lucide-react';

const SalesByBranch: React.FC = () => {
  const branches = [
    {
      name: 'Main Branch - Quezon City',
      sales: '₱285K',
      orders: 1247,
      growth: '+15.2%',
      isPositive: true,
      customers: 892,
      color: 'bg-green-500'
    },
    {
      name: 'Branch 2 - Makati',
      sales: '₱198K',
      orders: 856,
      growth: '+8.7%',
      isPositive: true,
      customers: 634,
      color: 'bg-blue-500'
    },
    {
      name: 'Branch 3 - Cebu',
      sales: '₱156K',
      orders: 623,
      growth: '+12.1%',
      isPositive: true,
      customers: 445,
      color: 'bg-purple-500'
    },
    {
      name: 'Branch 4 - Davao',
      sales: '₱134K',
      orders: 534,
      growth: '-2.3%',
      isPositive: false,
      customers: 378,
      color: 'bg-orange-500'
    }
  ];

  const totalSales = branches.reduce((sum, branch) => {
    const value = parseInt(branch.sales.replace('₱', '').replace('K', ''));
    return sum + value;
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Sales by Branch</h3>
        <div className="text-sm text-gray-600">
          Total: ₱{totalSales}K
        </div>
      </div>

      <div className="space-y-4">
        {branches.map((branch, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${branch.color}`}></div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{branch.name}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{branch.orders} orders</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{branch.customers} customers</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{branch.sales}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-3 h-3 ${branch.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                  <span className={`text-xs ${branch.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {branch.growth}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${branch.color}`}
                style={{ width: `${(parseInt(branch.sales.replace('₱', '').replace('K', '')) / totalSales) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Best Performing</p>
            <p className="text-lg font-bold text-green-600">Main Branch</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Growth Leader</p>
            <p className="text-lg font-bold text-blue-600">+15.2%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByBranch;