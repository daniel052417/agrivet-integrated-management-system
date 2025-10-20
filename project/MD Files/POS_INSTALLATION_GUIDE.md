# POS System Installation Guide

This guide will help you set up the POS system for your agrivet business.

## 📋 Prerequisites

- Existing Agrivet Integrated Management System installed
- Supabase database configured and running
- Node.js and npm installed
- Admin access to the system

## 🗄️ Database Setup

### Step 1: Run Database Migration
Execute the POS system database migration:

```sql
-- Run this file in your Supabase SQL editor
-- File: project/supabase/migrations/20250115000000_pos_system_schema.sql
```

This migration will:
- Create POS-specific tables
- Extend existing product and customer tables
- Add POS settings and configurations
- Create necessary indexes and functions

### Step 2: Verify Database Setup
Check that the following tables were created:
- `pos_sessions`
- `pos_transactions`
- `pos_transaction_items`
- `pos_payments`
- `product_variants`
- `quick_sale_items`
- `receipt_templates`
- `customer_loyalty_points`
- `pos_audit_logs`

## ⚙️ System Configuration

### Step 3: Configure POS Settings
Update the default POS settings in the `pos_settings` table:

```sql
-- Update company-specific settings
UPDATE pos_settings 
SET setting_value = 'Your Company Name' 
WHERE setting_key = 'company_name';

UPDATE pos_settings 
SET setting_value = 'Your Store Address' 
WHERE setting_key = 'store_address';

-- Configure tax rate (default is 12% VAT)
UPDATE pos_settings 
SET setting_value = '0.12' 
WHERE setting_key = 'default_tax_rate';
```

### Step 4: Set Up Product Categories
Ensure your product categories are properly configured:

```sql
-- Check existing categories
SELECT * FROM categories WHERE is_active = true;

-- Add POS-specific category configurations if needed
INSERT INTO pos_product_categories (category_id, category_name, pricing_type, unit_of_measure)
SELECT id, name, 'fixed', 'pcs' 
FROM categories 
WHERE is_active = true;
```

### Step 5: Configure Products for POS
Update your products with POS-specific information:

```sql
-- Set pricing types for agricultural products
UPDATE products 
SET pos_pricing_type = 'weight_based' 
WHERE name ILIKE '%feed%' AND name NOT ILIKE '%bag%' AND name NOT ILIKE '%sack%';

UPDATE products 
SET pos_pricing_type = 'weight_based' 
WHERE name ILIKE '%fertilizer%' AND name NOT ILIKE '%bag%' AND name NOT ILIKE '%sack%';

-- Set expiry date requirements for medicines
UPDATE products 
SET requires_expiry_date = true 
WHERE name ILIKE '%medicine%' OR name ILIKE '%capsule%' OR name ILIKE '%tablet%';

-- Set batch tracking for veterinary supplies
UPDATE products 
SET requires_batch_tracking = true 
WHERE name ILIKE '%injection%' OR name ILIKE '%syringe%';
```

## 👥 User Setup

### Step 6: Create Cashier Users
Create users with cashier role:

```sql
-- Insert cashier role if not exists
INSERT INTO roles (role_name, description) 
VALUES ('cashier', 'Point of Sale Cashier') 
ON CONFLICT (role_name) DO NOTHING;

-- Create cashier user (example)
INSERT INTO users (username, email, first_name, last_name, role)
VALUES ('cashier1', 'cashier1@yourstore.com', 'John', 'Doe', 'cashier');
```

### Step 7: Set Up Staff Records
Link users to staff records:

```sql
-- Create staff record for cashier
INSERT INTO staff (employee_id, first_name, last_name, email, position, department, role)
VALUES ('EMP001', 'John', 'Doe', 'cashier1@yourstore.com', 'Cashier', 'Sales', 'cashier');
```

## 🏪 Branch Configuration

### Step 8: Set Up Branches
Configure your store branches:

```sql
-- Create branch if not exists
INSERT INTO branches (name, address, city, phone, manager_name, is_active)
VALUES ('Main Branch', '123 Main Street', 'Your City', '+63-XXX-XXX-XXXX', 'Manager Name', true);

-- Link staff to branches
UPDATE staff 
SET branch_id = (SELECT id FROM branches WHERE name = 'Main Branch')
WHERE employee_id = 'EMP001';
```

## 🛒 Quick Sale Setup

### Step 9: Configure Quick Sale Items
Set up frequently sold items:

```sql
-- Add quick sale items (example)
INSERT INTO quick_sale_items (product_id, shortcut_name, quantity, sort_order)
SELECT id, name, 1, 1
FROM products 
WHERE name ILIKE '%popular%' OR name ILIKE '%best seller%'
LIMIT 10;
```

## 🧾 Receipt Configuration

### Step 10: Set Up Receipt Templates
Configure receipt templates:

```sql
-- Update default receipt template
UPDATE receipt_templates 
SET header_text = 'YOUR STORE NAME
Your Store Address
Phone: +63-XXX-XXX-XXXX
Email: info@yourstore.com',
    footer_text = 'Thank you for your business!
Visit us again soon!
For inquiries: +63-XXX-XXX-XXXX'
WHERE template_name = 'Standard Receipt';
```

## 🎯 Testing the Setup

### Step 11: Test POS System
1. **Access POS**: Go to your admin dashboard and click "POS System"
2. **Login as Cashier**: Use your cashier credentials
3. **Test Product Search**: Search for products and verify they load correctly
4. **Test Cart**: Add products to cart and verify pricing calculations
5. **Test Payment**: Process a test transaction
6. **Test Receipt**: Generate and verify receipt format

### Step 12: Verify Data Flow
Check that transactions are properly recorded:

```sql
-- Check if transactions are being created
SELECT * FROM pos_transactions ORDER BY created_at DESC LIMIT 5;

-- Check if inventory is being updated
SELECT name, stock_quantity FROM products WHERE stock_quantity < 10;
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: POS System Not Loading
**Solution**: 
- Check browser console for errors
- Verify database connection
- Ensure all migrations are applied

#### Issue: Products Not Showing
**Solution**:
- Check product `is_active` status
- Verify category assignments
- Check product permissions

#### Issue: Payment Processing Errors
**Solution**:
- Verify payment settings in `pos_settings`
- Check digital payment configurations
- Test with cash payments first

#### Issue: Receipt Not Printing
**Solution**:
- Check receipt template configuration
- Verify printer setup
- Test with different receipt formats

## 📞 Support

If you encounter issues during installation:

1. Check the troubleshooting section above
2. Review the main POS System README
3. Contact your system administrator
4. Submit a support ticket with error details

## ✅ Post-Installation Checklist

- [ ] Database migration completed successfully
- [ ] POS settings configured
- [ ] Products configured with proper pricing types
- [ ] Cashier users created and tested
- [ ] Quick sale items set up
- [ ] Receipt templates configured
- [ ] Test transaction completed successfully
- [ ] Staff trained on POS system usage

## 🚀 Next Steps

After successful installation:

1. **Train Staff**: Provide training on POS system usage
2. **Configure Inventory**: Set up proper stock levels and reorder points
3. **Set Up Loyalty Program**: Configure customer loyalty settings
4. **Test All Features**: Verify all POS features work correctly
5. **Go Live**: Start using the POS system for actual transactions

---

**Installation Guide Version**: 1.0.0  
**Compatible with**: POS System v1.0.0  
**Last Updated**: January 2025

