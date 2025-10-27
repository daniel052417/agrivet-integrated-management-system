# Sales Components Database Analysis

## Database Tables Required by Sales Components

Based on the analysis of `POS-Checkout-Tables.txt` and the current sales components, here are the required database tables:

### 1. **pos_transactions** ✅ (Available in POS-Checkout-Tables.txt)
**Used by:** All sales components
**Fields needed:**
- `id` - Primary key
- `transaction_number` - Unique transaction identifier
- `pos_session_id` - Links to POS session
- `customer_id` - Links to customer (nullable)
- `cashier_id` - Links to user/cashier
- `branch_id` - Links to branch (nullable)
- `transaction_date` - Transaction timestamp
- `transaction_type` - Type of transaction (sale, return, refund)
- `subtotal` - Subtotal amount
- `discount_amount` - Discount applied
- `discount_percentage` - Discount percentage
- `tax_amount` - Tax amount
- `total_amount` - Total transaction amount
- `payment_status` - Payment status (pending, completed, failed, refunded)
- `status` - Transaction status (active, void, cancelled)
- `notes` - Additional notes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### 2. **pos_transaction_items** ✅ (Available in POS-Checkout-Tables.txt)
**Used by:** All sales components for product analysis
**Fields needed:**
- `id` - Primary key
- `transaction_id` - Links to pos_transactions
- `product_id` - Links to products
- `product_name` - Product name (denormalized for performance)
- `product_sku` - Product SKU
- `quantity` - Item quantity
- `unit_of_measure` - Unit of measure
- `unit_price` - Price per unit
- `discount_amount` - Item discount
- `discount_percentage` - Item discount percentage
- `line_total` - Line item total
- `weight_kg` - Weight in kg (nullable)
- `expiry_date` - Product expiry date (nullable)
- `batch_number` - Batch number (nullable)
- `created_at` - Creation timestamp

### 3. **pos_payments** ✅ (Available in POS-Checkout-Tables.txt)
**Used by:** Payment analysis in sales components
**Fields needed:**
- `id` - Primary key
- `transaction_id` - Links to pos_transactions
- `payment_method` - Payment method (cash, gcash, paymaya, card, bank_transfer)
- `payment_type` - Payment type (nullable)
- `amount` - Payment amount
- `change_given` - Change given
- `reference_number` - Reference number (nullable)
- `payment_status` - Payment status
- `processed_at` - Processing timestamp
- `created_at` - Creation timestamp

### 4. **pos_sessions** ✅ (Available in POS-Checkout-Tables.txt)
**Used by:** Session-based analytics
**Fields needed:**
- `id` - Primary key
- `cashier_id` - Links to user/cashier
- `branch_id` - Links to branch (nullable)
- `session_number` - Unique session number
- `opened_at` - Session start time
- `closed_at` - Session end time (nullable)
- `starting_cash` - Starting cash amount
- `ending_cash` - Ending cash amount (nullable)
- `total_sales` - Total sales in session
- `total_transactions` - Transaction count
- `status` - Session status (open, closed, suspended)
- `terminal_id` - Links to POS terminal (nullable)
- `session_type` - Session type (sale, return, refund)
- `total_discounts` - Total discounts given
- `total_returns` - Total returns processed
- `total_taxes` - Total taxes collected
- `closed_by` - User who closed session (nullable)
- `cash_variance` - Computed cash variance
- `session_duration` - Computed session duration

## Issues Found

### ❌ **CRITICAL ISSUE: Wrong Transaction Table**

**Problem:** All sales components are using `sales_transactions` table, but the POS system uses `pos_transactions` table.

**Current Code:**
```typescript
// WRONG - This table doesn't exist in POS system
.from('sales_transactions')
```

**Should be:**
```typescript
// CORRECT - This is the actual POS transaction table
.from('pos_transactions')
```

### ❌ **Missing Required Tables**

The sales components reference these tables that are NOT in POS-Checkout-Tables.txt:

1. **`customers`** - Referenced by `customer_id` foreign key
2. **`users`** - Referenced by `cashier_id` foreign key  
3. **`branches`** - Referenced by `branch_id` foreign key
4. **`products`** - Referenced by `product_id` foreign key
5. **`categories`** - Referenced by `category_id` foreign key
6. **`staff`** - Referenced for staff information
7. **`staff_user_link`** - Links users to staff records

### ❌ **Inconsistent Field Names**

Some components expect different field names than what's available:

1. **`created_by_user_id`** vs **`cashier_id`** - Components expect `created_by_user_id` but table has `cashier_id`
2. **`transaction_date`** vs **`created_at`** - Some components use `transaction_date`, others use `created_at`

## Required Actions

### 1. **Update All Sales Components**
- Change `sales_transactions` to `pos_transactions`
- Update field names to match POS schema
- Update foreign key references

### 2. **Add Missing Tables**
The following tables need to be added to the database schema:
- `customers`
- `users` 
- `branches`
- `products`
- `categories`
- `staff`
- `staff_user_link`
- `pos_terminals`

### 3. **Update Field Mappings**
- Map `created_by_user_id` to `cashier_id`
- Ensure consistent use of `transaction_date` vs `created_at`
- Update all foreign key references

## Current Status

✅ **Available Tables:**
- pos_transactions
- pos_transaction_items  
- pos_payments
- pos_sessions
- inventory
- audit_logs

❌ **Missing Tables:**
- customers
- users
- branches
- products
- categories
- staff
- staff_user_link
- pos_terminals

❌ **Wrong Table References:**
- All components use `sales_transactions` instead of `pos_transactions`
