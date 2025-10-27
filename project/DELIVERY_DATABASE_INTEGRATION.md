# Delivery Database Integration Guide

This document explains how the "Delivery via Maxim" feature integrates with your Supabase database.

## Overview

The delivery feature adds new columns to the `orders` table and updates the order creation process to handle both pickup and delivery orders.

## Database Schema Changes

### New Columns Added to `orders` Table

| Column | Type | Description | Example Values |
|--------|------|-------------|----------------|
| `delivery_method` | VARCHAR(20) | Delivery service provider | 'maxim', 'other' |
| `delivery_status` | VARCHAR(20) | Current delivery status | 'pending', 'booked', 'in_transit', 'delivered', 'failed' |
| `delivery_address` | TEXT | Full delivery address | '123 Main St, Barangay Sample, City' |
| `delivery_contact_number` | VARCHAR(20) | Contact number for delivery | '+63 912 345 6789' |
| `delivery_landmark` | TEXT | Optional landmark for delivery | 'Near SM Mall, beside 7-Eleven' |
| `delivery_fee` | DECIMAL(10,2) | Delivery fee (set by staff later) | 50.00, 75.50 |
| `delivery_tracking_number` | VARCHAR(100) | Tracking number from delivery service | 'MAX123456789' |

### Updated Constraints

- `order_type` now accepts: 'pickup', 'delivery'
- `delivery_status` accepts: 'pending', 'booked', 'in_transit', 'delivered', 'failed'
- `delivery_method` accepts: 'maxim', 'other'

## Data Flow

### 1. Frontend (PWA Checkout)

```typescript
// EnhancedCheckoutForm.tsx
const deliveryInfo = {
  method: 'delivery', // or 'pickup'
  deliveryMethod: 'maxim',
  address: '123 Main Street...',
  contactNumber: '+63 912 345 6789',
  landmark: 'Near SM Mall'
}

// Order creation payload
const orderPayload = {
  orderType: deliveryInfo.method,
  deliveryMethod: deliveryInfo.deliveryMethod,
  deliveryAddress: deliveryInfo.address,
  deliveryContactNumber: deliveryInfo.contactNumber,
  deliveryLandmark: deliveryInfo.landmark,
  deliveryStatus: 'pending'
}
```

### 2. Service Layer (OrderService)

```typescript
// orderService.ts
const orderData = {
  order_type: orderType, // 'pickup' or 'delivery'
  delivery_method: deliveryMethod || null,
  delivery_address: deliveryAddress || null,
  delivery_contact_number: deliveryContactNumber || null,
  delivery_landmark: deliveryLandmark || null,
  delivery_status: deliveryStatus || null,
  estimated_ready_time: orderType === 'pickup' ? readyTime : null
}
```

### 3. Database Insert

```sql
INSERT INTO orders (
  order_type,
  delivery_method,
  delivery_address,
  delivery_contact_number,
  delivery_landmark,
  delivery_status,
  -- ... other fields
) VALUES (
  'delivery',
  'maxim',
  '123 Main Street...',
  '+63 912 345 6789',
  'Near SM Mall',
  'pending'
  -- ... other values
);
```

## Order Types and Data Patterns

### Pickup Orders

```json
{
  "order_type": "pickup",
  "delivery_method": null,
  "delivery_address": null,
  "delivery_contact_number": null,
  "delivery_landmark": null,
  "delivery_status": null,
  "estimated_ready_time": "2024-01-28T15:30:00Z"
}
```

### Delivery Orders

```json
{
  "order_type": "delivery",
  "delivery_method": "maxim",
  "delivery_address": "123 Main Street, Barangay Sample, City",
  "delivery_contact_number": "+63 912 345 6789",
  "delivery_landmark": "Near SM Mall, beside 7-Eleven",
  "delivery_status": "pending",
  "estimated_ready_time": null
}
```

## Migration Steps

### 1. Run Database Migration

```bash
# Apply the migration
supabase db push

# Or run the SQL directly in Supabase SQL Editor
```

### 2. Verify Schema

```sql
-- Check if delivery columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE 'delivery_%'
ORDER BY column_name;

-- Check constraints
SELECT constraint_name, constraint_type, check_clause 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'orders' 
AND tc.constraint_type = 'CHECK'
AND (cc.check_clause LIKE '%delivery%' OR cc.check_clause LIKE '%order_type%');
```

