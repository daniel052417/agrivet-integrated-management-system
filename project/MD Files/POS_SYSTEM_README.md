# Agrivet POS System

A comprehensive Point of Sale (POS) system designed specifically for agrivet businesses, featuring specialized handling for agricultural products, veterinary supplies, and customer management.

## 🚀 Features

### Core POS Functionality
- **Touch-friendly Interface**: Optimized for tablets and touch terminals
- **Product Search & Selection**: Advanced search with filters and categories
- **Shopping Cart Management**: Real-time quantity adjustments and pricing
- **Payment Processing**: Cash and digital payment support (GCash, PayMaya, etc.)
- **Receipt Generation**: Customizable receipt templates with multiple output options
- **Quick Sale Shortcuts**: Fast access to frequently sold items

### Agricultural Product Handling
- **Weight-based Pricing**: Feeds and fertilizers sold by kg (unless in bags/sacks)
- **Veterinary Supplies**: 
  - Medicines sold by piece (capsules) or sachets (unless in boxes)
  - Liquid medicines sold by syringe (unless in glass vials)
- **Expiry Date Tracking**: Required for medicines and perishables
- **Batch/Lot Tracking**: For quality control and recalls
- **Bulk Discounts**: Automatic bulk pricing for large quantities

### Customer Management
- **Customer Lookup**: Search by name, code, email, or phone
- **Loyalty Program**: Points-based rewards system with tier benefits
- **Quick Registration**: On-the-spot customer creation during checkout
- **Purchase History**: Complete transaction history display
- **Customer Types**: Individual, Business, Veterinarian, Farmer

### Payment Methods
- **Cash Payments**: With automatic change calculation
- **Digital Payments**: GCash, PayMaya, GrabPay, BPI, BDO, Metrobank
- **Split Payments**: Multiple payment methods per transaction
- **Payment Validation**: Real-time payment confirmation

### Real-time Analytics
- **Live Dashboard**: Real-time sales monitoring
- **Performance Metrics**: Transaction counts, averages, and trends
- **Top Products**: Best-selling items tracking
- **Payment Analytics**: Payment method breakdown
- **Low Stock Alerts**: Automatic inventory warnings

### Staff Management
- **Cashier Authentication**: Secure login system
- **Session Management**: Opening/closing procedures with cash tracking
- **Role-based Access**: Different permissions for different staff levels
- **Performance Tracking**: Individual cashier metrics

## 🏗️ Architecture

### Database Schema
The POS system extends the existing agrivet database with specialized tables:

- `pos_sessions`: Cashier shift management
- `pos_transactions`: Transaction records
- `pos_transaction_items`: Individual line items
- `pos_payments`: Payment method tracking
- `product_variants`: Product variations and pricing
- `quick_sale_items`: Frequently sold items shortcuts
- `receipt_templates`: Customizable receipt formats
- `customer_loyalty_points`: Loyalty program tracking

### Component Structure
```
src/POS/
├── components/
│   ├── POSInterface.tsx          # Main POS interface
│   ├── POSHeader.tsx             # Header with session info
│   ├── ProductSearch.tsx         # Product search and selection
│   ├── ShoppingCart.tsx          # Cart management
│   ├── PaymentProcessing.tsx     # Payment handling
│   ├── CustomerLookup.tsx        # Customer management
│   ├── QuickSaleShortcuts.tsx    # Quick sale items
│   ├── AgrivetProductHandler.tsx # Specialized product handling
│   ├── ReceiptGenerator.tsx      # Receipt creation
│   └── POSDashboard.tsx          # Real-time analytics
├── types/
│   └── pos.ts                    # TypeScript definitions
└── POS_SYSTEM_README.md          # This documentation
```

## 🎯 Usage

### Accessing the POS System
1. **From Admin Dashboard**: Click the "POS System" button in the header
2. **Direct Access**: Add `?pos=true` to the URL
3. **Cashier Role**: Users with 'cashier' role automatically access POS

### Starting a Session
1. Cashier logs in and POS session automatically initializes
2. System tracks session start time and cashier information
3. Session remains active until manually closed

