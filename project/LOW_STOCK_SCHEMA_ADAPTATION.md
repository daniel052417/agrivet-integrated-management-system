# Low Stock Alerts - Schema Adaptation

## Overview
Updated the `LowStockAlerts.tsx` component to use your current database schema with `inventory`, `product_variants`, `products`, and `categories` tables.

## ✅ **Key Changes Made**

### **1. Updated Data Fetching**
**Before**: Direct queries to `products` table
```typescript
// Old approach - direct product queries
supabase.from('products').select('id, name, sku, category_id, supplier_id, stock_quantity, minimum_stock, unit_price, updated_at')
```

**After**: Uses RPC function for complex joins
```typescript
// New approach - uses inventory-based RPC function
const { data: inventoryData, error: inventoryError } = await supabase.rpc('get_inventory_with_details', {
  branch_filter: null // Get all branches for low stock alerts
});
```

### **2. Updated Low Stock Logic**
**Before**: Used `products.stock_quantity` and `products.minimum_stock`
```typescript
const qty = Number(p.stock_quantity || 0);
const min = Number(p.minimum_stock || 0);
return min > 0 && qty > 0 && qty <= min;
```

**After**: Uses `inventory.quantity_on_hand` and `inventory.reorder_level`
```typescript
const qty = Number(item.quantity_on_hand || 0);
const reorderLevel = Number(item.reorder_level || 0);
return reorderLevel > 0 && qty > 0 && qty <= reorderLevel;
```

### **3. Enhanced Data Structure**
**Updated LowItem Type**:
```typescript
type LowItem = {
  // ... existing fields
  // Additional fields from inventory schema
  branchName?: string;
  branchCode?: string;
  variantType?: string;
  variantValue?: string;
};
```

### **4. Updated Table Display**
**New Table Structure**:
- ✅ **Product / Branch**: Product name with branch name
- ✅ **Category**: Product category
- ✅ **Variant**: Variant name and type/value
- ✅ **Stock Level**: Current stock vs reorder level
- ✅ **Days Until Empty**: Calculated based on usage
- ✅ **Supplier**: Supplier information
- ✅ **Urgency**: Critical/High/Medium/Low priority
- ✅ **Actions**: Reorder/View/Edit buttons

## 🔍 **Data Flow**

### **1. Data Fetching**
```typescript
1. Call get_inventory_with_details() RPC function
2. Fetch categories and suppliers for additional info
3. Filter inventory items where quantity_on_hand <= reorder_level
4. Transform data to LowItem format
5. Calculate urgency and metrics
```

### **2. Low Stock Detection**
```typescript
// Filter criteria
const qty = Number(item.quantity_on_hand || 0);
const reorderLevel = Number(item.reorder_level || 0);
return reorderLevel > 0 && qty > 0 && qty <= reorderLevel;

// Urgency calculation
const ratio = reorderLevel > 0 ? qty / reorderLevel : 1;
const urgency = ratio <= 0.25 ? 'Critical' : 
                ratio <= 0.5 ? 'High' : 
                ratio <= 0.75 ? 'Medium' : 'Low';
```

### **3. Data Transformation**
```typescript
// Maps inventory data to LowItem format
{
  id: item.product_id,
  name: item.product_name,
  sku: item.variant_name,
  category: categoryIdToName.get(item.category_id) || 'Uncategorized',
  currentStock: qty,
  minimumStock: reorderLevel,
  reorderLevel: Math.max(reorderLevel, Math.ceil(reorderLevel * 1.5)),
  unitPrice: price,
  totalValue: qty * price,
  branchName: item.branch_name,
  branchCode: item.branch_code,
  variantType: item.variant_type,
  variantValue: item.variant_value,
  // ... other fields
}
```

## 🎯 **Benefits of Schema Adaptation**

### **✅ Accurate Data**
- **Real Inventory Data**: Uses actual inventory table data
- **Branch Awareness**: Shows which branch has low stock
- **Variant Details**: Displays product variant information
- **Consistent Logic**: Same RPC function as InventoryManagement

### **✅ Performance**
- **Single Query**: One RPC call gets all needed data
- **Database Optimization**: Leverages database joins and indexes
- **Efficient Filtering**: Client-side filtering for low stock items

### **✅ Enhanced Features**
- **Branch Context**: Shows which branch has low stock
- **Variant Information**: Displays variant type and value
- **Better Categorization**: Uses actual category data
- **Accurate Pricing**: Uses variant pricing

## 🔍 **Debugging Features**

### **Console Logging**:
```javascript
🚀 Starting to fetch low stock data...
🔍 Raw inventory data for low stock: [array]
📊 Number of inventory records: X
✅ Filtered low stock items: X
```

## 📊 **Table Display**

### **Product / Branch Column**:
- **Product Name**: From `products.name`
- **Branch Name**: From `branches.name`
- **Unit Price**: From `product_variants.price`

### **Variant Column**:
- **Variant Name**: From `product_variants.name`
- **Variant Type/Value**: From `product_variants.variant_type` and `variant_value`

### **Stock Level Column**:
- **Current Stock**: From `inventory.quantity_on_hand`
- **Reorder Level**: From `inventory.reorder_level`
- **Visual Progress Bar**: Shows stock level vs reorder level

## 🚀 **Result**

### **✅ Now Works With Your Schema**
- ✅ **Uses Inventory Table**: Real inventory data instead of product stock
- ✅ **Branch Support**: Shows which branch has low stock
- ✅ **Variant Details**: Displays product variant information
- ✅ **Accurate Filtering**: Proper low stock detection using reorder levels
- ✅ **Consistent Data**: Same RPC function as other components

### **🎯 User Experience**
- ✅ **Real-time Alerts**: Based on actual inventory levels
- ✅ **Branch Context**: See which branch needs restocking
- ✅ **Variant Information**: Understand product variations
- ✅ **Accurate Metrics**: Proper urgency calculations

The Low Stock Alerts component now uses your exact database schema for accurate and comprehensive low stock monitoring! 🚀