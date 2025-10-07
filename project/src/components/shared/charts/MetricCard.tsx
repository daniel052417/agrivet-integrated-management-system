import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface MetricCardProps {
  title: string;
  value?: string;
  change?: string;
  isPositive?: boolean;
  color: 'green' | 'blue' | 'orange' | 'purple';
  metricType?: 'todays_sales' | 'products_in_stock' | 'active_orders' | 'low_stock_alerts';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  isPositive, 
  color, 
  metricType,
  leftIcon,
  rightIcon,
  className = "",
  loading = false
}) => {
  const [metricValue, setMetricValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const colorClasses = {
    green: {
      bg: 'bg-white',
      accent: 'bg-green-500',
      text: 'text-green-600',
      lightBg: 'bg-green-50'
    },
    blue: {
      bg: 'bg-white',
      accent: 'bg-blue-500',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50'
    },
    orange: {
      bg: 'bg-white',
      accent: 'bg-orange-500',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50'
    },
    purple: {
      bg: 'bg-white',
      accent: 'bg-purple-500',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50'
    }
  };

  const fetchMetricData = async () => {
    if (!metricType) return;
    
    setIsLoading(true);
    try {
      switch (metricType) {
        case 'todays_sales':
          const today = new Date().toISOString().split('T')[0];
          const { data: salesData } = await supabase
            .from('sales_transactions')
            .select('total_amount')
            .gte('transaction_date', `${today}T00:00:00`)
            .lt('transaction_date', `${today}T23:59:59`);
          
          const totalSales = salesData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
          setMetricValue(`₱${totalSales.toLocaleString()}`);
          break;
          
        case 'products_in_stock':
          const { data: inventoryData } = await supabase
            .from('inventory')
            .select('quantity_on_hand');
          
          const totalStock = inventoryData?.reduce((sum, item) => sum + (item.quantity_on_hand || 0), 0) || 0;
          setMetricValue(totalStock.toLocaleString());
          break;
          
        case 'active_orders':
          // Since sales_orders doesn't exist, we'll count pending sales transactions
          const { data: pendingTransactions } = await supabase
            .from('sales_transactions')
            .select('id')
            .eq('payment_status', 'pending');
          
          setMetricValue((pendingTransactions?.length || 0).toString());
          break;
          
        case 'low_stock_alerts':
          const { data: lowStockData } = await supabase
            .from('inventory')
            .select(`
              quantity_on_hand, 
              reorder_level,
              products!inner(
                is_active,
                product_units!inner(
                  id
                )
              )
            `)
            .not('quantity_on_hand', 'is', null)
            .not('reorder_level', 'is', null)
            .eq('products.is_active', true);
          
          // Filter client-side for low stock items
          const lowStockCount = lowStockData?.filter(item => 
            item.quantity_on_hand <= item.reorder_level
          ).length || 0;
          
          setMetricValue(lowStockCount.toString());
          break;
      }
    } catch (error) {
      console.error('Error fetching metric data:', error);
      setMetricValue('Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (metricType) {
      fetchMetricData();
    }
  }, [metricType]);

  const displayValue = value || metricValue;
  const displayChange = change;

  if (loading || isLoading) {
    return (
      <div className={`${colorClasses[color].bg} rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colorClasses[color].bg} rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {leftIcon && (
            <div className={`w-12 h-12 ${colorClasses[color].lightBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              {leftIcon}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {displayValue}
            </p>
          </div>
        </div>
        {rightIcon && (
          <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
            {rightIcon}
          </div>
        )}
      </div>
      
      {displayChange && (
        <div className="flex items-center space-x-1">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {displayChange}
          </span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}
      
      <div className={`w-full h-1 ${colorClasses[color].accent} rounded-full mt-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
    </div>
  );
};

export default MetricCard;





