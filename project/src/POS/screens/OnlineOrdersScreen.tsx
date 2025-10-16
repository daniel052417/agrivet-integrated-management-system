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
  
  // Delivery booking state
  const [showBookDeliveryModal, setShowBookDeliveryModal] = useState(false);
  const [orderForDelivery, setOrderForDelivery] = useState<OnlineOrder | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [riderName, setRiderName] = useState<string>('');
  const [isProcessingDelivery, setIsProcessingDelivery] = useState(false);
  
  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [mapAddress, setMapAddress] = useState<string>('');
  

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



  // Helper function to get filtered orders based on current filters
  const getFilteredOrders = () => {
    let filteredOrders = orders;

    // Filter by status if specified
    if (filters.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }

    // Filter by order type if specified
    if (filters.order_type) {
      filteredOrders = filteredOrders.filter(order => order.order_type === filters.order_type);
    }

    // Filter by search term if specified
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_phone.toLowerCase().includes(searchLower)
      );
    }

    return filteredOrders;
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
        // Refresh orders list
        await loadOrders();
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
        // Refresh orders list
        await loadOrders();
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
        
        // Refresh orders list
        await loadOrders();
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
        
        // Refresh orders list
        await loadOrders();
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
        // Refresh orders list
        await loadOrders();
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

  const handleBookDelivery = (order: OnlineOrder) => {
    setOrderForDelivery(order);
    setDeliveryFee(order.delivery_fee || 0);
    setTrackingNumber(order.delivery_tracking_number || '');
    setRiderName('');
    setShowBookDeliveryModal(true);
  };

  const handleMarkAsDispatched = async () => {
    if (!orderForDelivery) return;
    
    try {
      setIsProcessingDelivery(true);
      
      // Update order status to 'for_dispatch' and add delivery details
      const result = await OnlineOrdersService.updateOrderStatus(
        orderForDelivery.id, 
        'for_dispatch',
        getCurrentBranchId()
      );
      
      if (result) {
        // Update delivery details in the order
        const { supabase } = await import('../../pwa/src/services/supabase');
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            delivery_fee: deliveryFee,
            delivery_tracking_number: trackingNumber || null,
            delivery_status: 'booked',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderForDelivery.id);
        
        if (updateError) {
          console.error('Error updating delivery details:', updateError);
          alert('❌ Failed to update delivery details');
          return;
        }
        
        // Close modal and refresh orders
        setShowBookDeliveryModal(false);
        setOrderForDelivery(null);
        await loadOrders();
        alert('✅ Delivery booked successfully! Order marked as For Dispatch.');
      } else {
        alert('❌ Failed to update order status');
      }
    } catch (error) {
      console.error('Error booking delivery:', error);
      alert('❌ Failed to book delivery');
    } finally {
      setIsProcessingDelivery(false);
    }
  };

  const handleShowMap = (lat: number, lng: number, address: string) => {
    setMapCoordinates({ lat, lng });
    setMapAddress(address);
    setShowMapModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'for_payment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'for_dispatch': return 'bg-orange-100 text-orange-800 border-orange-200';
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

  // Helper function to render order type badge
  const typeBadge = (orderType: string) => {
    if (orderType === 'pickup') {
      return (
        <span className="ml-2 px-2 py-1 text-xs rounded-full text-green-700 bg-green-100 font-medium">
          Pickup
        </span>
      );
    }
    if (orderType === 'delivery') {
      return (
        <span className="ml-2 px-2 py-1 text-xs rounded-full text-purple-700 bg-purple-100 font-medium">
          Delivery
        </span>
      );
    }
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'ready': return Package;
      case 'for_payment': return ShoppingBag;
      case 'for_dispatch': return Truck;
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

  const getStatusActions = (status: string, order?: OnlineOrder) => {
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
      // For delivery orders, show "Book Delivery" button
      if (order?.order_type === 'delivery') {
        actions.push({ 
          label: '🚚 Book Delivery', 
          status: 'for_dispatch', 
          color: 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm',
          action: 'book_delivery',
          icon: Truck
        });
      } else {
        // For pickup orders, show "Mark Ready" button
        actions.push({ 
          label: 'Mark Ready', 
          status: 'ready_for_pickup', 
          color: 'bg-green-500 hover:bg-green-600 text-white shadow-sm',
          action: 'ready',
          icon: Package
        });
      }
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
    } else if (status === 'for_dispatch') {
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


      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (() => {
          const filteredOrders = getFilteredOrders();
          
          console.log(`🔍 Filtering debug:`, {
            totalOrders: orders.length,
            filteredOrders: filteredOrders.length,
            filters,
            searchTerm,
            allOrderStatuses: orders.map(o => ({ id: o.id, status: o.status, order_type: o.order_type })),
            filteredOrderIds: filteredOrders.map(o => o.id)
          });
          
          return filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400">
                {searchTerm || filters.status || filters.order_type
                  ? 'Try adjusting your search or filter criteria'
                  : 'New orders will appear here when customers place them'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
              const OrderTypeIcon = getOrderTypeIcon(order.order_type);
              const StatusIcon = getStatusIcon(order.status);
              const statusActions = getStatusActions(order.status, order);

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <OrderTypeIcon className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.order_number}
                        {typeBadge(order.order_type)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        <StatusIcon className="w-4 h-4 inline mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {order.status === 'confirmed' && order.estimated_ready_time && (
                        <span className="text-sm text-gray-600">
                          🕐 {getTimeUntilReady(order.estimated_ready_time)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-emerald-600">
                        {formatPrice(order.total_amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(order.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Customer and Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Name:</strong> {order.customer_name}</p>
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
                        <p><strong>Type:</strong> <span className="capitalize">{order.order_type}</span></p>
                        <p><strong>Payment:</strong> <span className="capitalize">{order.payment_method}</span></p>
                        <p><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
                        {order.confirmed_at && (
                          <p><strong>Confirmed:</strong> {formatDateTime(order.confirmed_at)}</p>
                        )}
                        {order.estimated_ready_time && (
                          <p><strong>Ready by:</strong> {formatDateTime(order.estimated_ready_time)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
                    <div className="space-y-1">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>• {item.product_name} x {item.quantity}</span>
                          <span className="font-medium">{formatPrice(item.line_total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Information (for delivery orders) */}
                  {order.order_type === 'delivery' && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Delivery Information
                      </h4>
                      <div className="space-y-1 text-sm text-purple-700">
                        <p><strong>Method:</strong> {order.delivery_method || 'Maxim'}</p>
                        <p><strong>Address:</strong> {order.delivery_address || 'Not specified'}</p>
                        {order.delivery_landmark && (
                          <p><strong>Landmark:</strong> {order.delivery_landmark}</p>
                        )}
                        {order.delivery_fee && (
                          <p><strong>Fee:</strong> {formatPrice(order.delivery_fee)}</p>
                        )}
                        {order.delivery_tracking_number && (
                          <p><strong>Tracking #:</strong> {order.delivery_tracking_number}</p>
                        )}
                        {order.delivery_status && (
                          <p><strong>Status:</strong> <span className="capitalize">{order.delivery_status}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {order.special_instructions && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        <strong>Special Instructions:</strong> {order.special_instructions}
                      </p>
                    </div>
                  )}

                  {/* Progress Bar (for confirmed orders) */}
                  {order.status === 'confirmed' && order.confirmed_at && order.estimated_ready_time && (
                    <div className="mb-4">
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
                            } else if (action.action === 'book_delivery') {
                              handleBookDelivery(order);
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

            {/* Delivery Information (for delivery orders) */}
            {selectedOrder.order_type === 'delivery' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  Delivery Information
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Delivery Method</p>
                      <p className="text-purple-900 capitalize">{selectedOrder.delivery_method || 'Maxim'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Delivery Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.delivery_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.delivery_status === 'booked' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.delivery_status === 'in_transit' ? 'bg-orange-100 text-orange-800' :
                        selectedOrder.delivery_status === 'delivered' ? 'bg-green-100 text-green-800' :
                        selectedOrder.delivery_status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedOrder.delivery_status ? selectedOrder.delivery_status.charAt(0).toUpperCase() + selectedOrder.delivery_status.slice(1) : 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-purple-700 font-medium mb-2">Delivery Address</p>
                    <div className="bg-white border border-purple-200 rounded-lg p-3">
                      <p className="text-purple-900 font-medium">{selectedOrder.delivery_address || 'Address not specified'}</p>
                      {selectedOrder.delivery_landmark && (
                        <p className="text-sm text-purple-600 mt-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          Near {selectedOrder.delivery_landmark}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Contact Number</p>
                      <p className="text-purple-900">{selectedOrder.delivery_contact_number || selectedOrder.customer_phone}</p>
                    </div>
                    {selectedOrder.delivery_tracking_number && (
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Tracking Number</p>
                        <p className="text-purple-900 font-mono">{selectedOrder.delivery_tracking_number}</p>
                      </div>
                    )}
                  </div>

                  {/* Map Section */}
                  {selectedOrder.delivery_latitude && selectedOrder.delivery_longitude && (
                    <div>
                      <p className="text-sm text-purple-700 font-medium mb-2">Delivery Location</p>
                      <div className="bg-white border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-sm text-purple-600">
                          <MapPin className="w-4 h-4" />
                          <span>Coordinates: {selectedOrder.delivery_latitude.toFixed(6)}, {selectedOrder.delivery_longitude.toFixed(6)}</span>
                        </div>
                        <div className="mt-2 text-xs text-purple-500">
                          <button 
                            onClick={() => handleShowMap(
                              selectedOrder.delivery_latitude!, 
                              selectedOrder.delivery_longitude!, 
                              selectedOrder.delivery_address || 'Delivery Location'
                            )}
                            className="hover:text-purple-700 underline flex items-center space-x-1"
                          >
                            <span>📍</span>
                            <span>View on Map</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
              {getStatusActions(selectedOrder.status, selectedOrder).map((action, index) => {
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
                      } else if (action.action === 'book_delivery') {
                        handleBookDelivery(selectedOrder);
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

      {/* Book Delivery Modal */}
      {showBookDeliveryModal && orderForDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Book Delivery</h3>
                  <p className="text-sm text-gray-600">Order #{orderForDelivery.order_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBookDeliveryModal(false)}
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
                    <p className="font-medium">{orderForDelivery.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{orderForDelivery.customer_phone}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Delivery Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Address:</strong> {orderForDelivery.delivery_address || 'Not specified'}</p>
                  {orderForDelivery.delivery_landmark && (
                    <p><strong>Landmark:</strong> {orderForDelivery.delivery_landmark}</p>
                  )}
                  <p><strong>Contact:</strong> {orderForDelivery.delivery_contact_number || orderForDelivery.customer_phone}</p>
                </div>
              </div>

              {/* Delivery Booking Form */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Delivery Booking</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Fee (₱)
                    </label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter delivery fee"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tracking Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter tracking number if available"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rider Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter rider name if known"
                    />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900 mb-1">Delivery Instructions</h4>
                    <p className="text-sm text-orange-700">
                      After booking with Maxim, update the tracking number and rider name above. 
                      The order will be marked as "For Dispatch" and ready for pickup by the delivery rider.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowBookDeliveryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsDispatched}
                disabled={isProcessingDelivery || deliveryFee < 0}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingDelivery ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Mark as For Dispatch'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && mapCoordinates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delivery Location</h3>
                  <p className="text-sm text-gray-600">{mapAddress}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Map Container */}
            <div className="p-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                <DeliveryMapModal 
                  latitude={mapCoordinates.lat}
                  longitude={mapCoordinates.lng}
                  address={mapAddress}
                />
              </div>
              
              {/* Coordinates Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Coordinates: {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}</span>
                  </div>
                  <a 
                    href={`https://www.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Map Modal Component
const DeliveryMapModal: React.FC<{
  latitude: number;
  longitude: number;
  address: string;
}> = ({ latitude, longitude, address }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);

  React.useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Create map
        const map = L.map(mapRef.current).setView([latitude, longitude], 15);
        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add marker
        const marker = L.marker([latitude, longitude]).addTo(map);
        markerRef.current = marker;

        // Add popup with address
        marker.bindPopup(`
          <div class="p-2">
            <h4 class="font-semibold text-gray-900">Delivery Location</h4>
            <p class="text-sm text-gray-600 mt-1">${address}</p>
            <p class="text-xs text-gray-500 mt-1">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
          </div>
        `).openPopup();

        // Fit map to marker
        map.fitBounds(marker.getLatLng().toBounds(1000));

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, address]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default OnlineOrdersScreen;
