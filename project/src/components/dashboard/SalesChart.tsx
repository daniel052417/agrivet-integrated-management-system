import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Target, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type SeriesType = 'sales' | 'orders';
type TxRow = { total_amount: number; transaction_date: string };

const NUM_POINTS = 7;
const CHART_HEIGHT = 280;
const Y_AXIS_TICKS = 5;

function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
function monthLabel(date: Date) { return date.toLocaleString('en-US', { month: 'short' }); }

const SalesChart: React.FC = () => {
  const [activeSeries, setActiveSeries] = useState<SeriesType>('sales');
  const [labels, setLabels] = useState<string[]>([]);
  const [months, setMonths] = useState<Date[]>([]);
  const [salesData, setSalesData] = useState<number[]>(Array(NUM_POINTS).fill(0));
  const [ordersData, setOrdersData] = useState<number[]>(Array(NUM_POINTS).fill(0));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }), []);

  useEffect(() => {
    const now = new Date();
    const monthsArray: Date[] = [];
    for (let i = NUM_POINTS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsArray.push(d);
    }
    setLabels(monthsArray.map(monthLabel));
    setMonths(monthsArray);

    loadSalesData(monthsArray);
  }, []);

  const loadSalesData = async (monthsArray: Date[]) => {
    try {
      setLoading(true);
      setError(null);

      const startDate = monthsArray[0].toISOString().split('T')[0];
      const endDate = new Date(monthsArray[monthsArray.length - 1].getFullYear(), monthsArray[monthsArray.length - 1].getMonth() + 1, 0).toISOString().split('T')[0];

      // Get sales data by month from pos_transactions with fallback logic
      let transactions = null;
      let error = null;

      // Try strict filter first
      const { data: strictData, error: strictError } = await supabase
        .from('pos_transactions')
        .select('total_amount, transaction_date, transaction_type, payment_status, status')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', startDate + 'T00:00:00')
        .lte('transaction_date', endDate + 'T23:59:59');

      if (strictError) {
        console.error('Strict sales chart filter error:', strictError);
        error = strictError;
      } else if (strictData && strictData.length > 0) {
        transactions = strictData;
        console.log('SalesChart - Using strict filters, found:', strictData.length, 'transactions');
      } else {
        console.log('SalesChart - No data with strict filters, trying fallback...');
        
        // Fallback: try without status filter
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pos_transactions')
          .select('total_amount, transaction_date, transaction_type, payment_status, status')
          .eq('transaction_type', 'sale')
          .eq('payment_status', 'completed')
          .gte('transaction_date', startDate + 'T00:00:00')
          .lte('transaction_date', endDate + 'T23:59:59');

        if (fallbackError) {
          console.error('Fallback sales chart filter error:', fallbackError);
          error = fallbackError;
        } else if (fallbackData && fallbackData.length > 0) {
          transactions = fallbackData;
          console.log('SalesChart - Using fallback filters, found:', fallbackData.length, 'transactions');
        } else {
          console.log('SalesChart - No data with fallback filters, trying final fallback...');
          
          // Final fallback: try with just transaction_type
          const { data: finalData, error: finalError } = await supabase
            .from('pos_transactions')
            .select('total_amount, transaction_date, transaction_type, payment_status, status')
            .eq('transaction_type', 'sale')
            .gte('transaction_date', startDate + 'T00:00:00')
            .lte('transaction_date', endDate + 'T23:59:59');

          if (finalError) {
            console.error('Final sales chart filter error:', finalError);
            error = finalError;
          } else {
            transactions = finalData;
            console.log('SalesChart - Using final fallback, found:', finalData?.length || 0, 'transactions');
          }
        }
      }

      if (error) throw error;

      const salesByMonth = new Map<string, { sales: number; orders: number }>();
      
      // Initialize all months with 0 values
      monthsArray.forEach(month => {
        const key = monthKey(month);
        salesByMonth.set(key, { sales: 0, orders: 0 });
      });

      // Populate with actual data
      transactions?.forEach(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        const key = monthKey(transactionDate);
        
        if (salesByMonth.has(key)) {
          const current = salesByMonth.get(key)!;
          salesByMonth.set(key, {
            sales: current.sales + (transaction.total_amount || 0),
            orders: current.orders + 1
          });
        }
      });

      const salesValues = monthsArray.map(month => salesByMonth.get(monthKey(month))?.sales || 0);
      const ordersValues = monthsArray.map(month => salesByMonth.get(monthKey(month))?.orders || 0);

      setSalesData(salesValues);
      setOrdersData(ordersValues);
    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const data = activeSeries === 'sales' ? salesData : ordersData;
  const maxValue = Math.max(...data, 1); // Ensure minimum of 1 to avoid division by zero
  const totalValue = data.reduce((sum, value) => sum + value, 0);
  const averageValue = totalValue / data.length;
  const currentMonthIndex = months.length - 1;
  const currentMonthValue = data[currentMonthIndex];
  const previousMonthValue = data[currentMonthIndex - 1] || 0;
  const growthPercentage = previousMonthValue > 0 ? ((currentMonthValue - previousMonthValue) / previousMonthValue) * 100 : 0;

  // Generate Y-axis scale
  const yAxisValues = Array.from({ length: Y_AXIS_TICKS }, (_, i) => {
    const value = (maxValue / (Y_AXIS_TICKS - 1)) * i;
    return Math.round(value);
  });

  // Get bar color based on value and position
  const getBarColor = (value: number, index: number) => {
    if (value === 0) return 'bg-gray-100';
    if (index === currentMonthIndex) return 'bg-gradient-to-t from-blue-600 to-blue-500';
    return 'bg-gradient-to-t from-green-600 to-green-500';
  };

  // Get bar height with minimum height for visibility
  const getBarHeight = (value: number) => {
    if (value === 0) return 4; // Minimum height for zero values
    return Math.max((value / maxValue) * (CHART_HEIGHT - 60), 8); // Minimum 8px for non-zero values
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Chart</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-gray-900">
                {activeSeries === 'sales' 
                  ? currencyFormatter.format(totalValue)
                  : totalValue.toLocaleString()
                }
              </div>
              <div className="flex items-center space-x-1">
                {growthPercentage >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Target className="w-4 h-4" />
              <span>Avg: {activeSeries === 'sales' 
                ? currencyFormatter.format(averageValue)
                : Math.round(averageValue).toLocaleString()
              }</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSeries('sales')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              activeSeries === 'sales'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveSeries('orders')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              activeSeries === 'orders'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Y-axis */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
          {yAxisValues.map((value, index) => (
            <div key={index} className="text-xs text-gray-500 text-right pr-2">
              {activeSeries === 'sales' 
                ? currencyFormatter.format(value)
                : value.toLocaleString()
              }
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="ml-12 relative" style={{ height: CHART_HEIGHT }}>
          {/* Average line */}
          {averageValue > 0 && (
            <div 
              className="absolute left-0 right-0 border-t-2 border-dashed border-orange-300 opacity-60"
              style={{ bottom: `${(averageValue / maxValue) * (CHART_HEIGHT - 60)}px` }}
            >
              <div className="absolute -left-8 -top-2 text-xs text-orange-600 font-medium">
                Avg
              </div>
            </div>
          )}

          {/* Bars */}
          <div className="flex items-end justify-between h-full px-2">
            {data.map((value, index) => {
              const isCurrentMonth = index === currentMonthIndex;
              const isHovered = hoveredIndex === index;
              const barHeight = getBarHeight(value);
              const barColor = getBarColor(value, index);
              
              return (
                <div 
                  key={index} 
                  className="flex-1 flex flex-col items-center mx-1 group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Value on top of bar */}
                  {value > 0 && (
                    <div className={`absolute -top-8 text-xs font-semibold transition-all duration-200 ${
                      isHovered ? 'text-gray-900 scale-110' : 'text-gray-600'
                    }`}>
                      {activeSeries === 'sales' 
                        ? currencyFormatter.format(value)
                        : value.toLocaleString()
                      }
                    </div>
                  )}

                  {/* Bar */}
                  <div 
                    className={`w-full rounded-t transition-all duration-200 ${
                      isHovered ? 'shadow-lg scale-105' : 'shadow-sm'
                    } ${barColor}`}
                    style={{ height: `${barHeight}px` }}
                  >
                    {/* Growth indicator for current month */}
                    {isCurrentMonth && value > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <div className={`flex items-center space-x-1 text-xs font-medium ${
                          growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {growthPercentage >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mt-4 flex justify-between px-2">
          {labels.map((label, index) => {
            const isCurrentMonth = index === currentMonthIndex;
            const value = data[index];
            
            return (
              <div 
                key={index} 
                className="flex-1 text-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className={`text-xs font-medium transition-colors ${
                  isCurrentMonth ? 'text-blue-600' : 'text-gray-600'
                } ${hoveredIndex === index ? 'text-gray-900' : ''}`}>
                  {label}
                </div>
                <div className={`text-xs mt-1 transition-colors ${
                  value === 0 ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {activeSeries === 'sales' 
                    ? currencyFormatter.format(value)
                    : value.toString()
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none"
             style={{
               left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
               transform: 'translateX(-50%)',
               bottom: '100%',
               marginBottom: '8px'
             }}>
          <div className="font-semibold">{labels[hoveredIndex]}</div>
          <div className="text-gray-300">
            {activeSeries === 'sales' ? 'Sales' : 'Orders'}: {activeSeries === 'sales' 
              ? currencyFormatter.format(data[hoveredIndex])
              : data[hoveredIndex].toLocaleString()
            }
          </div>
          {hoveredIndex > 0 && (
            <div className="text-gray-300">
              vs Prev: {activeSeries === 'sales' 
                ? currencyFormatter.format(data[hoveredIndex - 1])
                : data[hoveredIndex - 1].toLocaleString()
              }
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Sales Data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Current Month</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-300 border border-orange-400 rounded"></div>
            <span>Average</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Info className="w-4 h-4" />
          <span>Hover for details</span>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;