### 3. Test Order Creation

```bash
# Run the test script
node test-delivery-database-integration.js
```

## API Endpoints

### Create Order (Edge Function)

**Endpoint:** `POST /functions/v1/create-order`

**Request Body:**
```json
{
  "cart": { /* cart data */ },
  "customerId": "uuid",
  "branchId": "uuid",
  "paymentMethod": "cash",
  "orderType": "delivery",
  "deliveryMethod": "maxim",
  "deliveryAddress": "123 Main Street...",
  "deliveryContactNumber": "+63 912 345 6789",
  "deliveryLandmark": "Near SM Mall",
  "deliveryStatus": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "order": { /* order data with delivery fields */ },
  "orderId": "uuid"
}
```

## Staff Workflow (ERP Integration)

### 1. Order Confirmation

When staff confirms a delivery order:

```sql
UPDATE orders 
SET 
  status = 'confirmed',
  delivery_status = 'booked',
  delivery_fee = 50.00,
  delivery_tracking_number = 'MAX123456789',
  confirmed_at = NOW()
WHERE id = 'order-uuid';
```

### 2. Delivery Updates

```sql
-- Mark as in transit
UPDATE orders 
SET 
  delivery_status = 'in_transit',
  updated_at = NOW()
WHERE id = 'order-uuid';

-- Mark as delivered
UPDATE orders 
SET 
  delivery_status = 'delivered',
  completed_at = NOW(),
  updated_at = NOW()
WHERE id = 'order-uuid';
```

## Query Examples

### Get All Delivery Orders

```sql
SELECT 
  order_number,
  customer_name,
  delivery_address,
  delivery_contact_number,
  delivery_status,
  created_at
FROM orders 
WHERE order_type = 'delivery'
ORDER BY created_at DESC;
```

### Get Pending Delivery Orders

```sql
SELECT 
  order_number,
  customer_name,
  delivery_address,
  delivery_contact_number,
  delivery_landmark
FROM orders 
WHERE order_type = 'delivery' 
AND delivery_status = 'pending'
ORDER BY created_at ASC;
```

### Get Orders by Delivery Method

```sql
SELECT 
  order_number,
  delivery_method,
  delivery_status,
  delivery_tracking_number
FROM orders 
WHERE delivery_method = 'maxim'
AND delivery_status IN ('booked', 'in_transit');
```

## Error Handling

### Common Issues

1. **Missing Delivery Columns**: Run the migration script
2. **Invalid Order Type**: Check constraint values
3. **Null Delivery Data**: Ensure proper validation in frontend

### Validation Rules

- `order_type` must be 'pickup' or 'delivery'
- If `order_type` is 'delivery', `delivery_method` and `delivery_address` are required
- `delivery_status` defaults to 'pending' for new delivery orders
- `estimated_ready_time` is only set for pickup orders

## Testing

### Manual Testing

1. Create a pickup order through PWA
2. Verify `order_type = 'pickup'` and delivery fields are null
3. Create a delivery order through PWA
4. Verify all delivery fields are populated correctly

### Automated Testing

```bash
# Run the test suite
node test-delivery-database-integration.js
```

## Monitoring

### Key Metrics to Track

- Delivery vs Pickup order ratio
- Average delivery time
- Delivery success rate
- Failed delivery reasons

### Useful Queries

```sql
-- Delivery order statistics
SELECT 
  delivery_status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_hours
FROM orders 
WHERE order_type = 'delivery'
GROUP BY delivery_status;

-- Daily delivery orders
SELECT 
  DATE(created_at) as date,
  COUNT(*) as delivery_orders
FROM orders 
WHERE order_type = 'delivery'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Security Considerations

- Delivery addresses are stored as plain text (consider encryption for sensitive data)
- Contact numbers should be validated before storage
- Implement proper access controls for delivery data
- Consider GDPR compliance for address data

## Future Enhancements

1. **Delivery Fee Calculation**: Integrate with Maxim API for real-time pricing
2. **Address Validation**: Validate delivery addresses against postal codes
3. **Delivery Tracking**: Real-time tracking integration with Maxim
4. **Delivery Zones**: Restrict delivery to specific areas
5. **Delivery Time Slots**: Allow customers to select preferred delivery times