### Processing a Sale
1. **Search Products**: Use the product search or quick sale shortcuts
2. **Add to Cart**: Select quantity/weight and any required tracking info
3. **Select Customer**: Optional customer lookup and selection
4. **Process Payment**: Choose payment method and complete transaction
5. **Generate Receipt**: Print, email, or SMS receipt to customer

### Specialized Product Handling
- **Feeds**: Automatically detected for weight-based pricing
- **Medicines**: Expiry date and batch tracking required
- **Veterinary Supplies**: Proper unit of measure handling

## 🔧 Configuration

### POS Settings
Configure system-wide settings in the `pos_settings` table:

- `default_tax_rate`: Default tax rate (12%)
- `currency_symbol`: Currency symbol (₱)
- `receipt_footer`: Default receipt footer text
- `enable_loyalty_program`: Enable/disable loyalty points
- `loyalty_points_per_peso`: Points earned per peso spent
- `enable_digital_payments`: Enable digital payment methods
- `auto_print_receipt`: Automatically print receipts
- `low_stock_threshold`: Low stock alert threshold

### Product Configuration
Products can be configured with:
- `pos_pricing_type`: 'fixed', 'weight_based', or 'bulk'
- `requires_expiry_date`: For medicines and perishables
- `requires_batch_tracking`: For quality control
- `is_quick_sale`: Include in quick sale shortcuts

## 📊 Reporting

### Real-time Dashboard
- Total sales and transaction counts
- Average transaction value
- Top-selling products
- Payment method breakdown
- Low stock alerts
- Session duration and performance

### Transaction Reports
- Complete transaction history
- Customer purchase patterns
- Product performance metrics
- Payment method analytics
- Staff performance tracking

## 🔒 Security

### Authentication
- Secure cashier login system
- Session-based authentication
- Role-based access control

### Data Protection
- PCI DSS compliance for payment processing
- Encrypted sensitive information
- Audit trail for all transactions
- User activity logging

### Backup & Recovery
- Automatic data synchronization
- Local data storage for offline capability
- Conflict resolution for concurrent edits

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed
- Supabase database configured
- Existing agrivet system running

### Installation
1. The POS system is already integrated into the existing project
2. Run the database migration: `20250115000000_pos_system_schema.sql`
3. Access the system via the admin dashboard or direct URL

### First Time Setup
1. Configure POS settings in the database
2. Set up product categories and pricing types
3. Create quick sale shortcuts for common items
4. Configure receipt templates
5. Set up loyalty program parameters

## 🎨 Customization

### Receipt Templates
- Customizable header and footer text
- Logo integration
- Tax breakdown display
- Payment method information
- Cashier information

### Quick Sale Items
- Configure frequently sold products
- Set default quantities
- Add keyboard shortcuts
- Organize by priority

### Product Categories
- Create category-specific pricing rules
- Set default units of measure
- Configure tracking requirements
- Define bulk discount thresholds

## 📱 Mobile Optimization

The POS system is fully responsive and optimized for:
- Tablets (iPad, Android tablets)
- Touch terminals
- Mobile devices
- Desktop computers

## 🔄 Integration

### Existing System Integration
- Seamless integration with existing inventory management
- Real-time stock updates
- Customer data synchronization
- Staff management integration
- Multi-branch support

### External Integrations
- Digital payment gateways
- Receipt printers
- Barcode scanners (future enhancement)
- Accounting systems
- CRM systems

## 🐛 Troubleshooting

### Common Issues
1. **Session not initializing**: Check cashier permissions and database connection
2. **Products not loading**: Verify product data and category setup
3. **Payment processing errors**: Check payment gateway configuration
4. **Receipt printing issues**: Verify printer setup and template configuration

### Support
For technical support and feature requests, please contact the development team.

## 📈 Future Enhancements

### Planned Features
- Barcode scanning support
- Voice commands
- Advanced reporting and analytics
- Multi-language support
- Offline mode improvements
- Mobile app companion
- Advanced inventory management
- Supplier integration
- Automated reordering

### API Development
- RESTful API for external integrations
- Webhook support for real-time updates
- Third-party app integration
- Custom reporting tools

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Compatibility**: Agrivet Integrated Management System v2.0+

