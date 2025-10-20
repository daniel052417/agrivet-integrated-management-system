# Fix Orders Database Function Error

## 🐛 **Problem**
The `get_customer_orders` database function was failing with errors:
1. `column cov.actual_ready_time does not exist`
2. `structure of query does not match function result type` - timestamp type mismatch

## 🔍 **Root Cause**
1. The database function was trying to reference `actual_ready_time` column which doesn't exist in the `orders` table
2. The function return type definitions didn't match the actual column types in the database (timestamp with/without time zone mismatch)

## ✅ **Solution**

### 1. **Fixed Database Function**
Created `fix_get_customer_orders_function.sql` that:
- Removes the non-existent `actual_ready_time` column reference
- Corrects all column references to match the actual `orders` table schema
- Fixes timestamp type mismatches (uses `timestamp without time zone` to match database)
- Maintains proper RLS (Row Level Security) policies
- Ensures proper authentication and authorization

### 2. **Updated CustomerOrderService**
- Removed remaining `initSupabase()` calls that were causing issues
- Simplified error handling for missing Supabase client

## 🚀 **How to Apply the Fix**

### Step 1: Run the Database Migration
```sql
-- Run this SQL script in your Supabase SQL editor
-- File: project/sql migrations/fix_get_customer_orders_function.sql
```

### Step 2: Test the Orders Page
1. Navigate to `/orders` in your PWA
2. The page should now load real orders from the database
3. No more "column does not exist" errors

## 📋 **What the Fix Includes**

### **Fixed Function: `get_customer_orders`**
- ✅ Removed `actual_ready_time` column reference
- ✅ Corrected all column names to match `orders` table
- ✅ Proper RLS policies for customer access
- ✅ Support for both authenticated and guest orders
- ✅ Optimized query with proper joins

### **Fixed Function: `get_order_with_items`**
- ✅ Corrected column references
- ✅ Proper RLS policies
- ✅ Returns order data and items as JSONB

### **Updated Service: `CustomerOrderService`**
- ✅ Removed deprecated `initSupabase()` calls
- ✅ Uses shared Supabase client
- ✅ Simplified error handling

## 🎯 **Expected Result**
- Orders page loads real data from database
- No more 400 Bad Request errors
- Proper customer order filtering and access
- Support for both registered and guest customers

## 🔧 **Database Schema Requirements**
The fix assumes your `orders` table has these columns:
- `id`, `order_number`, `customer_id`, `branch_id`
- `status`, `payment_status`, `subtotal`, `tax_amount`
- `discount_amount`, `total_amount`, `payment_method`
- `payment_reference`, `payment_notes`, `estimated_ready_time`
- `is_guest_order`, `customer_name`, `customer_email`
- `customer_phone`, `special_instructions`, `notes`
- `confirmed_at`, `completed_at`, `confirmed_by`
- `order_type`, `created_at`, `updated_at`

If any of these columns are missing, you may need to run additional migrations.
