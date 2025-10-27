# POS Sales Service Documentation

This document explains the comprehensive sales data service that fetches and analyzes sales information from the POS transaction tables.

## Overview

The POS Sales Service provides a complete suite of functions to fetch, analyze, and report on sales data from the POS system. It integrates with the following database tables:

- `pos_transactions` - Main transaction records
- `pos_transaction_items` - Individual items in each transaction
- `pos_payments` - Payment information for transactions
- `pos_sessions` - POS session data
- `branches` - Branch information
- `users` - Cashier/staff information
- `customers` - Customer information

## Database Schema Integration

### pos_transactions
- Stores transaction details including totals, discounts, taxes, and payment status
- Links to sessions, cashiers, branches, and customers
- Supports different transaction types (sale, return, exchange)

### pos_transaction_items
- Stores individual product line items for each transaction
- Includes product details, quantities, prices, and discounts
- Supports weight-based products and batch tracking

### pos_payments
- Stores payment method details for each transaction
- Tracks payment amounts, change given, and payment status
- Supports multiple payment methods per transaction

## Core Functions

### 1. Sales Summary
```typescript
getSalesSummary(startDate: string, endDate: string, branchId?: string): Promise<SalesSummary>
```

**Returns:**
- Total sales amount
- Total number of transactions
- Total discounts given
- Total taxes collected
- Average transaction value
- Total items sold

### 2. Sales by Period
```typescript
getSalesByPeriod(startDate: string, endDate: string, period: 'day' | 'week' | 'month', branchId?: string): Promise<SalesByPeriod[]>
```

**Features:**
- Flexible period grouping (daily, weekly, monthly)
- Automatic date range handling
- Branch-specific filtering
- Sorted chronological results

### 3. Top Products
```typescript
getTopProducts(startDate: string, endDate: string, limit: number = 10, branchId?: string): Promise<TopProduct[]>
```

**Returns:**
- Product ID, name, and SKU
- Total quantity sold
- Total revenue generated
- Number of transactions
- Sorted by revenue (highest first)

### 4. Sales by Branch
```typescript
getSalesByBranch(startDate: string, endDate: string): Promise<SalesByBranch[]>
```

**Features:**
- Branch performance comparison
- Total sales and transaction counts
- Average transaction values
- Sorted by sales performance

### 5. Sales by Cashier
```typescript
getSalesByCashier(startDate: string, endDate: string, branchId?: string): Promise<SalesByCashier[]>
```

**Returns:**
- Cashier performance metrics
- Sales totals and transaction counts
- Average transaction values
- Staff performance ranking

### 6. Payment Method Analysis
```typescript
getPaymentMethodSummary(startDate: string, endDate: string, branchId?: string): Promise<PaymentMethodSummary[]>
```

**Features:**
- Payment method distribution
- Amount and transaction counts
- Percentage breakdowns
- Payment trend analysis

## Advanced Analytics

### 1. Sales Comparison
```typescript
getSalesComparison(currentStart: string, currentEnd: string, previousStart: string, previousEnd: string, branchId?: string)
```

**Returns:**
- Current vs previous period data
- Growth percentages for sales, transactions, and averages
- Performance trend analysis

### 2. Hourly Sales Distribution
```typescript
getHourlySales(date: string, branchId?: string): Promise<{ [hour: string]: number }>
```

**Features:**
- 24-hour sales breakdown
- Peak hour identification
- Business hour analysis
- Staff scheduling insights

### 3. Sales Trends
```typescript
getSalesTrends(days: number = 30, branchId?: string): Promise<SalesByPeriod[]>
```

**Returns:**
- Daily sales for specified period
- Trend analysis data
- Performance patterns
- Seasonal insights

### 4. Low Performing Products
```typescript
getLowPerformingProducts(startDate: string, endDate: string, threshold: number = 5, branchId?: string): Promise<TopProduct[]>
```

**Features:**
- Identifies underperforming products
- Configurable threshold settings
- Inventory optimization insights
- Product lifecycle analysis

### 5. Refund Statistics
```typescript
getRefundStats(startDate: string, endDate: string, branchId?: string)
```

