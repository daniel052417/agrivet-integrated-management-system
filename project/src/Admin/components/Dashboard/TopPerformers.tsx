import React from 'react';
import { User, Trophy, TrendingUp, Award } from 'lucide-react';

const TopPerformers: React.FC = () => {
  const performers = [
    {
      name: 'Maria Santos',
      role: 'Store Manager',
      sales: '₱125K',
      orders: 234,
      rating: 4.9,
      growth: '+22.5%',
      avatar: null,
      badge: 'gold'
    },
    {
      name: 'Juan Dela Cruz',
      role: 'Sales Associate',
      sales: '₱98K',
      orders: 189,
      rating: 4.7,
      growth: '+18.3%',
      avatar: null,
      badge: 'silver'
    },
    {
      name: 'Ana Rodriguez',
      role: 'Veterinarian',
      sales: '₱87K',
      orders: 156,
      rating: 4.8,
      growth: '+15.7%',
      avatar: null,
      badge: 'bronze'
    }
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'bronze': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'gold': return Trophy;
      case 'silver': return Award;
      case 'bronze': return Award;
      default: return Award;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
        <div className="text-sm text-gray-600">This Month</div>
      </div>

      <div className="space-y-4">
        {performers.map((performer, index) => {
          const BadgeIcon = getBadgeIcon(performer.badge);
          return (
            <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${getBadgeColor(performer.badge)}`}>
                  <BadgeIcon className="w-3 h-3" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                    <p className="text-xs text-gray-500">{performer.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{performer.sales}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">{performer.growth}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{performer.orders} orders</span>
                    <span>•</span>
                    <span>{performer.rating}★ rating</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Team Average</p>
            <p className="text-lg font-bold text-gray-900">₱78K</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Performance</p>
            <p className="text-lg font-bold text-green-600">+18.8%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;