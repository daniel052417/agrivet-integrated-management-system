import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface MetricCardProps {
  title: string;
  value?: string;
  change?: string;
  isPositive?: boolean;
  color: 'green' | 'blue' | 'orange' | 'purple';
  metricType?: 'todays_sales' | 'products_in_stock' | 'active_orders' | 'low_stock_alerts' | 'total_transactions' | 'active_sessions' | 'total_branches' | 'active_cashiers';
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
      // Get today's date for cases that need it
      const today = new Date().toISOString().split('T')[0];
      
      switch (metricType) {
        case 'todays_sales':
          // First try the strict filter, then fallback to more lenient filters
          let todaysSalesData = null;
          let salesError = null;

          // Try strict filter first
          const { data: strictData, error: strictError } = await supabase
            .from('pos_transactions')
            .select('total_amount, transaction_type, payment_status, status, transaction_date')
            .eq('transaction_type', 'sale')
            .eq('payment_status', 'completed')
            .eq('status', 'active')
            .gte('transaction_date', today + 'T00:00:00')
            .lte('transaction_date', today + 'T23:59:59');

          if (strictError) {
            console.error('Strict filter error:', strictError);
            salesError = strictError;
          } else if (strictData && strictData.length > 0) {
            todaysSalesData = strictData;
          } else {
            // Fallback: try without status filter
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('pos_transactions')
              .select('total_amount, transaction_type, payment_status, status, transaction_date')
              .eq('transaction_type', 'sale')
              .eq('payment_status', 'completed')
              .gte('transaction_date', today + 'T00:00:00')
              .lte('transaction_date', today + 'T23:59:59');

            if (fallbackError) {
              console.error('Fallback filter error:', fallbackError);
              salesError = fallbackError;
            } else if (fallbackData && fallbackData.length > 0) {
              todaysSalesData = fallbackData;
            } else {
              // Final fallback: try with just transaction_type
              const { data: finalData, error: finalError } = await supabase
                .from('pos_transactions')
                .select('total_amount, transaction_type, payment_status, status, transaction_date')
                .eq('transaction_type', 'sale')
                .gte('transaction_date', today + 'T00:00:00')
                .lte('transaction_date', today + 'T23:59:59');

              if (finalError) {
                console.error('Final filter error:', finalError);
                salesError = finalError;
              } else {
                todaysSalesData = finalData;
              }
            }
          }

          if (salesError) {
            console.error('Error fetching today\'s sales:', salesError);
            setMetricValue('Error');
          } else {
            const totalSales = todaysSalesData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
            console.log('Today\'s sales data:', { count: todaysSalesData?.length || 0, total: totalSales });
            setMetricValue('₱' + totalSales.toLocaleString());
          }
          break;
          
        case 'products_in_stock':
          const { data: inventoryData } = await supabase
            .from('inventory')
            .select('quantity_on_hand');
          
          const totalStock = inventoryData?.reduce((sum, item) => sum + (item.quantity_on_hand || 0), 0) || 0;
          setMetricValue(totalStock.toLocaleString());
          break;
          
        case 'active_orders':
          // Count pending POS transactions
          const { data: pendingTransactions } = await supabase
            .from('pos_transactions')
            .select('id')
            .eq('payment_status', 'pending')
            .eq('status', 'active');
          
          setMetricValue((pendingTransactions?.length || 0).toString());
          break;
          
        case 'low_stock_alerts':
          const { data: lowStockData } = await supabase
            .from('inventory')
            .select(`
              quantity_on_hand, 
              reorder_level,
              products!inner(
                is_active
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

        case 'total_transactions':
          // Get today's transaction count with fallback logic
          let todaysTransactionsData = null;
          let transactionsError = null;

          // Try strict filter first
          const { data: strictTxData, error: strictTxError } = await supabase
            .from('pos_transactions')
            .select('id, transaction_type, payment_status, status, transaction_date')
            .eq('transaction_type', 'sale')
            .eq('payment_status', 'completed')
            .eq('status', 'active')
            .gte('transaction_date', today + 'T00:00:00')
            .lte('transaction_date', today + 'T23:59:59');

          if (strictTxError) {
            console.error('Strict transaction filter error:', strictTxError);
            transactionsError = strictTxError;
          } else if (strictTxData && strictTxData.length > 0) {
            todaysTransactionsData = strictTxData;
          } else {
            // Fallback: try without status filter
            const { data: fallbackTxData, error: fallbackTxError } = await supabase
              .from('pos_transactions')
              .select('id, transaction_type, payment_status, status, transaction_date')
              .eq('transaction_type', 'sale')
              .eq('payment_status', 'completed')
              .gte('transaction_date', today + 'T00:00:00')
              .lte('transaction_date', today + 'T23:59:59');

            if (fallbackTxError) {
              console.error('Fallback transaction filter error:', fallbackTxError);
              transactionsError = fallbackTxError;
            } else if (fallbackTxData && fallbackTxData.length > 0) {
              todaysTransactionsData = fallbackTxData;
            } else {
              // Final fallback: try with just transaction_type
              const { data: finalTxData, error: finalTxError } = await supabase
                .from('pos_transactions')
                .select('id, transaction_type, payment_status, status, transaction_date')
                .eq('transaction_type', 'sale')
                .gte('transaction_date', today + 'T00:00:00')
                .lte('transaction_date', today + 'T23:59:59');

              if (finalTxError) {
                console.error('Final transaction filter error:', finalTxError);
                transactionsError = finalTxError;
              } else {
                todaysTransactionsData = finalTxData;
              }
            }
          }

          if (transactionsError) {
            console.error('Error fetching today\'s transactions:', transactionsError);
            setMetricValue('Error');
          } else {
            const transactionCount = todaysTransactionsData?.length || 0;
            console.log('Today\'s transactions data:', { count: transactionCount });
            setMetricValue(transactionCount.toString());
          }
          break;

        case 'active_sessions':
          // Count open POS sessions
          const { data: openSessions } = await supabase
            .from('pos_sessions')
            .select('id')
            .eq('status', 'open');
          
          setMetricValue((openSessions?.length || 0).toString());
          break;

        case 'total_branches':
          // Count active branches
          const { data: branches } = await supabase
            .from('branches')
            .select('id')
            .eq('is_active', true);
          
          setMetricValue((branches?.length || 0).toString());
          break;

        case 'active_cashiers':
          // Count active cashiers (users with cashier role)
          const { data: cashiers } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'cashier')
            .eq('is_active', true);
          
          setMetricValue((cashiers?.length || 0).toString());
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





