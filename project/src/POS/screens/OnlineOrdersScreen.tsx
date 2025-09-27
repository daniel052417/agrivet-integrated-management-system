import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin, 
  Calendar,
  Filter,
  Search,
  Bell,
  Eye,
  Check,
  X,
  Package,
  Truck,
  Store,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { OnlineOrder, OnlineOrderFilters } from '../../types/pos';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';
import { OnlineOrdersService } from '../services/onlineOrdersService';

interface OnlineOrdersScreenProps {
  onOrdersCountUpdate?: (count: number) => void;
}

const OnlineOrdersScreen: React.FC<OnlineOrdersScreenProps> = (props) => {
  const { onOrdersCountUpdate } = props;
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OnlineOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [filters, setFilters] = useState<OnlineOrderFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);


  useEffect(() => {
    loadOrders();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadOrders();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filters, searchTerm]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const ordersData = await OnlineOrdersService.getOrders(filters);
      setOrders(ordersData);
      const newCount = await OnlineOrdersService.getNewOrdersCount();
      setNewOrdersCount(newCount);
      
      // Notify parent component of count change
      if (onOrdersCountUpdate) {
        onOrdersCountUpdate(newCount);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term) ||
        order.customer_phone.includes(term)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Order type filter
    if (filters.order_type) {
      filtered = filtered.filter(order => order.order_type === filters.order_type);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OnlineOrder['status']) => {
    try {
      const updatedOrder = await OnlineOrdersService.updateOrderStatus(orderId, newStatus);
      if (updatedOrder) {
        setOrders(orders.map(order => 
          order.id === orderId ? updatedOrder : order
        ));
        // Update new orders count
        const newCount = await OnlineOrdersService.getNewOrdersCount();
        setNewOrdersCount(newCount);
        
        // Notify parent component of count change
        if (onOrdersCountUpdate) {
          onOrdersCountUpdate(newCount);
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup': return Store;
      case 'delivery': return Truck;
      case 'reservation': return Calendar;
      default: return Package;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'ready': return Package;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextStatus = (currentStatus: string): OnlineOrder['status'] | null => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getStatusActions = (status: string) => {
    const nextStatus = getNextStatus(status);
    if (!nextStatus) return [];

    const actions = [];
    if (status === 'pending') {
      actions.push({ label: 'Confirm', status: 'confirmed', color: 'bg-blue-600 hover:bg-blue-700' });
      actions.push({ label: 'Cancel', status: 'cancelled', color: 'bg-red-600 hover:bg-red-700' });
    } else if (status === 'confirmed') {
      actions.push({ label: 'Mark Ready', status: 'ready', color: 'bg-green-600 hover:bg-green-700' });
    } else if (status === 'ready') {
      actions.push({ label: 'Complete', status: 'completed', color: 'bg-gray-600 hover:bg-gray-700' });
    }
    return actions;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
              {newOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {newOrdersCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Online Orders</h1>
              <p className="text-sm text-gray-600">Manage incoming orders and reservations</p>
            </div>
          </div>
          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filters.order_type || ''}
              onChange={(e) => setFilters({...filters, order_type: e.target.value || undefined})}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
              <option value="reservation">Reservation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const OrderTypeIcon = getOrderTypeIcon(order.order_type);
              const StatusIcon = getStatusIcon(order.status);
              const statusActions = getStatusActions(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <OrderTypeIcon className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.order_number}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                          <StatusIcon className="w-4 h-4 inline mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center">
                              <span className="font-medium">{order.customer_name}</span>
                            </p>
                            <p className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {order.customer_phone}
                            </p>
                            <p className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {order.customer_address}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Type: <span className="capitalize">{order.order_type}</span></p>
                            <p>Payment: <span className="capitalize">{order.payment_method}</span></p>
                            <p>Total: <span className="font-semibold text-emerald-600">{formatPrice(order.total_amount)}</span></p>
                            <p>Ordered: {formatDateTime(order.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
                        <div className="space-y-1">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product_name} x {item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.line_total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.special_instructions && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            <strong>Special Instructions:</strong> {order.special_instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      
                      {statusActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => updateOrderStatus(order.id, action.status as OnlineOrder['status'])}
                          className={`px-4 py-2 text-white rounded-lg font-medium ${action.color}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <Modal
          isOpen={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
          title={`Order Details - ${selectedOrder.order_number}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedOrder.customer_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{selectedOrder.customer_address}</p>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Type</p>
                  <p className="font-medium capitalize">{selectedOrder.order_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ordered At</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Ready Time</p>
                  <p className="font-medium">
                    {selectedOrder.estimated_ready_time 
                      ? formatDateTime(selectedOrder.estimated_ready_time)
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        {item.special_instructions && (
                          <p className="text-sm text-yellow-600 mt-1">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">
                          {formatPrice(item.line_total)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.unit_price)} each
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (12%)</span>
                  <span className="font-medium">{formatPrice(selectedOrder.tax_amount)}</span>
                </div>
                {selectedOrder.delivery_fee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">{formatPrice(selectedOrder.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {selectedOrder.special_instructions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Special Instructions</h3>
                <p className="text-yellow-700">{selectedOrder.special_instructions}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {getStatusActions(selectedOrder.status).map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, action.status as OnlineOrder['status']);
                    setShowOrderDetails(false);
                  }}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${action.color}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OnlineOrdersScreen;
