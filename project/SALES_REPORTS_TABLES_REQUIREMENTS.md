# Database Tables Required for Sales Reports in ReportsAnalytics.tsx

## Overview
The Sales tab in `ReportsAnalytics.tsx` generates various sales reports. Based on the `reportsService.ts` implementation, here are the **required database tables** for accurate and complete sales report generation.

---

## 🔴 **Primary Tables (Required)**

### 1. **`pos_transactions`** (Main Sales Transactions Table)
**Purpose**: Stores all sales transaction records - the core data source for sales reports.

create table public.pos_transactions (
  id uuid not null default gen_random_uuid (),
  transaction_number character varying(50) not null,
  pos_session_id uuid not null,
  customer_id uuid null,
  cashier_id uuid not null,
  branch_id uuid null,
  transaction_date timestamp with time zone not null default now(),
  transaction_type character varying(20) not null default 'sale'::character varying,
  subtotal numeric(10, 2) not null default 0.00,
  discount_amount numeric(10, 2) not null default 0.00,
  discount_percentage numeric(5, 2) not null default 0.00,
  tax_amount numeric(10, 2) not null default 0.00,
  total_amount numeric(10, 2) not null default 0.00,
  payment_status character varying(20) not null default 'pending'::character varying,
  status character varying(20) not null default 'active'::character varying,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  transaction_source character varying(20) null default 'pos'::character varying,
  order_id uuid null,
  constraint pos_transactions_pkey primary key (id),
  constraint pos_transactions_transaction_number_key unique (transaction_number),
  constraint pos_transactions_customer_id_fkey foreign KEY (customer_id) references customers (id),
  constraint pos_transactions_order_id_fkey foreign KEY (order_id) references orders (id) on update CASCADE on delete set null,
  constraint pos_transactions_cashier_id_fkey foreign KEY (cashier_id) references users (id),
  constraint pos_transactions_pos_session_id_fkey foreign KEY (pos_session_id) references pos_sessions (id),
  constraint pos_transactions_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint pos_transactions_source_check check (
    (
      (transaction_source)::text = any (
        (
          array[
            'pos'::character varying,
            'pwa'::character varying,
            'delivery'::character varying,
            'online'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_pos_transactions_pos_session_id on public.pos_transactions using btree (pos_session_id) TABLESPACE pg_default;

create index IF not exists idx_pos_transactions_transaction_date on public.pos_transactions using btree (transaction_date) TABLESPACE pg_default;

create index IF not exists idx_pos_transactions_payment_status on public.pos_transactions using btree (payment_status) TABLESPACE pg_default;

create index IF not exists idx_pos_transactions_source on public.pos_transactions using btree (transaction_source) TABLESPACE pg_default;
---

### 2. **`pos_transaction_items`** (Transaction Line Items)
**Purpose**: Stores individual products/items sold in each transaction - needed for product-level and category-level analysis.
create table public.pos_transaction_items (
  id uuid not null default gen_random_uuid (),
  transaction_id uuid not null,
  product_id uuid not null,
  product_name character varying(200) not null,
  product_sku character varying(50) not null,
  quantity numeric(10, 2) not null default 1,
  unit_of_measure character varying(20) not null,
  unit_price numeric(10, 2) not null default 0.00,
  discount_amount numeric(10, 2) not null default 0.00,
  discount_percentage numeric(5, 2) not null default 0.00,
  line_total numeric(10, 2) not null default 0.00,
  weight_kg numeric(10, 3) null,
  expiry_date date null,
  batch_number character varying(50) null,
  created_at timestamp with time zone null default now(),
  constraint pos_transaction_items_pkey primary key (id),
  constraint pos_transaction_items_product_id_fkey foreign KEY (product_id) references products (id),
  constraint pos_transaction_items_transaction_id_fkey foreign KEY (transaction_id) references pos_transactions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pos_transaction_items_transaction_id on public.pos_transaction_items using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_pos_transaction_items_product_id on public.pos_transaction_items using btree (product_id) TABLESPACE pg_default;
---

### 3. **`products`** (Product Master Data)
**Purpose**: Stores product information - needed for product names, SKUs, and category mapping.
create table public.products (
  id uuid not null default gen_random_uuid (),
  sku character varying(50) not null,
  name character varying(200) not null,
  description text null,
  category_id uuid not null,
  brand character varying(100) null,
  unit_of_measure character varying(20) not null,
  weight numeric(10, 3) null,
  dimensions jsonb null,
  is_prescription_required boolean null default false,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  barcode text null,
  supplier_id uuid null,
  image_url text null,
  cost numeric(10, 2) null default 0,
  requires_expiry_date boolean null default false,
  requires_batch_tracking boolean null default false,
  is_quick_sale boolean null default false,
  batch_number character varying(50) null,
  expiry_date date null,
  batch_no character varying(50) null,
  expiration_date date null,
  constraint products_pkey primary key (id),
  constraint products_category_id_fkey foreign KEY (category_id) references categories (id),
  constraint products_supplier_id_fkey foreign KEY (supplier_id) references suppliers (id)
) TABLESPACE pg_default;

create index IF not exists idx_products_batch_no on public.products using btree (batch_no) TABLESPACE pg_default;

create index IF not exists idx_products_expiration_date on public.products using btree (expiration_date) TABLESPACE pg_default;
---

### 4. **`categories`** (Product Categories)
**Purpose**: Product category classification - needed for category-based sales analysis.
create table public.categories (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  description text null,
  parent_id uuid null,
  sort_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_parent_id_fkey foreign KEY (parent_id) references categories (id)
) TABLESPACE pg_default;
---

## 🟡 **Supporting Tables (Highly Recommended)**

### 5. **`branches`** (Branch/Location Information)
**Purpose**: Branch information for multi-location sales reports.
create table public.branches (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  code character varying(10) not null,
  address text not null,
  city character varying(50) not null,
  province character varying(50) not null,
  postal_code character varying(10) null,
  phone character varying(20) null,
  email character varying(255) null,
  manager_id uuid null,
  is_active boolean null default true,
  operating_hours jsonb null,
  created_at timestamp with time zone null default now(),
  branch_type character varying(20) null default 'satellite'::character varying,
  constraint branches_pkey primary key (id),
  constraint branches_manager_id_fkey foreign KEY (manager_id) references users (id),
  constraint branches_branch_type_check check (
    (
      (branch_type)::text = any (
        (
          array[
            'main'::character varying,
            'satellite'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;
---

### 6. **`users`** (Staff/Cashier Information)
**Purpose**: Cashier/staff information for sales reports.
create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  email character varying(255) not null,
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  phone character varying(20) null,
  branch_id uuid null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_login timestamp with time zone null,
  last_activity timestamp with time zone null,
  status character varying(20) null default 'offline'::character varying,
  current_session_id uuid null,
  timezone character varying(50) null,
  preferred_language character varying(10) null,
  role character varying(50) null default 'staff'::character varying,
  account_status character varying(20) null default 'active'::character varying,
  mfa_enabled boolean null default false,
  mfa_secret character varying(255) null,
  mfa_backup_codes text null,
  last_password_reset timestamp with time zone null,
  password_reset_token character varying(255) null,
  password_reset_expires timestamp with time zone null,
  password_hash character varying(255) null,
  email_verified boolean null default false,
  email_verification_token character varying(255) null,
  user_type character varying(20) null default 'staff'::character varying,
  password_salt character varying(255) null,
  failed_login_attempts integer null default 0,
  locked_until timestamp with time zone null,
  deleted_at timestamp with time zone null,
  verification_token character varying(255) null,
  token_expiry timestamp with time zone null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_email_unique unique (email),
  constraint fk_users_branch_id foreign KEY (branch_id) references branches (id),
  constraint users_account_status_check check (
    (
      (account_status)::text = any (
        (
          array[
            'active'::character varying,
            'inactive'::character varying,
            'suspended'::character varying,
            'pending_activation'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists idx_users_verification_token on public.users using btree (verification_token) TABLESPACE pg_default;

create index IF not exists idx_users_token_expiry on public.users using btree (token_expiry) TABLESPACE pg_default;
---

### 7. **`customers`** (Customer Information)
**Purpose**: Customer data for customer-focused sales analysis.
create table public.customers (
  id uuid not null default gen_random_uuid (),
  customer_number character varying(20) not null,
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  email character varying(255) null,
  phone character varying(20) null,
  address text null,
  city character varying(50) null,
  province character varying(50) null,
  customer_type character varying(20) not null default 'regular'::character varying,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  customer_code character varying(20) null,
  date_of_birth date null,
  registration_date timestamp with time zone null default now(),
  total_spent numeric(12, 2) null default 0.00,
  last_purchase_date timestamp with time zone null,
  loyalty_points integer null default 0,
  loyalty_tier character varying(20) null default 'bronze'::character varying,
  total_lifetime_spent numeric(12, 2) null default 0.00,
  is_guest boolean null default false,
  guest_session_id character varying(255) null,
  updated_at timestamp with time zone null default now(),
  preferred_branch_id uuid null,
  user_id uuid null,
  postal_code integer null,
  constraint customers_pkey primary key (id),
  constraint customers_customer_number_key unique (customer_number),
  constraint customers_email_key unique (email),
  constraint customers_customer_code_key unique (customer_code),
  constraint customers_user_id_key unique (user_id),
  constraint customers_preferred_branch_id_fkey foreign KEY (preferred_branch_id) references branches (id),
  constraint customers_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;
---

## 📊 **Sales Report Types & Their Data Requirements**

### **1. Daily Sales Summary** (`daily_sales_summary`)
**Tables Used**:
- ✅ `pos_transactions` (main data)
- ✅ `branches` (for branch names)
- ✅ `users` (for cashier names)
- ✅ `customers` (for customer names)

**Data Fields**:
- Transaction dates, amounts, payment status
- Branch and cashier information
- Customer information (if applicable)

---

### **2. Monthly Sales Report** (`monthly_sales_report`)
**Tables Used**:
- ✅ `pos_transactions` (main data)
- ✅ `branches` (for branch filtering/grouping)
- ✅ `users` (for cashier information)
- ✅ `customers` (for customer information)

**Data Fields**:
- Aggregated transaction data by month
- Revenue totals, transaction counts
- Branch and staff performance

---

### **3. Product Performance Report** (`product_performance`)
**Tables Used**:
- ✅ `pos_transactions` (to get transaction IDs)
- ✅ `pos_transaction_items` (to get product sales data)
- ✅ `products` (to get product names, SKUs, categories)

**Data Fields**:
- Product sales aggregated by product_id
- Total quantity sold per product
- Total revenue per product
- Transaction count per product

**Aggregation Logic**:
```javascript
// Groups by product_id, sums:
// - total_quantity (sum of quantity)
// - total_revenue (sum of line_total)
// - transaction_count (count of unique transactions)
```

---

### **4. Sales by Category Report** (`sales_by_category`)
**Tables Used**:
- ✅ `pos_transactions` (to get transaction IDs)
- ✅ `pos_transaction_items` (to get line items)
- ✅ `products` (to get category_id)
- ✅ `categories` (to get category names)

**Data Fields**:
- Sales aggregated by product category
- Total revenue per category
- Transaction count per category

**Aggregation Logic**:
```javascript
// Flow:
// 1. Get transactions
// 2. Get transaction_items for those transactions
// 3. Map product_id → category_id via products table
// 4. Map category_id → category_name via categories table
// 5. Group by category_name, sum line_total
```

---

## 📋 **Summary: Required Tables Checklist**

| Table | Priority | Used In Reports | Required Columns |
|-------|----------|----------------|------------------|
| `pos_transactions` | **CRITICAL** | All sales reports | id, transaction_number, transaction_date, total_amount, subtotal, tax_amount, payment_status, transaction_type, status, branch_id, cashier_id, customer_id |
| `pos_transaction_items` | **CRITICAL** | Product Performance, Sales by Category | id, transaction_id, product_id, quantity, unit_price, line_total, product_name |
| `products` | **CRITICAL** | Product Performance, Sales by Category | id, name, sku, category_id, is_active |
| `categories` | **CRITICAL** | Sales by Category | id, name |
| `branches` | **IMPORTANT** | All reports (filtering/naming) | id, name, is_active |
| `users` | **IMPORTANT** | All reports (cashier info) | id, first_name, last_name |
| `customers` | **OPTIONAL** | All reports (customer info) | id, first_name, last_name |

---

## 🔍 **Database Query Examples**

### Example 1: Daily Sales Summary Query
```sql
SELECT 
  t.id,
  t.transaction_number,
  t.transaction_date,
  t.total_amount,
  t.subtotal,
  t.tax_amount,
  t.payment_status,
  b.name AS branch_name,
  u.first_name || ' ' || u.last_name AS cashier_name,
  c.first_name || ' ' || c.last_name AS customer_name
FROM pos_transactions t
LEFT JOIN branches b ON t.branch_id = b.id
LEFT JOIN users u ON t.cashier_id = u.id
LEFT JOIN customers c ON t.customer_id = c.id
WHERE t.transaction_type = 'sale'
  AND t.status = 'active'
  AND t.transaction_date >= '2024-01-01'
  AND t.transaction_date <= '2024-01-31'
ORDER BY t.transaction_date DESC;
```

### Example 2: Product Performance Query
```sql
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  SUM(ti.quantity) AS total_quantity,
  SUM(ti.line_total) AS total_revenue,
  COUNT(DISTINCT ti.transaction_id) AS transaction_count
FROM pos_transaction_items ti
JOIN products p ON ti.product_id = p.id
JOIN pos_transactions t ON ti.transaction_id = t.id
WHERE t.transaction_type = 'sale'
  AND t.status = 'active'
  AND t.transaction_date >= '2024-01-01'
  AND t.transaction_date <= '2024-01-31'
GROUP BY p.id, p.name, p.sku
ORDER BY total_revenue DESC;
```

### Example 3: Sales by Category Query
```sql
SELECT 
  cat.name AS category_name,
  SUM(ti.line_total) AS total_revenue,
  COUNT(DISTINCT ti.transaction_id) AS transaction_count
FROM pos_transaction_items ti
JOIN products p ON ti.product_id = p.id
JOIN categories cat ON p.category_id = cat.id
JOIN pos_transactions t ON ti.transaction_id = t.id
WHERE t.transaction_type = 'sale'
  AND t.status = 'active'
  AND t.transaction_date >= '2024-01-01'
  AND t.transaction_date <= '2024-01-31'
GROUP BY cat.id, cat.name
ORDER BY total_revenue DESC;
```

---

## ⚠️ **Important Considerations**

### 1. **Transaction Status Filtering**
- Reports filter for `transaction_type = 'sale'` and `status = 'active'`
- Ensure these columns exist and are indexed for performance

### 2. **Payment Status**
- Reports may filter by `payment_status IN ('paid', 'completed')`
- Ensure consistent payment status values

### 3. **Date Filtering**
- All reports support date range filtering (`dateRangeStart`, `dateRangeEnd`)
- Ensure `transaction_date` is indexed for performance on date range queries

### 4. **Foreign Key Relationships**
- Proper foreign keys ensure data integrity
- Enables JOIN queries for related data (branches, users, customers, products, categories)

### 5. **NULL Handling**
- `customer_id` can be NULL (for walk-in sales)
- Use LEFT JOIN for optional relationships

---

## ✅ **Verification Checklist**

Before generating sales reports, verify:

- [ ] `pos_transactions` table exists with all required columns
- [ ] `pos_transaction_items` table exists with all required columns
- [ ] `products` table exists with `category_id` column
- [ ] `categories` table exists
- [ ] Foreign keys are properly set up
- [ ] Indexes exist on frequently queried columns:
  - [ ] `pos_transactions.transaction_date`
  - [ ] `pos_transactions.transaction_type`
  - [ ] `pos_transactions.status`
  - [ ] `pos_transactions.branch_id`
  - [ ] `pos_transaction_items.transaction_id`
  - [ ] `pos_transaction_items.product_id`
  - [ ] `products.category_id`
- [ ] Sample data exists for testing

---

## 🚀 **Next Steps**

1. **Verify Tables Exist**: Run `SELECT` queries to confirm all tables exist
2. **Check Column Names**: Ensure column names match exactly (case-sensitive in some databases)
3. **Test Queries**: Run the example queries above with your data
4. **Add Indexes**: Create indexes on foreign keys and frequently filtered columns
5. **Populate Sample Data**: Add test transactions and items for validation

---

## 📝 **Notes**

- The actual table names in your database may differ slightly (e.g., `sales_transactions` vs `pos_transactions`)
- If your table structure differs, you'll need to update the queries in `reportsService.ts`
- All monetary values should be stored as DECIMAL/NUMERIC for precision
- Consider adding `created_at` and `updated_at` timestamps to all tables for audit trails

---

## ✅ **COMPATIBILITY ANALYSIS**

Based on your provided database schemas, here's the compatibility check:

### **Overall Status: ✅ FULLY COMPATIBLE**

Your database tables match all the requirements for Sales Reports! Here's the detailed analysis:

---

### **1. `pos_transactions` Table ✅ PERFECT MATCH**

| Required Column | Your Schema | Status |
|----------------|-------------|--------|
| `id` | ✅ `uuid` (PRIMARY KEY) | ✅ Match |
| `transaction_number` | ✅ `character varying(50)` | ✅ Match |
| `transaction_date` | ✅ `timestamp with time zone` | ✅ Match |
| `total_amount` | ✅ `numeric(10, 2)` | ✅ Match |
| `subtotal` | ✅ `numeric(10, 2)` | ✅ Match |
| `tax_amount` | ✅ `numeric(10, 2)` | ✅ Match |
| `payment_status` | ✅ `character varying(20)` | ✅ Match |
| `transaction_type` | ✅ `character varying(20)` (default 'sale') | ✅ Match |
| `status` | ✅ `character varying(20)` (default 'active') | ✅ Match |
| `branch_id` | ✅ `uuid` (FOREIGN KEY → branches) | ✅ Match |
| `cashier_id` | ✅ `uuid` (FOREIGN KEY → users) | ✅ Match |
| `customer_id` | ✅ `uuid` (NULLABLE, FOREIGN KEY → customers) | ✅ Match |

**Indexes Present:**
- ✅ `idx_pos_transactions_transaction_date` - Critical for date filtering
- ✅ `idx_pos_transactions_payment_status` - Good for payment filtering

**Recommendations:**
- ⚠️ **Add index on `transaction_type`** for better filtering performance:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_pos_transactions_transaction_type 
  ON pos_transactions(transaction_type);
  ```
- ⚠️ **Add index on `status`** for active transactions filtering:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_pos_transactions_status 
  ON pos_transactions(status);
  ```
- ⚠️ **Add composite index** for common queries:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_pos_transactions_type_status_date 
  ON pos_transactions(transaction_type, status, transaction_date);
  ```

---

### **2. `pos_transaction_items` Table ✅ PERFECT MATCH**

| Required Column | Your Schema | Status |
|----------------|-------------|--------|
| `id` | ✅ `uuid` (PRIMARY KEY) | ✅ Match |
| `transaction_id` | ✅ `uuid` (FOREIGN KEY → pos_transactions) | ✅ Match |
| `product_id` | ✅ `uuid` (FOREIGN KEY → products) | ✅ Match |
| `quantity` | ✅ `numeric(10, 2)` | ✅ Match |
| `unit_price` | ✅ `numeric(10, 2)` | ✅ Match |
| `line_total` | ✅ `numeric(10, 2)` | ✅ Match |
| `product_name` | ✅ `character varying(200)` | ✅ Match |

**Indexes Present:**
- ✅ `idx_pos_transaction_items_transaction_id` - Critical for joining
- ✅ `idx_pos_transaction_items_product_id` - Critical for product analysis

**Status:** ✅ **All required columns present and indexed!**

---

### **3. `products` Table ✅ PERFECT MATCH**

| Required Column | Your Schema | Status |
|----------------|-------------|--------|
| `id` | ✅ `uuid` (PRIMARY KEY) | ✅ Match |
| `name` | ✅ `character varying(200)` | ✅ Match |
| `sku` | ✅ `character varying(50)` | ✅ Match |
| `category_id` | ✅ `uuid` (FOREIGN KEY → categories) | ✅ Match |
| `is_active` | ✅ `boolean` (default true) | ✅ Match |

**Recommendations:**
- ⚠️ **Add index on `category_id`** for category-based queries:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_products_category_id 
  ON products(category_id);
  ```
- ⚠️ **Add index on `is_active`** if filtering active products:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_products_is_active 
  ON products(is_active) WHERE is_active = true;
  ```

---

### **4. `categories` Table ✅ PERFECT MATCH**

| Required Column | Your Schema | Status |
|----------------|-------------|--------|
| `id` | ✅ `uuid` (PRIMARY KEY) | ✅ Match |
| `name` | ✅ `character varying(100)` | ✅ Match |

**Status:** ✅ **All required columns present!**

**Recommendations:**
- ✅ Optional: Add index on `name` if frequently searched:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_categories_name 
  ON categories(name);
  ```

---

### **5. `branches` Table ✅ PERFECT MATCH**

| Required Column | Your Schema | Status |
|----------------|-------------|--------|
| `id` | ✅ `uuid` (PRIMARY KEY) | ✅ Match |
| `name` | ✅ `character varying(100)` | ✅ Match |
| `is_active` | ✅ `boolean` (default true) | ✅ Match |

**Status:** ✅ **All required columns present!**

---

### **6. `users` Table ✅ PERFECT MATCH**

| Required Column | Your Schema | Status |
|----------------|-------------|--------|
| `id` | ✅ `uuid` (PRIMARY KEY) | ✅ Match |
| `first_name` | ✅ `character varying(100)` | ✅ Match |
| `last_name` | ✅ `character varying(100)` | ✅ Match |

**Status:** ✅ **All required columns present!**

---

### **7. `customers` Table ✅ PERFECT MATCH**

| Required Column | Your Schema | Status |
|----------------|-------------|--------|
| `id` | ✅ `uuid` (PRIMARY KEY) | ✅ Match |
| `first_name` | ✅ `character varying(100)` | ✅ Match |
| `last_name` | ✅ `character varying(100)` | ✅ Match |

**Status:** ✅ **All required columns present!**

---

## 🎯 **Final Compatibility Summary**

### ✅ **CRITICAL TABLES: 100% COMPATIBLE**
- ✅ `pos_transactions` - All required columns present
- ✅ `pos_transaction_items` - All required columns present
- ✅ `products` - All required columns present
- ✅ `categories` - All required columns present

### ✅ **SUPPORTING TABLES: 100% COMPATIBLE**
- ✅ `branches` - All required columns present
- ✅ `users` - All required columns present
- ✅ `customers` - All required columns present

### ⚠️ **OPTIMIZATION RECOMMENDATIONS**

To improve query performance, consider adding these indexes:

```sql
-- For pos_transactions filtering
CREATE INDEX IF NOT EXISTS idx_pos_transactions_transaction_type 
ON pos_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_pos_transactions_status 
ON pos_transactions(status);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_pos_transactions_type_status_date 
ON pos_transactions(transaction_type, status, transaction_date);

-- For products category queries
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id);

-- Optional: Filtered index for active products
CREATE INDEX IF NOT EXISTS idx_products_is_active 
ON products(is_active) WHERE is_active = true;
```

---

## ✅ **READY FOR PRODUCTION**

**Your database schema is fully compatible with the Sales Reports functionality!**

All required tables and columns are present. The only recommendations are performance optimizations (additional indexes) which are optional but highly recommended for better query performance with large datasets.

**Next Steps:**
1. ✅ Your tables are ready - no schema changes needed
2. ⚠️ Consider adding the recommended indexes for performance
3. ✅ Test report generation with your actual data
4. ✅ Verify foreign key relationships are working correctly

---

## 🧪 **Quick Test Queries**

Run these queries to verify your setup:

```sql
-- Test 1: Verify transactions can be filtered
SELECT COUNT(*) 
FROM pos_transactions 
WHERE transaction_type = 'sale' AND status = 'active';

-- Test 2: Verify transaction items join correctly
SELECT COUNT(*) 
FROM pos_transaction_items ti
JOIN pos_transactions t ON ti.transaction_id = t.id
WHERE t.transaction_type = 'sale' AND t.status = 'active';

-- Test 3: Verify product-category mapping works
SELECT COUNT(*) 
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true;
```

All tests should return positive counts if your data is populated correctly.

