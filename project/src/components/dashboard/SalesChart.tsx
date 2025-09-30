import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

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

    loadSalesData(months);
  }, []);

  const loadSalesData = async (months: Date[]) => {
    try {
      setLoading(true);
      setError(null);

      const startDate = months[0];
      const endDate = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1);

      const { data: transactions, error: txError } = await supabase
        .from('sales_transactions')
        .select('total_amount, transaction_date')
        .gte('transaction_date', startDate.toISOString())
        .lt('transaction_date', endDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (txError) throw txError;

      const salesByMonth = new Map<string, { sales: number; orders: number }>();
      months.forEach(month => {
        const key = monthKey(month);
        salesByMonth.set(key, { sales: 0, orders: 0 });
      });

      transactions?.forEach(tx => {
        const txDate = new Date(tx.transaction_date);
        const key = monthKey(txDate);
        const current = salesByMonth.get(key) || { sales: 0, orders: 0 };
        current.sales += tx.total_amount || 0;
        current.orders += 1;
        salesByMonth.set(key, current);
      });

      const salesValues = months.map(month => salesByMonth.get(monthKey(month))?.sales || 0);
      const ordersValues = months.map(month => salesByMonth.get(monthKey(month))?.orders || 0);

      setSalesData(salesValues);
      setOrdersData(ordersValues);
    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...(activeSeries === 'sales' ? salesData : ordersData));
  const data = activeSeries === 'sales' ? salesData : ordersData;

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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
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

        <div className="h-64 flex items-end space-x-2">
          {data.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 rounded-t" style={{ height: `${(value / maxValue) * 200}px` }}>
                <div className="w-full bg-blue-500 rounded-t"></div>
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center">
                <div className="font-medium">{labels[index]}</div>
                <div>
                  {activeSeries === 'sales' 
                    ? currencyFormatter.format(value)
                    : value.toString()
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            {activeSeries === 'sales' ? 'Total Sales' : 'Total Orders'} over the last {NUM_POINTS} months
          </p>
        </div>
      </div>
  );
};

export default SalesChart;










