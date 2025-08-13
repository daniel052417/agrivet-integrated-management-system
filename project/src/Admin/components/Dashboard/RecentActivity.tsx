import React from 'react';
import { ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'sale',
      icon: ShoppingCart,
      title: 'New sale recorded',
      description: 'Order #1234 - ₱2,450',
      time: '2 min ago',
      color: 'text-green-600 bg-green-50',
    },
    {
      id: 2,
      type: 'stock',
      icon: Package,
      title: 'Stock updated',
      description: 'Veterinary Medicine restocked',
      time: '15 min ago',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 3,
      type: 'staff',
      icon: Users,
      title: 'New staff member',
      description: 'John Doe added to team',
      time: '1 hour ago',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 4,
      type: 'alert',
      icon: AlertTriangle,
      title: 'Low stock alert',
      description: 'Fertilizer running low',
      time: '2 hours ago',
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${activity.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;