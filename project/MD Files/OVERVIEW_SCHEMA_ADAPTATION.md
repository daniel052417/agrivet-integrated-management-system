# Overview.tsx Schema Adaptation

## Summary
Updated the `Overview.tsx` component and its child components to work with the actual database schema provided by the user.

## Key Schema Changes Identified

### 1. **Missing Tables**
- `sales_transaction_items` - Does not exist in the provided schema
- `sales_orders` - Does not exist in the provided schema

### 2. **Different Inventory Structure**
- **Old**: Direct `products` table with `stock_quantity`, `minimum_stock`, `price`, `cost_price`
- **New**: `inventory` + `product_variants` + `products` relationship
  - `inventory.quantity_on_hand` (instead of `products.stock_quantity`)
  - `inventory.reorder_level` (instead of `products.minimum_stock`)
  - `product_variants.price` (instead of `products.price`)
  - `product_variants.cost` (instead of `products.cost_price`)

### 3. **Field Name Changes**
- `sales_transactions.staff_id` → `sales_transactions.created_by_user_id`
- `products.product_name` → `products.name`
- `products.minimum_stock` → `inventory.reorder_level`

## Files Modified

### 1. **MetricCard.tsx**
**Changes:**
- Updated `active_orders` metric to use `payment_status = 'pending'` from `sales_transactions` instead of non-existent `sales_orders`
- Updated `low_stock_alerts` to use `inventory.reorder_level` instead of `products.minimum_stock`

**Database Queries:**
```sql
-- Today's Sales (unchanged)
SELECT total_amount FROM sales_transactions 
WHERE transaction_date >= today AND transaction_date < tomorrow

-- Products in Stock (unchanged)
SELECT quantity_on_hand FROM inventory

-- Active Orders (changed)
SELECT id FROM sales_transactions WHERE payment_status = 'pending'

-- Low Stock Alerts (changed)
SELECT quantity_on_hand, reorder_level FROM inventory 
WHERE quantity_on_hand < reorder_level
```

### 2. **InventorySummary.tsx**
**Changes:**
- Updated to use `inventory` + `product_variants` + `products` relationship
- Added complex JOIN query to get product data through variants

**Database Query:**
```sql
SELECT 
  i.quantity_on_hand,
  pv.price,
  pv.cost,
  p.category_id,
  p.name
FROM inventory i
INNER JOIN product_variants pv ON i.product_variant_id = pv.id
INNER JOIN products p ON pv.product_id = p.id
```

### 3. **SalesByProduct.tsx**
**Changes:**
- Updated to use `products` + `product_variants` relationship
- Created mock transaction items since `sales_transaction_items` doesn't exist
- Used `sales_transactions` data to simulate product sales

**Database Queries:**
```sql
-- Products with variants
SELECT p.id, p.name, p.category_id, pv.id, pv.name, pv.price
FROM products p
INNER JOIN product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true

-- Sales transactions (for mock data)
SELECT id, total_amount, transaction_date 
FROM sales_transactions 
WHERE transaction_date >= thirty_days_ago
```

### 4. **RecentActivity.tsx**
**Changes:**
- Updated low stock alerts to use `inventory` + `product_variants` + `products` relationship

**Database Query:**
```sql
SELECT 
  i.quantity_on_hand,
  i.reorder_level,
  pv.name,
  p.name
FROM inventory i
INNER JOIN product_variants pv ON i.product_variant_id = pv.id
INNER JOIN products p ON pv.product_id = p.id
WHERE i.quantity_on_hand < i.reorder_level
```

### 5. **LowStockAlert.tsx**
**Changes:**
- Updated to use `inventory` + `product_variants` + `products` relationship
- Changed field references to match new schema

**Database Query:**
```sql
SELECT 
  i.quantity_on_hand,
  i.reorder_level,
  pv.name,
  p.category_id,
  p.name
FROM inventory i
INNER JOIN product_variants pv ON i.product_variant_id = pv.id
INNER JOIN products p ON pv.product_id = p.id
WHERE i.quantity_on_hand < i.reorder_level
ORDER BY i.quantity_on_hand ASC
```

### 6. **TopPerformers.tsx**
**Changes:**
- Updated to use `created_by_user_id` instead of `staff_id` in sales transactions

**Database Query:**
```sql
SELECT created_by_user_id, total_amount, transaction_date
FROM sales_transactions 
WHERE created_by_user_id IS NOT NULL 
AND transaction_date >= thirty_days_ago
```

## Database Tables Used

### **Primary Tables:**
1. **`sales_transactions`** - Main sales data
2. **`inventory`** - Stock levels and reorder points
3. **`product_variants`** - Product pricing and variants
4. **`products`** - Product master data
5. **`categories`** - Product categories
6. **`staff`** - Staff/employee data
7. **`branches`** - Branch/office locations

### **Key Relationships:**
- `inventory.product_variant_id` → `product_variants.id`
- `product_variants.product_id` → `products.id`
- `products.category_id` → `categories.id`
- `sales_transactions.created_by_user_id` → `users.id`
- `sales_transactions.branch_id` → `branches.id`

## Notes

1. **Mock Data**: Since `sales_transaction_items` doesn't exist, `SalesByProduct.tsx` creates mock transaction items based on actual sales transactions.

2. **Performance**: The new queries use JOINs which may be slower than direct table access. Consider adding indexes on foreign keys if performance becomes an issue.

3. **Data Integrity**: The component now relies on the relationship between `inventory`, `product_variants`, and `products` tables. Ensure these relationships are properly maintained.

4. **Error Handling**: All components maintain the same error handling patterns and loading states.

## Testing Recommendations

1. **Verify Data**: Ensure the `inventory`, `product_variants`, and `products` tables have proper data relationships
2. **Test Performance**: Monitor query performance with the new JOIN operations
3. **Check Permissions**: Verify RLS policies work with the new query structures
4. **Validate Mock Data**: Test the mock transaction items in `SalesByProduct.tsx` to ensure realistic data display

## Future Improvements

1. **Create Missing Tables**: Consider creating `sales_transaction_items` and `sales_orders` tables for more accurate data
2. **Add Indexes**: Add indexes on foreign key columns for better performance
3. **Optimize Queries**: Consider using views or stored procedures for complex queries
4. **Real-time Updates**: Implement Supabase real-time subscriptions for live data updates
