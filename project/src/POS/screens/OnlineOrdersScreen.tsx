import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin, 
  Calendar,
  Search,
  Eye,
  Package,
  Truck,
  Store,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { OnlineOrder, OnlineOrderFilters } from '../../types/pos';
import Modal from '../components/shared/Modal';
import { OnlineOrdersService } from '../services/onlineOrdersService';
import { customAuth } from '../../lib/customAuth';
import { OrderCancellationDialog } from '../components/OrderCancellationDialog';

// Order status constants (matching the actual database values)
// const ORDER_STATUSES = {
//   PENDING: 'pending_confirmation',
//   CONFIRMED: 'confirmed',
//   READY: 'ready_for_pickup',
//   COMPLETED: 'completed',
//   CANCELLED: 'cancelled'
// } as const;

interface OnlineOrdersScreenProps {
  onOrdersCountUpdate?: (count: number) => void;
  branchId?: string; // Current user's branch ID for filtering
}

const OnlineOrdersScreen: React.FC<OnlineOrdersScreenProps> = (props) => {
  const { onOrdersCountUpdate, branchId: propBranchId } = props;
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [filters, setFilters] = useState<OnlineOrderFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  
  // Enhanced order processing state
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OnlineOrder | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [showInventoryAlert, setShowInventoryAlert] = useState(false);
  const [inventoryAlertMessage, setInventoryAlertMessage] = useState('');
  
  // Payment processing state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderForPayment, setOrderForPayment] = useState<OnlineOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Tab-based organization state
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'ready' | 'for_payment' | 'completed'>('pending');

  const getCurrentBranchId = () => {
    // Use prop branchId if provided, otherwise get from current user
    if (propBranchId) {
      return propBranchId;
    }
    
    const currentUser = customAuth.getCurrentUser();
    
    if (currentUser?.branch_id) {
      console.log('Using user branch ID:', currentUser.branch_id, 'for user:', currentUser.email);
      return currentUser.branch_id;
    }
    
    console.warn('No branch assigned to user, using fallback. User:', currentUser?.email || 'No user');
    return 'default-branch';
  };

  // Helper functions for tab management
  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const getTabCount = (status: string) => {
    return getOrdersByStatus(status).length;
  };


  const getTimeUntilReady = (estimatedReadyTime: string) => {
    const now = new Date();
    const readyTime = new Date(estimatedReadyTime);
    const diffMs = readyTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Ready now';
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getProgressPercentage = (confirmedAt: string, estimatedReadyTime: string) => {
    const now = new Date();
    const startTime = new Date(confirmedAt);
    const endTime = new Date(estimatedReadyTime);
    
    const totalMs = endTime.getTime() - startTime.getTime();
    const elapsedMs = now.getTime() - startTime.getTime();
    
    if (totalMs <= 0) return 100;
    if (elapsedMs <= 0) return 0;
    
    return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  };


  useEffect(() => {
    loadOrders();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadOrders();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // No need for filtering since we're using tabs now
  }, [orders, filters, searchTerm]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // CRITICAL: Get current branch ID and pass to ensure branch isolation
      const currentBranchId = getCurrentBranchId();
      console.log(`🔄 OnlineOrdersScreen: Loading orders for branch: ${currentBranchId}`);
      console.log(`🔄 OnlineOrdersScreen: Current filters:`, filters);
      
      const ordersData = await OnlineOrdersService.getOrders(filters, currentBranchId);
      console.log(`📦 OnlineOrdersScreen: Received orders data:`, {
        ordersCount: ordersData.length,
        sampleOrder: ordersData[0] ? {
          id: ordersData[0].id,
          order_number: ordersData[0].order_number,
          status: ordersData[0].status
        } : 'No orders',
        allStatuses: ordersData.map(order => ({ id: order.id, status: order.status }))
      });
      
      setOrders(ordersData);
      
      const newCount = await OnlineOrdersService.getNewOrdersCount(currentBranchId);
      setNewOrdersCount(newCount);
      
      console.log(`✅ OnlineOrdersScreen: Final result - ${ordersData.length} orders for branch ${currentBranchId}, ${newCount} new orders`);
      
      // Notify parent component of count change
      if (onOrdersCountUpdate) {
        onOrdersCountUpdate(newCount);
      }
    } catch (error) {
      console.error('❌ OnlineOrdersScreen: Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering is now handled by tabs, no need for this function

  const updateOrderStatus = async (orderId: string, newStatus: OnlineOrder['status']) => {
    try {
      // CRITICAL: Get current branch ID and pass to ensure we can only update orders from this branch
      const currentBranchId = getCurrentBranchId();
      const updatedOrder = await OnlineOrdersService.updateOrderStatus(orderId, newStatus, currentBranchId);
      if (updatedOrder) {
        setOrders(orders.map(order => 
          order.id === orderId ? updatedOrder : order
        ));
        // Update new orders count
        const newCount = await OnlineOrdersService.getNewOrdersCount(currentBranchId);
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

  // Enhanced order processing methods
  const handleConfirmOrder = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      const currentBranchId = getCurrentBranchId();
      
      const result = await OnlineOrdersService.confirmOrder(orderId, currentBranchId);
      
      if (result.success) {
        // Refresh orders list and switch to confirmed tab
        await loadOrders();
        setActiveTab('confirmed');
        alert('✅ ' + result.message);
      } else {
        if (result.missingItems && result.missingItems.length > 0) {
          setInventoryAlertMessage(result.missingItems.join('\n'));
          setShowInventoryAlert(true);
        } else {
          alert('❌ ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('❌ Failed to confirm order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancelOrder = (order: OnlineOrder) => {
    setOrderToCancel(order);
    setShowCancellationDialog(true);
  };

  const handleConfirmCancellation = async (reason: string) => {
    if (!orderToCancel) return;
    
    try {
      setProcessingOrderId(orderToCancel.id);
      const currentBranchId = getCurrentBranchId();
      
      const result = await OnlineOrdersService.cancelOrder(orderToCancel.id, reason, currentBranchId);
      
      if (result.success) {
        // Refresh orders list
        await loadOrders();
        alert('✅ ' + result.message);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('❌ Failed to cancel order');
    } finally {
      setProcessingOrderId(null);
      setShowCancellationDialog(false);
      setOrderToCancel(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      
      const result = await OnlineOrdersService.markOrderReady(orderId);
      
      if (result.success) {
        // Refresh orders list and switch to ready tab
        await loadOrders();
        setActiveTab('ready');
        alert('✅ ' + result.message);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error('Error marking order ready:', error);
      alert('❌ Failed to mark order as ready');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleProceedToPayment = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      
      // Find the order to process payment
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        alert('❌ Order not found');
        return;
      }
      
      // Move order to "for_payment" status
      const result = await OnlineOrdersService.updateOrderStatus(orderId, 'for_payment');
      
      if (result) {
        // Set up payment modal with order data
        setOrderForPayment(order);
        setPaymentMethod(order.payment_method || 'cash');
        setCashAmount(order.total_amount);
        setShowPaymentModal(true);
        
        // Refresh orders list and switch to for_payment tab
        await loadOrders();
        setActiveTab('for_payment');
      } else {
        alert('❌ Failed to move order to payment');
      }
    } catch (error) {
      console.error('Error moving order to payment:', error);
      alert('❌ Failed to move order to payment');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleProcessPayment = async () => {
    if (!orderForPayment) return;
    
    try {
      setIsProcessingPayment(true);
      
      // Validate payment
      if (paymentMethod === 'cash' && cashAmount < orderForPayment.total_amount) {
        alert('❌ Cash amount is less than total amount');
        return;
      }
      
      // Complete the order
      const result = await OnlineOrdersService.completeOrder(orderForPayment.id);
      
      if (result.success) {
        // Close payment modal
        setShowPaymentModal(false);
        setOrderForPayment(null);
        
        // Refresh orders list and switch to completed tab
        await loadOrders();
        setActiveTab('completed');
        alert('✅ Payment processed successfully! Order completed.');
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('❌ Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      
      const result = await OnlineOrdersService.completeOrder(orderId);
      
      if (result.success) {
        // Refresh orders list and switch to completed tab
        await loadOrders();
        setActiveTab('completed');
        alert('✅ ' + result.message);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('❌ Failed to complete order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'for_payment': return 'bg-purple-100 text-purple-800 border-purple-200';
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
      case 'for_payment': return ShoppingBag;
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

  const getStatusActions = (status: string, _order?: OnlineOrder) => {
    const actions = [];
    
    if (status === 'pending_confirmation') {
      actions.push({ 
        label: 'Confirm', 
        status: 'confirmed', 
        color: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm',
        action: 'confirm',
        icon: Check
      });
      actions.push({ 
        label: 'Cancel', 
        status: 'cancelled', 
        color: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
        action: 'cancel',
        icon: X
      });
    } else if (status === 'confirmed') {
      actions.push({ 
        label: 'Mark Ready', 
        status: 'ready_for_pickup', 
        color: 'bg-green-500 hover:bg-green-600 text-white shadow-sm',
        action: 'ready',
        icon: Package
      });
      actions.push({ 
        label: 'Cancel', 
        status: 'cancelled', 
        color: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
        action: 'cancel',
        icon: X
      });
    } else if (status === 'ready_for_pickup') {
      actions.push({ 
        label: 'Process Payment', 
        status: 'for_payment', 
        color: 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm',
        action: 'proceed_to_payment',
        icon: ShoppingBag
      });
      actions.push({ 
        label: 'Cancel', 
        status: 'cancelled', 
        color: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
        action: 'cancel',
        icon: X
      });
    } else if (status === 'for_payment') {
      actions.push({ 
        label: 'Complete', 
        status: 'completed', 
        color: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
        action: 'complete',
        icon: CheckCircle
      });
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
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-colors duration-200 disabled:opacity-50"
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
              <option value="pending_confirmation">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="ready_for_pickup">Ready</option>
              <option value="for_payment">For Payment</option>
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { key: 'pending', label: 'Pending', status: 'pending_confirmation', icon: Clock, color: 'text-yellow-600' },
              { key: 'confirmed', label: 'Confirmed', status: 'confirmed', icon: CheckCircle, color: 'text-blue-600' },
              { key: 'ready', label: 'Ready', status: 'ready_for_pickup', icon: CheckCircle, color: 'text-green-600' },
              { key: 'for_payment', label: 'For Payment', status: 'for_payment', icon: ShoppingBag, color: 'text-purple-600' },
              { key: 'completed', label: 'Completed', status: 'completed', icon: CheckCircle, color: 'text-emerald-600' }
            ].map((tab) => {
              const IconComponent = tab.icon;
              const count = getTabCount(tab.status);
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-emerald-600' : tab.color}`} />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                      isActive 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (() => {
          const currentOrders = getOrdersByStatus(
            activeTab === 'pending' ? 'pending_confirmation' :
            activeTab === 'confirmed' ? 'confirmed' :
            activeTab === 'ready' ? 'ready_for_pickup' :
            activeTab === 'for_payment' ? 'for_payment' :
            'completed'
          );
          
          console.log(`🔍 Tab filtering debug:`, {
            activeTab,
            totalOrders: orders.length,
            allOrderStatuses: orders.map(o => ({ id: o.id, status: o.status })),
            filteredOrders: currentOrders.length,
            filteredOrderIds: currentOrders.map(o => o.id)
          });
          
          return currentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No {activeTab} orders</p>
              <p className="text-gray-400">
                {activeTab === 'pending' 
                  ? 'New orders will appear here when customers place them'
                  : `No orders in ${activeTab} status at the moment`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentOrders.map(order => {
              const OrderTypeIcon = getOrderTypeIcon(order.order_type);
              const StatusIcon = getStatusIcon(order.status);
              const statusActions = getStatusActions(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Enhanced Layout for For Payment Orders */}
                  {order.status === 'for_payment' ? (
                    <div className="space-y-4">
                      {/* Header with Status and Payment Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.order_number}
                          </h3>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            For Payment
                          </span>
                          <span className="text-sm text-gray-600">
                            💳 Customer at counter
                          </span>
                        </div>
                      </div>

                      {/* Customer and Order Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">{order.customer_name}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
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

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Payment Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Type: <span className="capitalize">{order.order_type}</span></p>
                            <p>Payment: <span className="capitalize">{order.payment_method}</span></p>
                            <p>Total: <span className="font-semibold text-emerald-600">{formatPrice(order.total_amount)}</span></p>
                            {order.ready_at && (
                              <p>Ready: {formatDateTime(order.ready_at)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items Section */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length}):</h4>
                        <div className="space-y-1">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>• {item.product_name} x {item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.line_total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Instructions */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <ShoppingBag className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-purple-900 mb-1">Payment Processing</h4>
                            <p className="text-sm text-purple-700">
                              Customer is at the counter. Process payment through POS system and complete the transaction.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 pt-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        
                        {statusActions.map((action, index) => {
                          const IconComponent = action.icon;
                          const isProcessing = processingOrderId === order.id;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (action.action === 'proceed_to_payment') {
                                  handleProceedToPayment(order.id);
                                } else if (action.action === 'complete') {
                                  handleCompleteOrder(order.id);
                                } else if (action.action === 'cancel') {
                                  handleCancelOrder(order);
                                } else {
                                  // Fallback to old method
                                  updateOrderStatus(order.id, action.status as OnlineOrder['status']);
                                }
                              }}
                              disabled={isProcessing}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <IconComponent className="w-4 h-4" />
                              )}
                              <span>{isProcessing ? 'Processing...' : action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : order.status === 'confirmed' ? (
                    <div className="space-y-4">
                      {/* Header with Status and Time */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.order_number}
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            Confirmed
                          </span>
                          {order.estimated_ready_time && (
                            <span className="text-sm text-gray-600">
                              🕐 {getTimeUntilReady(order.estimated_ready_time)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer and Order Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">{order.customer_name}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
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

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Order Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Type: <span className="capitalize">{order.order_type}</span></p>
                            <p>Payment: <span className="capitalize">{order.payment_method}</span></p>
                            <p>Total: <span className="font-semibold text-emerald-600">{formatPrice(order.total_amount)}</span></p>
                            {order.confirmed_at && (
                              <p>Confirmed: {formatDateTime(order.confirmed_at)}</p>
                            )}
                            {order.estimated_ready_time && (
                              <p>Ready by: {formatDateTime(order.estimated_ready_time)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items Section */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length}):</h4>
                        <div className="space-y-1">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>• {item.product_name} x {item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.line_total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {order.confirmed_at && order.estimated_ready_time && (
                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Progress: Preparing items...</span>
                            <span>{Math.round(getProgressPercentage(order.confirmed_at, order.estimated_ready_time))}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage(order.confirmed_at, order.estimated_ready_time)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 pt-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        
                        {statusActions.map((action, index) => {
                          const IconComponent = action.icon;
                          const isProcessing = processingOrderId === order.id;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (action.action === 'confirm') {
                                  handleConfirmOrder(order.id);
                                } else if (action.action === 'cancel') {
                                  handleCancelOrder(order);
                                } else if (action.action === 'ready') {
                                  handleMarkReady(order.id);
                                } else if (action.action === 'proceed_to_payment') {
                                  handleProceedToPayment(order.id);
                                } else if (action.action === 'complete') {
                                  handleCompleteOrder(order.id);
                                } else {
                                  // Fallback to old method
                                  updateOrderStatus(order.id, action.status as OnlineOrder['status']);
                                }
                              }}
                              disabled={isProcessing}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <IconComponent className="w-4 h-4" />
                              )}
                              <span>{isProcessing ? 'Processing...' : action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Standard Layout for Other Statuses */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <OrderTypeIcon className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.order_number}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                              <StatusIcon className="w-4 h-4 inline mr-1" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            {(order.status as any) === 'confirmed' && order.estimated_ready_time && (
                              <span className="text-sm text-gray-600">
                                🕐 {getTimeUntilReady(order.estimated_ready_time)}
                              </span>
                            )}
                          </div>
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
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        
                        {statusActions.map((action, index) => {
                          const IconComponent = action.icon;
                          const isProcessing = processingOrderId === order.id;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (action.action === 'confirm') {
                                  handleConfirmOrder(order.id);
                                } else if (action.action === 'cancel') {
                                  handleCancelOrder(order);
                                } else if (action.action === 'ready') {
                                  handleMarkReady(order.id);
                                } else if (action.action === 'proceed_to_payment') {
                                  handleProceedToPayment(order.id);
                                } else if (action.action === 'complete') {
                                  handleCompleteOrder(order.id);
                                } else {
                                  // Fallback to old method
                                  updateOrderStatus(order.id, action.status as OnlineOrder['status']);
                                }
                              }}
                              disabled={isProcessing}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <IconComponent className="w-4 h-4" />
                              )}
                              <span>{isProcessing ? 'Processing...' : action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          );
        })()}
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
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
              {getStatusActions(selectedOrder.status).map((action, index) => {
                const IconComponent = action.icon;
                const isProcessing = processingOrderId === selectedOrder.id;
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (action.action === 'confirm') {
                        handleConfirmOrder(selectedOrder.id);
                      } else if (action.action === 'cancel') {
                        handleCancelOrder(selectedOrder);
                      } else if (action.action === 'ready') {
                        handleMarkReady(selectedOrder.id);
                      } else if (action.action === 'proceed_to_payment') {
                        handleProceedToPayment(selectedOrder.id);
                      } else if (action.action === 'complete') {
                        handleCompleteOrder(selectedOrder.id);
                      } else {
                        // Fallback to old method
                        updateOrderStatus(selectedOrder.id, action.status as OnlineOrder['status']);
                      }
                      setShowOrderDetails(false);
                    }}
                    disabled={isProcessing}
                    className={`flex items-center justify-center space-x-2 flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <IconComponent className="w-4 h-4" />
                    )}
                    <span>{isProcessing ? 'Processing...' : action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Order Cancellation Dialog */}
      {showCancellationDialog && orderToCancel && (
        <OrderCancellationDialog
          isOpen={showCancellationDialog}
          onClose={() => {
            setShowCancellationDialog(false);
            setOrderToCancel(null);
          }}
          onConfirm={handleConfirmCancellation}
          orderNumber={orderToCancel.order_number}
          customerName={orderToCancel.customer_name}
        />
      )}

      {/* Inventory Alert Modal */}
      {showInventoryAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Insufficient Inventory</h3>
                  <p className="text-sm text-gray-600">Cannot confirm order due to stock shortage</p>
                </div>
              </div>
              <button
                onClick={() => setShowInventoryAlert(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Missing Items:</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <pre className="text-sm text-red-800 whitespace-pre-wrap">{inventoryAlertMessage}</pre>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="mb-2">Please:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check inventory levels</li>
                  <li>Restock missing items</li>
                  <li>Or cancel the order with appropriate reason</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowInventoryAlert(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentModal && orderForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>
                  <p className="text-sm text-gray-600">Order #{orderForPayment.order_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{orderForPayment.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{orderForPayment.customer_phone}</p>
                  </div>
                </div>
              </div>

              {/* Order Items - Cart Display */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {orderForPayment.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{item.product_name}</h5>
                        <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(item.line_total)}</p>
                        <p className="text-sm text-gray-600">{formatPrice(item.unit_price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(orderForPayment.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (12%)</span>
                    <span className="font-medium">{formatPrice(orderForPayment.tax_amount)}</span>
                  </div>
                  {orderForPayment.delivery_fee && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">{formatPrice(orderForPayment.delivery_fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatPrice(orderForPayment.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Payment Method</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'cash'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💵</div>
                      <div className="font-medium">Cash</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('gcash')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'gcash'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📱</div>
                      <div className="font-medium">GCash</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Cash Amount Input (if cash selected) */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cash Amount Received
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter cash amount"
                    min={orderForPayment.total_amount}
                  />
                  {cashAmount >= orderForPayment.total_amount && (
                    <p className="text-sm text-green-600 mt-1">
                      Change: {formatPrice(cashAmount - orderForPayment.total_amount)}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={isProcessingPayment || (paymentMethod === 'cash' && cashAmount < orderForPayment.total_amount)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Complete Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineOrdersScreen;
