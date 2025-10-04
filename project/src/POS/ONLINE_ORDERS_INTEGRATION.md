# Online Orders Integration Diagram

## POS System Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                        POS System                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Cashier   │  │  Inventory  │  │  Customers  │            │
│  │   Screen    │  │   Screen    │  │   Screen    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Online Orders Screen                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │   Pending   │  │  Confirmed  │  │    Ready    │        │ │
│  │  │   Orders    │  │   Orders    │  │   Orders    │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │              Order Details Modal                       │ │ │
│  │  │  • Customer Information                               │ │ │
│  │  │  • Order Items                                        │ │ │
│  │  │  • Payment Details                                    │ │ │
│  │  │  • Status Actions                                     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Online Orders Service                       │
├─────────────────────────────────────────────────────────────────┤
│  • getOrders()                                                 │
│  • updateOrderStatus()                                         │
│  • getNewOrdersCount()                                         │
│  • addOrder()                                                  │
│  • deleteOrder()                                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Sample Data                               │
├─────────────────────────────────────────────────────────────────┤
│  • 5 Sample Orders with different statuses                    │
│  • Various order types (pickup, delivery, reservation)        │
│  • Realistic customer information                             │
│  • Product items with pricing                                 │
│  • Special instructions                                       │
└─────────────────────────────────────────────────────────────────┘

## Navigation Flow

```
Header Notification Bell (3) ──┐
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POS Layout                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Cashier   │  │  Inventory  │  │  Customers  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Online Orders (NEW)                           │ │
│  │  🔔 Notification Badge: 3 pending orders                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                            │
│  │   Reports   │  │    Users    │                            │
│  └─────────────┘  └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Order Status Workflow

```
New Order (Pending)
        │
        ▼
   ┌─────────┐
   │ Confirm │ ──► Confirmed
   └─────────┘
        │
        ▼
   ┌─────────┐
   │  Ready  │ ──► Ready for Pickup/Delivery
   └─────────┘
        │
        ▼
   ┌─────────┐
   │Complete │ ──► Completed
   └─────────┘
        │
        ▼
   ┌─────────┐
   │ Cancel  │ ──► Cancelled
   └─────────┘
```

## Features Overview

### Real-time Updates
- Auto-refresh every 30 seconds
- Notification badge in header
- Status change notifications

### Order Management
- View all orders with filtering
- Search by customer/order number
- Detailed order information modal
- Status update actions

### Sample Data
- 5 realistic sample orders
- Different order types and statuses
- Customer information and special instructions
- Product details with pricing

### Integration Points
- Added to POS navigation
- Notification system integration
- Service layer for data management
- Type definitions for consistency













