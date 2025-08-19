import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';

type SeriesType = 'sales' | 'orders';
type TxRow = { total_amount: number; transaction_date: string };

const NUM_POINTS = 7;

function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
function monthLabel(date: Date) { return date.toLocaleString('en-US', { month: 'short' }); }

const SalesChart: React.FC = () => {
  const [activeSeries, setActiveSeries] = useState<SeriesType>('sales');
  const [labels, setLabels] = useState<string[]>([]);
  const [salesData, setSalesData] = useState<number[]>(Array(NUM_POINTS).fill(0));
  const [ordersData, setOrdersData] = useState<number[]>(Array(NUM_POINTS).fill(0));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }), []);

  useEffect(() => {
    const now = new Date();
    const months: Date[] = [];
    for (let i = NUM_POINTS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d);
    }
    setLabels(months.map(monthLabel));

    const startDate = new Date(months[0]);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('sales_transactions')
          .select('total_amount, transaction_date')
          .gte('transaction_date', startDate.toISOString())
          .lt('transaction_date', endDate.toISOString());
        if (err) throw err;

        const idxByKey = new Map<string, number>();
        months.forEach((d, i) => idxByKey.set(monthKey(d), i));

        const sales = Array(NUM_POINTS).fill(0) as number[];
        const orders = Array(NUM_POINTS).fill(0) as number[];
        (data as TxRow[] | null)?.forEach(row => {
          const d = new Date(row.transaction_date);
          const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
          const idx = idxByKey.get(key);
          if (idx === undefined) return;
          sales[idx] += Number(row.total_amount || 0);
          orders[idx] += 1;
        });

        setSalesData(sales);
        setOrdersData(orders);
      } catch (e: any) {
        console.error('Failed to load sales chart', e);
        setError('Failed to load chart');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const series = activeSeries === 'sales' ? salesData : ordersData;
  const maxVal = Math.max(...series, 1);
  const minVal = Math.min(...series, 0);
  const range = Math.max(1, maxVal - minVal);

  const currentVal = series[series.length - 1] || 0;
  const prevVal = series.length > 1 ? series[series.length - 2] : 0;
  const growthPct = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
  const isUp = growthPct >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Sales Overview</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSeries('sales')}
            className={`px-3 py-1 text-sm font-medium rounded-lg ${activeSeries === 'sales' ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Sales (₱)
          </button>
          <button
            onClick={() => setActiveSeries('orders')}
            className={`px-3 py-1 text-sm font-medium rounded-lg ${activeSeries === 'orders' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          {activeSeries === 'sales' ? (
            <p className="text-2xl font-bold text-gray-900">{currencyFormatter.format(currentVal)}</p>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{currentVal.toLocaleString()}</p>
          )}
          <p className="text-sm text-gray-600">This Month</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>{`${isUp ? '+' : ''}${growthPct.toFixed(1)}%`}</p>
          <p className="text-sm text-gray-600">Growth</p>
        </div>
        <div className="text-center">
          {activeSeries === 'sales' ? (
            <p className="text-2xl font-bold text-blue-600">{ordersData[ordersData.length - 1]?.toLocaleString?.() ?? 0}</p>
          ) : (
            <p className="text-2xl font-bold text-blue-600">{currencyFormatter.format(salesData[salesData.length - 1] || 0)}</p>
          )}
          <p className="text-sm text-gray-600">{activeSeries === 'sales' ? 'Orders' : 'Sales'}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-red-600 text-sm">{error}</div>
      ) : (
        <div className="relative">
          <svg className="w-full h-64" viewBox="0 0 700 200">
            <defs>
              <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ordersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="50"
                y1={40 + i * 30}
                x2="650"
                y2={40 + i * 30}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* Area */}
            <path
              d={`M 50,${170 - ((series[0] - minVal) / range) * 120} ${series
                .map((value, index) => {
                  const x = 50 + (index * 100);
                  const y = 170 - ((value - minVal) / range) * 120;
                  return `L ${x},${y}`;
                })
                .join(' ')} L 650,170 L 50,170 Z`}
              fill={`url(#${activeSeries === 'sales' ? 'salesGradient' : 'ordersGradient'})`}
            />

            {/* Line */}
            <polyline
              fill="none"
              stroke={activeSeries === 'sales' ? '#10B981' : '#3B82F6'}
              strokeWidth="3"
              points={series
                .map((value, index) => {
                  const x = 50 + (index * 100);
                  const y = 170 - ((value - minVal) / range) * 120;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Points */}
            {series.map((value, index) => {
              const x = 50 + (index * 100);
              const y = 170 - ((value - minVal) / range) * 120;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="5"
                  fill={activeSeries === 'sales' ? '#10B981' : '#3B82F6'}
                  stroke="white"
                  strokeWidth="3"
                />
              );
            })}

            {/* X-axis labels */}
            {labels.map((month, index) => (
              <text
                key={`${month}-${index}`}
                x={50 + (index * 100)}
                y="190"
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {month}
              </text>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

export default SalesChart;