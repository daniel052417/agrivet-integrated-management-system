import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Activity = {
  id: string;
  time: string; // ISO string
  type: 'sale' | 'stock' | 'staff' | 'alert';
  title: string;
  description: string;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(1, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  const diffW = Math.floor(diffD / 7);
  return `${diffW}w ago`;
}

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const activityList: Activity[] = [];

      // Load recent sales
      const { data: recentSales, error: salesError } = await supabase
        .from('pos_transactions')
        .select('id, total_amount, transaction_date, customer_id')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .order('transaction_date', { ascending: false })
        .limit(5);

      if (!salesError && recentSales) {
        recentSales.forEach(sale => {
          activityList.push({
            id: `sale-${sale.id}`,
            time: sale.transaction_date,
            type: 'sale',
            title: 'New Sale',
            description: `₱${(sale.total_amount || 0).toLocaleString()} transaction${sale.customer_id ? ' with customer' : ''}`
          });
        });
      }

      // Load low stock alerts from inventory table (client-side filtering)
      const { data: lowStock, error: stockError } = await supabase
        .from('inventory')
        .select(`
          quantity_on_hand,
          reorder_level,
          products!inner(
            name,
            is_active,
            product_units!inner(
              unit_name
            )
          )
        `)
        .not('quantity_on_hand', 'is', null)
        .not('reorder_level', 'is', null)
        .eq('products.is_active', true)
        .limit(50); // Get more data to filter client-side

      if (!stockError && lowStock) {
        // Filter for low stock items (quantity_on_hand <= reorder_level)
        const lowStockItems = lowStock.filter(item => 
          item.quantity_on_hand <= item.reorder_level
        );
        
        lowStockItems.slice(0, 3).forEach(item => {
          activityList.push({
            id: `stock-${item.products.id}`,
            time: new Date().toISOString(),
            type: 'alert',
            title: 'Low Stock Alert',
            description: `${item.products.name} is running low (${item.quantity_on_hand} remaining)`
          });
        });
      }

      // Load recent staff activities (mock data for now)
      activityList.push({
        id: 'staff-1',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        type: 'staff',
        title: 'Staff Update',
        description: 'New staff member added to the system'
      });

      // Sort by time and take most recent
      const sortedActivities = activityList
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      setActivities(sortedActivities);
    } catch (err: any) {
      console.error('Error loading recent activity:', err);
      setError(err.message || 'Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'stock':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'staff':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 text-green-800';
      case 'stock':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-purple-100 text-purple-800';
      case 'alert':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Activity</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="text-sm text-gray-600">
            {activities.length} activities
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
              
              <div className="flex-shrink-0 text-xs text-gray-500">
                {timeAgo(activity.time)}
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
            <p className="text-gray-500">No recent activities found.</p>
          </div>
        )}

        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all activities
            </button>
          </div>
        )}
      </div>
  );
};

export default RecentActivity;

