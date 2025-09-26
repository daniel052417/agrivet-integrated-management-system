import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type InventoryRow = {
  id: string;
  quantity_on_hand: number;
  quantity_available: number;
  reorder_level: number;
  max_stock_level: number;
  product_variants: {
    id: string;
    name: string;
    sku: string;
    variant_type: string;
    variant_value: string;
    products: {
      id: string;
      name: string;
      sku: string;
      category_id: string;
      unit_of_measure: string;
      is_active: boolean;
    };
  };
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
  sku: string;
  unit: string;
  variantInfo: string;
};

const LowStockAlert: React.FC = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStock = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load inventory data with proper joins to get product and category information
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select(`
            id,
            quantity_on_hand,
            quantity_available,
            reorder_level,
            max_stock_level,
            product_variants!inner(
              id,
              name,
              sku,
              variant_type,
              variant_value,
              products!inner(
                id,
                name,
                sku,
                category_id,
                unit_of_measure,
                is_active
              )
            )
          `)
          .not('quantity_on_hand', 'is', null)
          .not('reorder_level', 'is', null)
          .eq('product_variants.products.is_active', true)
          .order('quantity_on_hand', { ascending: true });

        if (inventoryError) {
          console.error('Inventory query error:', inventoryError);
          throw inventoryError;
        }

        // Load categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true);

        if (categoriesError) {
          console.error('Categories query error:', categoriesError);
          throw categoriesError;
        }

        const categoryIdToName = new Map<string, string>();
        (categories as CategoryRow[] | null)?.forEach((c) => categoryIdToName.set(c.id, c.name));

        // Filter low stock items and determine urgency
        const lowStock: LowStockItem[] = (inventoryData as any[] | null)
          ?.filter((item) => {
            // Only process items where quantity_on_hand <= reorder_level (low stock condition)
            return item.quantity_on_hand <= item.reorder_level;
          })
          .map((item) => {
            const category = categoryIdToName.get(item.product_variants.products.category_id) || 'Uncategorized';
            
            // Determine urgency based on stock levels
            let urgency: 'critical' | 'warning' | 'low' = 'low';
            if (item.quantity_on_hand === 0) {
              urgency = 'critical';
            } else if (item.quantity_on_hand <= (item.reorder_level || 0) * 0.5) {
              urgency = 'warning';
            } else if (item.quantity_on_hand <= item.reorder_level) {
              urgency = 'low';
            }

            // Create display name with variant information
            const productName = item.product_variants.products.name;
            const variantName = item.product_variants.name;
            const displayName = variantName !== productName 
              ? `${productName} - ${variantName}` 
              : productName;

            // Create variant info string
            const variantInfo = `${item.product_variants.variant_type}: ${item.product_variants.variant_value}`;

            return {
              name: displayName,
              stock: Number(item.quantity_on_hand),
              minimum: Number(item.reorder_level),
              category,
              urgency,
              sku: item.product_variants.sku,
              unit: item.product_variants.products.unit_of_measure,
              variantInfo
            };
          })
          // Sort by urgency and stock level
          .sort((a, b) => {
            const urgencyOrder = { critical: 0, warning: 1, low: 2 };
            if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
              return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            }
            return a.stock - b.stock;
          })
          // Limit to top 8 alerts
          .slice(0, 8) || [];

        setItems(lowStock);
      } catch (err: any) {
        console.error('Failed to load low stock alerts', err);
        setError('Failed to load low stock alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, []);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h3>
        <div className="flex items-center space-x-1 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{items.length}</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-12 bg-orange-50/70 rounded-lg animate-pulse" />
          <div className="h-12 bg-orange-50/70 rounded-lg animate-pulse" />
          <div className="h-12 bg-orange-50/70 rounded-lg animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getUrgencyColor(item.urgency)}`}>
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
                    {item.category} • SKU: {item.sku}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.variantInfo} • Unit: {item.unit}
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
          {items.length === 0 && (
            <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg text-center">No low stock items 🎉</div>
          )}
        </div>
      )}

      <button className="w-full mt-4 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
        View All Alerts
      </button>
    </div>
  );
};

export default LowStockAlert;