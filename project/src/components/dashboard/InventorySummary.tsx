import React, { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ProductRow = {
  category_id: string;
  stock_quantity: number;
  unit_price: number;
  cost_price: number;
  minimum_stock: number;
};

type CategoryRow = {
  id: string;
  name: string;
};

type CategorySummary = {
  name: string;
  stock: number;
  value: number;
  color: string;
};

const COLORS = ['bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const InventorySummary: React.FC = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load inventory with product variants and products
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          quantity_on_hand,
          product_variants!inner(
            price,
            cost,
            product_id,
            products!inner(
              category_id,
              name
            )
          )
        `);

      if (inventoryError) throw inventoryError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Transform inventory data to match expected format
      const transformedProducts = inventoryData?.map(item => ({
        category_id: item.product_variants.products.category_id,
        stock_quantity: item.quantity_on_hand,
        unit_price: item.product_variants.price,
        cost_price: item.product_variants.cost || 0,
        minimum_stock: 0 // Default since reorder_level is in inventory table
      })) || [];

      setProducts(transformedProducts);
      setCategories(categoriesData || []);
    } catch (err: any) {
      console.error('Error loading inventory data:', err);
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const categorySummary = useMemo(() => {
    const summary = new Map<string, CategorySummary>();
    
    categories.forEach(category => {
      summary.set(category.id, {
        name: category.name,
        stock: 0,
        value: 0,
        color: COLORS[summary.size % COLORS.length]
      });
    });

    products.forEach(product => {
      const category = summary.get(product.category_id);
      if (category) {
        category.stock += product.stock_quantity;
        category.value += product.stock_quantity * product.unit_price;
      }
    });

    return Array.from(summary.values()).sort((a, b) => b.value - a.value);
  }, [products, categories]);

  const totalStock = useMemo(() => 
    products.reduce((sum, product) => sum + product.stock_quantity, 0), 
    [products]
  );

  const totalValue = useMemo(() => 
    products.reduce((sum, product) => sum + (product.stock_quantity * product.unit_price), 0), 
    [products]
  );

  const lowStockCount = useMemo(() => 
    products.filter(product => product.stock_quantity <= product.minimum_stock).length, 
    [products]
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Inventory</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Inventory Summary</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4" />
              <span>{totalStock.toLocaleString()} items</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>{lowStockCount} low stock</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrencyPHP(totalValue)}
          </div>
          <div className="text-sm text-gray-600">Total Inventory Value</div>
        </div>

        <div className="space-y-3">
          {categorySummary.slice(0, 6).map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrencyPHP(category.value)}
                </div>
                <div className="text-xs text-gray-500">
                  {category.stock.toLocaleString()} items
                </div>
              </div>
            </div>
          ))}
        </div>

        {categorySummary.length > 6 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View all {categorySummary.length} categories
            </button>
          </div>
        )}

        {lowStockCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                {lowStockCount} products are running low on stock
              </span>
            </div>
          </div>
        )}
      </div>
  );
};

export default InventorySummary;

