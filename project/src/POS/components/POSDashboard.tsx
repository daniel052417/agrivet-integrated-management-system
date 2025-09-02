import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { POSSession } from '../../types/pos';

interface POSDashboardProps {
  session: POSSession;
  onClose: () => void;
}

interface DashboardStats {
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  topProducts: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    payment_method: string;
    count: number;
    total_amount: number;
  }>;
  lowStockProducts: Array<{
    product_name: string;
    stock_quantity: number;
    minimum_stock: number;
  }>;
}

const POSDashboard: React.FC<POSDashboardProps> = ({ session, onClose }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState('');

  useEffect(() => {
    loadDashboardStats();
    updateTimeElapsed();
    const interval = setInterval(updateTimeElapsed, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Get session transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('pos_transactions')
        .select(`
          *,
          pos_transaction_items(*),
          pos_payments(*)
        `)
        .eq('pos_session_id', session.id)
        .eq('status', 'active');

      if (transactionsError) throw transactionsError;

      // Calculate stats
      const totalSales = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Get top products
      const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
      transactions?.forEach(transaction => {
        transaction.pos_transaction_items?.forEach(item => {
          if (productSales[item.product_name]) {
            productSales[item.product_name].quantity += item.quantity;
            productSales[item.product_name].revenue += item.line_total;
          } else {
            productSales[item.product_name] = {
              name: item.product_name,
              quantity: item.quantity,
              revenue: item.line_total
            };
          }
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Get payment methods
      const paymentMethods: { [key: string]: { count: number; total: number } } = {};
      transactions?.forEach(transaction => {
        transaction.pos_payments?.forEach(payment => {
          const method = payment.payment_method === 'digital' && payment.payment_type 
            ? payment.payment_type 
            : payment.payment_method;
          
          if (paymentMethods[method]) {
            paymentMethods[method].count += 1;
            paymentMethods[method].total += payment.amount;
          } else {
            paymentMethods[method] = {
              count: 1,
              total: payment.amount
            };
          }
        });
      });

      const paymentMethodsArray = Object.entries(paymentMethods).map(([method, data]) => ({
        payment_method: method,
        count: data.count,
        total_amount: data.total
      }));

      // Get low stock products
      const { data: lowStockProducts, error: lowStockError } = await supabase
        .from('products')
        .select('name, stock_quantity, minimum_stock')
        .lte('stock_quantity', 'minimum_stock')
        .eq('is_active', true)
        .limit(5);

      if (lowStockError) throw lowStockError;

      setStats({
        totalSales,
        totalTransactions,
        averageTransaction,
        topProducts,
        paymentMethods: paymentMethodsArray,
        lowStockProducts: lowStockProducts || []
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeElapsed = () => {
    const start = new Date(session.opened_at);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    setTimeElapsed(`${diffHours}h ${diffMinutes}m`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">POS Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Session: {session.session_number}</h3>
              <p className="text-sm text-gray-600">Started: {new Date(session.opened_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{timeElapsed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatPrice(stats?.totalSales || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Transactions</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats?.totalTransactions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Avg. Transaction</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatPrice(stats?.averageTransaction || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
            {stats?.topProducts.length ? (
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.product_name}</p>
                      <p className="text-sm text-gray-600">{product.quantity_sold} sold</p>
                    </div>
                    <p className="font-semibold text-green-600">
                      {formatPrice(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sales yet</p>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
            {stats?.paymentMethods.length ? (
              <div className="space-y-3">
                {stats.paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{method.payment_method}</p>
                      <p className="text-sm text-gray-600">{method.count} transactions</p>
                    </div>
                    <p className="font-semibold text-blue-600">
                      {formatPrice(method.total_amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No payments yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats?.lowStockProducts.length ? (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Low Stock Alert</h3>
            </div>
            <div className="space-y-2">
              {stats.lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-800">{product.product_name}</span>
                  <span className="text-yellow-600">
                    {product.stock_quantity} / {product.minimum_stock} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default POSDashboard;

