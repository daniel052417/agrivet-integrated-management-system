# Online Orders Feature

## Overview
The Online Orders feature allows POS staff to manage incoming orders and reservations from customers. This includes viewing order details, updating order status, and tracking order progress.

## Features

### Order Management
- **View Orders**: Display all incoming orders with customer information, order details, and status
- **Filter Orders**: Filter by status (pending, confirmed, ready, completed, cancelled) and order type (pickup, delivery, reservation)
- **Search Orders**: Search by order number, customer name, or phone number
- **Order Details**: View comprehensive order information including items, totals, and special instructions

### Status Management
- **Pending**: New orders awaiting confirmation
- **Confirmed**: Orders that have been confirmed by staff
- **Ready**: Orders that are prepared and ready for pickup/delivery
- **Completed**: Orders that have been fulfilled
- **Cancelled**: Orders that have been cancelled

### Order Types
- **Pickup**: Customer will pick up the order at the store
- **Delivery**: Order will be delivered to customer's address
- **Reservation**: Order is reserved for a specific time

### Real-time Updates
- **Auto-refresh**: Orders are automatically refreshed every 30 seconds
- **Notification Badge**: Shows count of new pending orders in the header
- **Status Updates**: Real-time status updates when orders are processed

## Sample Data
The feature includes comprehensive sample data for testing:

### Sample Orders
1. **ORD-001** - Maria Santos (Pickup, Pending)
   - Chicken Feed Premium 50kg
   - Total: ₱1,400.00
   - Special instructions: "Please pack carefully"

2. **ORD-002** - Juan Dela Cruz (Delivery, Confirmed)
   - Pig Vitamins - Multivitamin x2
   - Total: ₱1,002.00 (includes ₱50 delivery fee)
   - Special instructions: "Leave at gate if no answer"

3. **ORD-003** - Ana Rodriguez (Reservation, Ready)
   - Cattle Feed Mix 25kg x2
   - Total: ₱2,352.00
   - Special instructions: "Customer will pick up at 4 PM"

4. **ORD-004** - Pedro Martinez (Pickup, Completed)
   - Dog Food Premium 15kg
   - Total: ₱840.00

5. **ORD-005** - Lisa Garcia (Delivery, Pending)
   - Fish Feed Floating Pellets 20kg x3
   - Total: ₱2,091.00 (includes ₱75 delivery fee)
   - Special instructions: "Call before delivery"

## Usage

### Accessing Online Orders
1. Navigate to the POS system
2. Click on "Online Orders" in the sidebar navigation
3. The notification bell in the header shows the count of pending orders

### Managing Orders
1. **View Order Details**: Click "View Details" on any order
2. **Update Status**: Use the status action buttons (Confirm, Mark Ready, Complete, Cancel)
3. **Filter Orders**: Use the status and type filters to find specific orders
4. **Search Orders**: Use the search bar to find orders by customer or order number

### Order Status Workflow
1. **New Order** → Pending (staff notification)
2. **Pending** → Confirmed (staff confirms order)
3. **Confirmed** → Ready (order is prepared)
4. **Ready** → Completed (order is fulfilled)

## Technical Implementation

### Components
- `OnlineOrdersScreen.tsx` - Main screen component
- `OnlineOrdersService.ts` - Service for managing order data
- Updated navigation in `POSLayout.tsx`
- Added types in `pos.ts`

### Data Structure
```typescript
interface OnlineOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  branch_id: string;
  order_type: 'pickup' | 'delivery' | 'reservation';
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'cash' | 'digital' | 'card';
  subtotal: number;
  tax_amount: number;
  delivery_fee?: number;
  total_amount: number;
  special_instructions?: string;
  estimated_ready_time?: string;
  actual_ready_time?: string;
  pickup_time?: string;
  delivery_time?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  items: OnlineOrderItem[];
}
```

### Service Methods
- `getOrders(filters?)` - Retrieve orders with optional filtering
- `getOrderById(id)` - Get specific order details
- `updateOrderStatus(id, status)` - Update order status
- `getNewOrdersCount()` - Get count of pending orders
- `addOrder(order)` - Add new order
- `deleteOrder(id)` - Remove order

## Future Enhancements
- Real-time WebSocket integration for instant updates
- Email/SMS notifications for customers
- Order printing functionality
- Integration with external order management systems
- Advanced filtering and sorting options
- Order analytics and reporting
- Customer order history
- Order modification capabilities