**Returns:**
- Total refunds and amounts
- Return statistics
- Refund rate calculations
- Quality control metrics

## Dashboard Integration

### Updated Components

#### SalesChart Component
- Now uses real POS transaction data
- Monthly sales and order trends
- Automatic data fetching and caching
- Error handling and loading states

#### SalesByProduct Component
- Real product performance data
- Revenue and quantity metrics
- Visual progress bars
- Top 10 product ranking

#### SalesByBranch Component
- Branch performance comparison
- Sales distribution analysis
- Transaction volume metrics
- Multi-branch support

## Usage Examples

### Basic Sales Summary
```typescript
import { posSalesService } from './lib/posSalesService';

// Get today's sales
const todaysSales = await posSalesService.getTodaysSales();

// Get this month's sales
const monthlySales = await posSalesService.getThisMonthsSales();

// Get custom date range
const customSales = await posSalesService.getSalesSummary('2024-01-01', '2024-01-31');
```

### Product Analysis
```typescript
// Get top 10 products for last 30 days
const topProducts = await posSalesService.getTopProducts(
  '2024-01-01',
  '2024-01-31',
  10
);

// Get low performing products
const lowProducts = await posSalesService.getLowPerformingProducts(
  '2024-01-01',
  '2024-01-31',
  5 // threshold: less than 5 units sold
);
```

### Branch Performance
```typescript
// Compare branch performance
const branchSales = await posSalesService.getSalesByBranch(
  '2024-01-01',
  '2024-01-31'
);

// Get cashier performance for specific branch
const cashierSales = await posSalesService.getSalesByCashier(
  '2024-01-01',
  '2024-01-31',
  'branch-id'
);
```

### Payment Analysis
```typescript
// Analyze payment methods
const paymentMethods = await posSalesService.getPaymentMethodSummary(
  '2024-01-01',
  '2024-01-31'
);

// Get recent transactions
const recentTransactions = await posSalesService.getRecentTransactions(20);
```

## Performance Optimizations

### Database Queries
- Efficient joins with related tables
- Proper indexing on date and status fields
- Optimized aggregation queries
- Minimal data transfer

### Caching Strategy
- Component-level data caching
- Automatic refresh on date changes
- Error state management
- Loading state indicators

### Error Handling
- Graceful degradation on API failures
- User-friendly error messages
- Automatic retry mechanisms
- Fallback data display

## Testing

### Test Script
Use the provided test script to verify functionality:

```bash
node test-sales-service.js
```

### Test Coverage
- Sales summary calculations
- Product performance metrics
- Branch comparison data
- Payment method analysis
- Date range filtering
- Error handling scenarios

## Configuration

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Database Requirements
Ensure the following tables exist with proper relationships:
- `pos_transactions` with indexes on `transaction_date`, `payment_status`
- `pos_transaction_items` with indexes on `transaction_id`, `product_id`
- `pos_payments` with indexes on `transaction_id`, `payment_method`
- `branches`, `users`, `customers` tables for joins

## Security Considerations

- Row Level Security (RLS) policies applied
- Branch-specific data filtering
- User permission validation
- Secure API endpoints
- Data privacy compliance

## Future Enhancements

- Real-time sales monitoring
- Advanced forecasting algorithms
- Custom report generation
- Export functionality (PDF, Excel)
- Mobile-optimized dashboards
- Integration with external analytics tools
- Automated alerting system
- Performance benchmarking

## Troubleshooting

### Common Issues

1. **No Data Returned**
   - Check date range format (YYYY-MM-DD)
   - Verify branch ID exists
   - Ensure transactions have correct status

2. **Slow Performance**
   - Check database indexes
   - Optimize date range queries
   - Consider data pagination

3. **Missing Relationships**
   - Verify foreign key constraints
   - Check join table data
   - Validate user permissions

### Debug Mode
Enable detailed logging by setting:
```typescript
console.log('🔍 [Sales] Debug mode enabled');
```

This comprehensive sales service provides all the tools needed for effective sales analysis and business intelligence in the POS system.
