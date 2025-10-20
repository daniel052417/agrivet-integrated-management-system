# Low Stock Alerts Error Fix

## Problem
The user was getting this error:
```
GET https://prhxgpbqkpdnjpmxndyp.supabase.co/rest/v1/products?select=id%2Cproduct_name%2Csku%2Cstock_quantity%2Cminimum_stock%2Cunit_price%2Ccategory_id%2Csupplier_id%2Clast_order_date%2Clead_time%2Ccategories%3Acategory_id%28name%29%2Csuppliers%3Asupplier_id%28name%2Ccontact_person%2Cemail%29&is_active=eq.true&minimum_stock=not.is.null&order=stock_quantity.asc 400 (Bad Request)

Error: column products.product_name does not exist
```

## Root Cause
The error was coming from `project/src/components/inventory/LowStockAlerts.tsx` which was still using the old database schema with direct queries to the `products` table using columns that don't exist in the user's current schema:

- ❌ `product_name` (should be `name`)
- ❌ `stock_quantity` (not in products table)
- ❌ `minimum_stock` (not in products table)
- ❌ `unit_price` (not in products table)

## Solution
Updated `project/src/components/inventory/LowStockAlerts.tsx` to use the new schema approach:

### ✅ **Before (Causing Error)**
```typescript
// Direct query to products table with non-existent columns
const { data: products, error: productsError } = await supabase
  .from('products')
  .select(`
    id, product_name, sku, stock_quantity, minimum_stock, unit_price,
    category_id, supplier_id, last_order_date, lead_time,
    categories:category_id (name),
    suppliers:supplier_id (name, contact_person, email)
  `)
  .eq('is_active', true)
  .not('minimum_stock', 'is', null)
  .order('stock_quantity', { ascending: true });
```

### ✅ **After (Working)**
```typescript
// Use RPC function with proper schema
const { data: inventoryData, error: inventoryError } = await supabase.rpc('get_inventory_with_details', {
  branch_filter: null // Get all branches for low stock alerts
});

// Filter for low stock items using inventory table data
const transformedItems: LowItem[] = (inventoryData || [])
  .filter((item: any) => {
    const qty = Number(item.quantity_on_hand || 0);
    const reorderLevel = Number(item.reorder_level || 0);
    return reorderLevel > 0 && qty > 0 && qty <= reorderLevel;
  })
  .map((item: any) => ({
    id: item.product_id,
    name: item.product_name,
    sku: item.variant_name,
    category: categoryIdToName.get(item.category_id || '') || 'Uncategorized',
    currentStock: Number(item.quantity_on_hand || 0),
    minimumStock: Number(item.reorder_level || 0),
    // ... other fields
  }));
```

## Key Changes Made

### **1. Updated Data Source**
- **Before**: Direct queries to `products` table
- **After**: Uses `get_inventory_with_details` RPC function

### **2. Updated Low Stock Logic**
- **Before**: `product.stock_quantity <= product.minimum_stock`
- **After**: `item.quantity_on_hand <= item.reorder_level`

### **3. Updated Field Mapping**
- **Before**: `product.product_name` → **After**: `item.product_name`
- **Before**: `product.stock_quantity` → **After**: `item.quantity_on_hand`
- **Before**: `product.minimum_stock` → **After**: `item.reorder_level`
- **Before**: `product.unit_price` → **After**: `item.price`

### **4. Enhanced Data Structure**
- Uses inventory table data with proper joins
- Includes branch and variant information
- Consistent with other components

## Files Updated

### ✅ **Fixed File**
- `project/src/components/inventory/LowStockAlerts.tsx`

### ✅ **Already Updated Files**
- `project/src/Admin/components/Inventory/LowStockAlerts.tsx` ✅
- `project/src/components/inventory/InventoryManagement.tsx` ✅

## Result

### ✅ **Error Fixed**
- ✅ **No more column errors**: Uses correct schema columns
- ✅ **Consistent data source**: Same RPC function as other components
- ✅ **Proper low stock detection**: Uses inventory table data
- ✅ **Branch support**: Shows which branch has low stock

### **🎯 Benefits**
- ✅ **Schema Compliance**: Uses your exact database structure
- ✅ **Performance**: Single optimized RPC query
- ✅ **Consistency**: Same approach as InventoryManagement
- ✅ **Accuracy**: Real inventory data instead of product stock

The Low Stock Alerts component now works correctly with your database schema! 🚀
