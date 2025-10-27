import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ProductRow = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number | null;
  category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

type LowStockItem = {
  name: string;
  stock: number;
  minimum: number;
  category: string;
  urgency: 'critical' | 'warning' | 'low';
};

const LowStockAlert: React.FC = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLowStockData();
  }, []);

  const loadLowStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load inventory data with proper joins to get product and category information
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          id,
          quantity_on_hand,
          quantity_available,
          reorder_level,
          max_stock_level,
          products!inner(
            id,
            name,
            sku,
            category_id,
            is_active,
            product_units!inner(
              id,
              unit_name,
              unit_label,
              conversion_factor,
              is_base_unit
            )
          )
        `)
        .not('quantity_on_hand', 'is', null)
        .not('reorder_level', 'is', null)
        .eq('products.is_active', true)
        .order('quantity_on_hand', { ascending: true });

      if (inventoryError) {
        console.error('Inventory query error:', inventoryError);
        throw inventoryError;
      }

      console.log('Raw inventory data:', inventoryData);

      // Load categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);

      if (categoriesError) {
        console.error('Categories query error:', categoriesError);
        throw categoriesError;
      }

      console.log('Categories data:', categories);

      // Filter low stock items and determine urgency
      const lowStockList: LowStockItem[] = [];
      
      inventoryData?.forEach(item => {
        // Only process items where quantity_on_hand <= reorder_level (low stock condition)
        if (item.quantity_on_hand <= item.reorder_level) {
          const category = categories?.find(c => c.id === item.products.category_id);
          let urgency: 'critical' | 'warning' | 'low' = 'low';
          
          // Determine urgency based on stock levels
          if (item.quantity_on_hand === 0) {
            urgency = 'critical';
          } else if (item.quantity_on_hand <= (item.reorder_level || 0) * 0.5) {
            urgency = 'warning';
          } else if (item.quantity_on_hand <= item.reorder_level) {
            urgency = 'low';
          }

          // Create display name with unit information
          const productName = item.products.name;
          const unitName = item.products.product_units?.[0]?.unit_name || 'unit';
          const displayName = unitName !== productName 
            ? `${productName} - ${unitName}` 
            : productName;

          lowStockList.push({
            name: displayName,
            stock: Number(item.quantity_on_hand),
            minimum: Number(item.reorder_level),
            category: category?.name || 'Uncategorized',
            urgency
          });
        }
      });

      // Sort by urgency and stock level
      lowStockList.sort((a, b) => {
        const urgencyOrder = { critical: 0, warning: 1, low: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return a.stock - b.stock;
      });

      console.log('Filtered low stock items:', lowStockList);
      setLowStockItems(lowStockList.slice(0, 10)); // Show top 10 most urgent
    } catch (err: any) {
      console.error('Error loading low stock data:', err);
      setError(err.message || 'Failed to load low stock data');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Alerts</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{lowStockItems.length} alerts</span>
          </div>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Good!</h3>
            <p className="text-gray-500">No low stock alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item, index) => (
              <div key={item.id} className={`p-3 rounded-lg border ${getUrgencyColor(item.urgency)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getUrgencyIcon(item.urgency)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                        {item.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.category}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span>
                        Stock: <span className="font-semibold">{item.stock}</span>
                      </span>
                      <span>
                        Min: <span className="font-semibold">{item.minimum}</span>
                      </span>
                      <span className="text-red-600 font-semibold">
                        {item.stock === 0 ? 'Out of Stock' : `${item.minimum - item.stock} below minimum`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all low stock items
            </button>
          </div>
        )}
      </div>
  );
};

export default LowStockAlert;

