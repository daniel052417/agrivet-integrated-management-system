# Real Checkout System Setup Guide

## Overview

The checkout system has been updated to work with real Supabase data and only supports cash payments. Demo mode has been removed, and all services now require proper Supabase configuration.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with the complete checkout system database schema
2. **Environment Variables**: Proper configuration of Supabase environment variables
3. **Database Migration**: The complete checkout system migration must be applied

## Setup Steps

### 1. Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Example:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Apply Database Migration

Run the complete checkout system migration in your Supabase SQL editor:

```sql
-- Execute the complete_checkout_system_migration.sql file
-- This will create all necessary tables, indexes, and sample data
```

### 3. Verify Database Setup

After running the migration, verify that the following tables exist:
- `payment_methods` (with cash payment method)
- `payments`
- `payment_transactions`
- `order_tracking`
- `order_status_history`
- `email_notifications`
- `email_templates`
- `inventory_transactions`

### 4. Test the System

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the checkout page** and verify:
   - Payment methods load correctly (only cash should be available)
   - Order creation works without errors
   - Database records are created properly
   - Email notifications are sent (if email is provided)

## Features Available

### ✅ Real Payment Processing
- **Cash Payments Only**: System only supports cash payments
- **Payment Records**: All payments are stored in the database
- **Payment Tracking**: Complete payment transaction history

### ✅ Order Persistence
- **Database Storage**: All orders are saved to Supabase
- **Order Details**: Complete order information with customer data
- **Order Items**: Detailed order items with product information

### ✅ Email Notifications
- **Order Confirmation**: Automatic confirmation emails
- **Order Ready**: Notifications when orders are ready
- **Order Cancellation**: Cancellation notifications
- **Template System**: Configurable email templates

### ✅ Inventory Management
- **Real-time Updates**: Live inventory management
- **Automatic Deduction**: Inventory deducted on order placement
- **Transaction Logging**: Complete audit trail
- **Stock Validation**: Prevents overselling

### ✅ Order Tracking
- **Status Updates**: Real-time order status tracking
- **Tracking Numbers**: Unique tracking for each order
- **History Logging**: Complete order history

## Error Handling

### Configuration Errors
If Supabase is not properly configured, the system will show:
- Loading state while initializing services
- Clear error messages with setup instructions
- Graceful failure with helpful guidance

### Service Errors
- **Database Errors**: Detailed error messages for database issues
- **Payment Errors**: Clear feedback for payment processing issues
- **Email Errors**: Logged but don't block order creation
- **Inventory Errors**: Logged but don't block order creation

## Troubleshooting

### Common Issues

1. **"Supabase configuration is missing"**
   - Check that environment variables are set correctly
   - Verify the `.env.local` file is in the project root
   - Restart the development server after adding environment variables

2. **"Payment method not found"**
   - Ensure the database migration was run completely
   - Check that the `payment_methods` table has a cash payment method
   - Verify the payment method is active

3. **"Failed to create order"**
   - Check database connection
   - Verify all required tables exist
   - Check RLS policies are properly configured

4. **"Failed to load payment methods"**
   - Verify Supabase URL and key are correct
   - Check network connectivity
   - Ensure payment_methods table exists and has data

### Debug Mode

To enable debug logging, add this to your `.env.local`:
```env
VITE_DEBUG=true
```

This will show detailed console logs for all service operations.

## Production Deployment

### Environment Variables
Set the following environment variables in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Database Security
- Ensure RLS policies are properly configured
- Review and test all database permissions
- Set up proper backup procedures

### Email Configuration
- Configure SMTP settings for email notifications
- Test email delivery in production
- Set up email monitoring

## Support

If you encounter issues:

1. **Check the console** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Check database connectivity** in Supabase dashboard
4. **Review the migration** was applied completely
5. **Test with a simple order** to isolate issues

## Next Steps

Once the basic cash payment system is working:

1. **Add Digital Payments**: Integrate GCash, PayMaya, or other payment gateways
2. **Enhanced Email**: Configure SMTP for real email delivery
3. **SMS Notifications**: Add SMS notifications for order updates
4. **Advanced Analytics**: Implement order and payment analytics
5. **Mobile App**: Create mobile app with the same checkout system

The system is now ready for real-world use with cash payments and full database integration!
