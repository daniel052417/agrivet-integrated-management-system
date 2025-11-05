# Database Tables Required for Financial Reports in ReportsAnalytics.tsx

## Overview
The Financial tab in `ReportsAnalytics.tsx` generates various financial reports including revenue, expenses, profit/loss, and cash flow analysis. Based on the `reportsService.ts` implementation, here are the **required database tables** for accurate and complete financial report generation.

---

## 🔴 **Primary Tables (Required)**

### 1. **`pos_transactions`** (Sales/Revenue Transactions)
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

create index IF not exists idx_pos_transactions_transaction_type on public.pos_transactions using btree (transaction_type) TABLESPACE pg_default;

create index IF not exists idx_pos_transactions_status on public.pos_transactions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_pos_transactions_type_status_date on public.pos_transactions using btree (transaction_type, status, transaction_date) TABLESPACE pg_default;
---

### 2. **`expenses`** (Expense/Outflow Records)
create table public.expenses (
  id uuid not null default gen_random_uuid (),
  date date not null,
  category_id uuid null,
  description text null,
  amount numeric(12, 2) not null,
  reference text null,
  status public.expense_status null default 'Pending'::expense_status,
  branch_id uuid null,
  payment_method text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  payroll_record_id uuid null,
  expense_date date null,
  receipt_file_name text null,
  receipt_url text null,
  requires_approval boolean null default false,
  reviewed_by text null,
  reviewed_at timestamp without time zone null,
  source text null,
  constraint expenses_pkey primary key (id),
  constraint expenses_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint expenses_category_id_fkey foreign KEY (category_id) references expense_categories (id) on delete set null,
  constraint expenses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint expenses_payroll_record_id_fkey foreign KEY (payroll_record_id) references payroll_records (id)
) TABLESPACE pg_default;
---

### 3. **`expense_categories`** (Expense Category Definitions)
create table public.expense_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  is_active boolean null default true,
  constraint expense_categories_pkey primary key (id),
  constraint expense_categories_name_key unique (name)
) TABLESPACE pg_default;
---

## 🟡 **Supporting Tables (Highly Recommended for Advanced Reports)**

### 4. **`branches`** (Branch/Location Information)
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

### 5. **`customers`** (Customer Information)
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

### 6. **`suppliers`** (Supplier Information)
create table public.suppliers (
  id uuid not null default gen_random_uuid (),
  name character varying(200) not null,
  code character varying(20) not null,
  contact_person character varying(100) null,
  email character varying(255) null,
  phone character varying(20) null,
  address text null,
  payment_terms character varying(50) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint suppliers_pkey primary key (id),
  constraint suppliers_code_key unique (code)
) TABLESPACE pg_default;

create index IF not exists idx_suppliers_code on public.suppliers using btree (code) TABLESPACE pg_default;

create index IF not exists idx_suppliers_is_active on public.suppliers using btree (is_active) TABLESPACE pg_default;
---

### 7. **`payroll_records`** (Payroll Expenses)
create table public.payroll_records (
  id uuid not null default gen_random_uuid (),
  staff_id uuid not null,
  period_id uuid not null,
  base_salary numeric(12, 2) not null,
  days_present integer not null,
  daily_allowance numeric(10, 2) not null,
  total_allowance numeric(12, 2) not null,
  overtime_pay numeric(12, 2) null default 0,
  bonuses numeric(12, 2) null default 0,
  other_earnings numeric(12, 2) null default 0,
  gross_pay numeric(15, 2) not null,
  tax_deduction numeric(12, 2) null default 0,
  sss_deduction numeric(12, 2) null default 0,
  philhealth_deduction numeric(12, 2) null default 0,
  pagibig_deduction numeric(12, 2) null default 0,
  cashcash_advances numeric(12, 2) null default 0,
  other_deductions numeric(12, 2) null default 0,
  total_deductions numeric(15, 2) not null,
  net_pay numeric(15, 2) not null,
  status character varying(20) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  cash_advances numeric(10, 2) null default 0,
  constraint payroll_records_pkey primary key (id),
  constraint unique_staff_period unique (staff_id, period_id),
  constraint payroll_records_period_id_fkey foreign KEY (period_id) references payroll_periods (id),
  constraint payroll_records_staff_id_fkey foreign KEY (staff_id) references staff (id),
  constraint check_payroll_status check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'approved'::character varying,
            'paid'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payroll_records_period on public.payroll_records using btree (period_id) TABLESPACE pg_default;

create index IF not exists idx_payroll_records_staff on public.payroll_records using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_payroll_records_status on public.payroll_records using btree (status) TABLESPACE pg_default;
---

### 8. **`accounts`** or **`chart_of_accounts`** (Accounting Categories)
**Purpose**: Standard accounting categories for financial reporting (optional but recommended).

**Required Columns** (if used):
- `id` (UUID, PRIMARY KEY)
- `account_code` (VARCHAR) - Account code (e.g., '4000', '5000')
- `account_name` (VARCHAR) - Account name (e.g., 'Revenue', 'Expenses')
- `account_type` (VARCHAR) - e.g., 'asset', 'liability', 'revenue', 'expense', 'equity'
- `parent_id` (UUID, optional) - Parent account

**Why Needed**:
- Standardized financial reporting
- Balance sheet reports
- Accounting compliance

**Status**: ⚠️ **Optional** - Not currently implemented

---

### 9. **`budgets`** (Budget Planning)
**Purpose**: Budget targets for comparison with actuals (optional but recommended).

**Required Columns** (if used):
- `id` (UUID, PRIMARY KEY)
- `period_start` (DATE) - Budget period start
- `period_end` (DATE) - Budget period end
- `category_id` (UUID, optional) - Category or account
- `budgeted_amount` (NUMERIC) - Budgeted amount
- `branch_id` (UUID, optional) - Branch-specific budget

**Why Needed**:
- Budget vs Actual reports
- Variance analysis
- Financial planning

**Status**: ⚠️ **Optional** - Not currently implemented

---

### 10. **`payments`** (Payment Transactions)
**Purpose**: Track payments to suppliers and other outflows (optional).

**Required Columns** (if used):
- `id` (UUID, PRIMARY KEY)
- `payment_date` (DATE) - Payment date
- `amount` (NUMERIC) - Payment amount
- `supplier_id` (UUID, optional) - Supplier payment
- `expense_id` (UUID, optional) - Related expense
- `payment_method` (VARCHAR) - Payment method
- `status` (VARCHAR) - Payment status

**Why Needed**:
- Cash flow tracking
- Payment reconciliation
- Supplier payment reports

**Status**: ⚠️ **Optional** - Not currently implemented

---

## 📊 **Financial Report Types & Their Data Requirements**

### **1. Financial Summary Report** (`financial_summary` or `financial_summary_report`)
**Tables Used**:
- ✅ `pos_transactions` (for revenue)
- ⚠️ `expenses` (for expenses - not yet implemented)

**Data Output**:
- Total revenue, total expenses, net profit/loss
- Period summary (aggregated metrics)

**Current Implementation**: ⚠️ **Partially Implemented** - Only calculates revenue, missing expenses

**Required Enhancement**: Add expense data for complete P&L

---

### **2. Revenue Report** (`revenue_report`)
**Tables Used**:
- ✅ `pos_transactions` (main data)
- ✅ `branches` (for branch names)
- ✅ `customers` (for customer names, optional)

**Data Output**:
- Revenue by date, branch, customer
- Revenue breakdown (subtotal, tax, total)

**Current Implementation**: ✅ **Can be generated from current data**

---

### **3. Expense Report** (`expense_report`)
**Tables Used** (Not yet implemented):
- ⚠️ `expenses` (main data)
- ⚠️ `expense_categories` (for category names)
- ✅ `branches` (for branch names)
- ✅ `suppliers` (for supplier names, optional)

**Data Output**:
- Expenses by date, category, branch
- Expense breakdown by category

**Status**: ⚠️ **Not Currently Implemented** - Would require `expenses` and `expense_categories` tables

---

### **4. Profit & Loss Report** (`profit_loss` or `p_l_report`)
**Tables Used** (Not yet implemented):
- ✅ `pos_transactions` (revenue)
- ⚠️ `expenses` (expenses)
- ✅ `payroll_records` (payroll expenses)
- ✅ `branches` (for branch-level P&L)

**Data Output**:
- Revenue section
- Expense section (by category)
- Net profit/loss
- Gross margin, operating margin

**Status**: ⚠️ **Not Currently Implemented** - Would require `expenses` table

---

### **5. Cash Flow Report** (`cash_flow` or `cash_flow_report`)
**Tables Used** (Not yet implemented):
- ✅ `pos_transactions` (cash inflows)
- ⚠️ `expenses` (cash outflows)
- ⚠️ `payments` (payment outflows)
- ✅ `payroll_records` (payroll outflows)

**Data Output**:
- Cash inflows (sales revenue)
- Cash outflows (expenses, payroll, payments)
- Net cash flow
- Cash flow trends over time

**Status**: ⚠️ **Not Currently Implemented** - Would require `expenses` and `payments` tables

---

### **6. Budget vs Actual Report** (`budget_vs_actual`)
**Tables Used** (Not yet implemented):
- ⚠️ `budgets` (budget targets)
- ✅ `pos_transactions` (actual revenue)
- ⚠️ `expenses` (actual expenses)

**Data Output**:
- Budgeted vs actual revenue
- Budgeted vs actual expenses
- Variance analysis

**Status**: ⚠️ **Not Currently Implemented** - Would require `budgets` table

---

## 📋 **Summary: Required Tables Checklist**

| Table | Priority | Used In Reports | Required Columns |
|-------|----------|----------------|------------------|
| `pos_transactions` | **CRITICAL** | All financial reports (revenue) | id, transaction_date, total_amount, subtotal, tax_amount, payment_status, status, branch_id |
| `expenses` | **CRITICAL** | Expense, P&L, Cash Flow | id, date, amount, category_id, status, branch_id, description |
| `expense_categories` | **IMPORTANT** | Expense, P&L reports | id, name, description |
| `branches` | **IMPORTANT** | All reports (filtering/naming) | id, name, is_active |
| `customers` | **RECOMMENDED** | Revenue analysis | id, first_name, last_name, customer_type |
| `suppliers` | **RECOMMENDED** | Expense analysis | id, name, code |
| `payroll_records` | **IMPORTANT** | Complete P&L, Cash Flow | id, staff_id, gross_pay, net_pay, created_at |
| `payroll_periods` | **IMPORTANT** | Payroll reports | id, start_date, end_date |
| `accounts` / `chart_of_accounts` | **OPTIONAL** | Standard accounting reports | id, account_code, account_name, account_type |
| `budgets` | **OPTIONAL** | Budget vs Actual | id, period_start, period_end, budgeted_amount |
| `payments` | **OPTIONAL** | Cash Flow, Payment tracking | id, payment_date, amount, supplier_id, payment_method |

---

## ✅ **Currently Implemented Reports**

### ✅ **1. Financial Summary Report** (`financial_summary`)
**Status**: Partially functional (revenue only)
**Tables Required**: `pos_transactions`
**Current Implementation**: ⚠️ Only calculates revenue metrics - missing expenses

**Current Output**:
```typescript
{
  revenue: number,
  subtotal: number,
  tax: number,
  transaction_count: number,
  period_start: string,
  period_end: string
}
```

**Missing**: Expense data for complete financial picture

---

## ⚠️ **Not Yet Implemented (But Mentioned in Requirements)**

These reports are mentioned in financial reporting requirements but not yet implemented:

1. **Expense Report** - Requires `expenses` and `expense_categories` tables
2. **Profit & Loss Report** - Requires `expenses` table
3. **Cash Flow Report** - Requires `expenses` and `payments` tables
4. **Budget vs Actual Report** - Requires `budgets` table

---

## 🔍 **Database Query Examples**

### Example 1: Financial Summary Report (Current - Revenue Only)
```sql
SELECT 
  SUM(total_amount) AS revenue,
  SUM(subtotal) AS subtotal,
  SUM(tax_amount) AS tax,
  COUNT(*) AS transaction_count
FROM pos_transactions
WHERE transaction_type = 'sale'
  AND status = 'active'
  AND payment_status = 'completed'
  AND transaction_date >= '2024-01-01'
  AND transaction_date <= '2024-01-31';
```

### Example 2: Complete Financial Summary (With Expenses)
```sql
-- Revenue
SELECT 
  SUM(total_amount) AS total_revenue,
  SUM(subtotal) AS revenue_subtotal,
  SUM(tax_amount) AS total_tax
FROM pos_transactions
WHERE transaction_type = 'sale'
  AND status = 'active'
  AND payment_status = 'completed'
  AND transaction_date >= '2024-01-01'
  AND transaction_date <= '2024-01-31';

-- Expenses
SELECT 
  SUM(amount) AS total_expenses
FROM expenses
WHERE status IN ('approved', 'paid')
  AND date >= '2024-01-01'
  AND date <= '2024-01-31';

-- Payroll Expenses
SELECT 
  SUM(gross_pay) AS total_payroll
FROM payroll_records
WHERE created_at >= '2024-01-01'
  AND created_at <= '2024-01-31';
```

### Example 3: Expense Report by Category
```sql
SELECT 
  ec.name AS category_name,
  SUM(e.amount) AS total_expenses,
  COUNT(*) AS expense_count
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
WHERE e.status IN ('approved', 'paid')
  AND e.date >= '2024-01-01'
  AND e.date <= '2024-01-31'
GROUP BY ec.name
ORDER BY total_expenses DESC;
```

### Example 4: Profit & Loss Report
```sql
-- Revenue
SELECT 'Revenue' AS section, SUM(total_amount) AS amount
FROM pos_transactions
WHERE transaction_type = 'sale'
  AND status = 'active'
  AND payment_status = 'completed'
  AND transaction_date >= '2024-01-01'
  AND transaction_date <= '2024-01-31'

UNION ALL

-- Operating Expenses
SELECT 'Operating Expenses' AS section, SUM(amount) AS amount
FROM expenses
WHERE status IN ('approved', 'paid')
  AND date >= '2024-01-01'
  AND date <= '2024-01-31'

UNION ALL

-- Payroll Expenses
SELECT 'Payroll Expenses' AS section, SUM(gross_pay) AS amount
FROM payroll_records
WHERE created_at >= '2024-01-01'
  AND created_at <= '2024-01-31';
```

---

## ⚠️ **Important Considerations**

### 1. **Revenue vs Expenses Balance**
- Current implementation only tracks revenue from `pos_transactions`
- For complete financial reports, you need expense tracking
- Consider adding `expenses` table for full P&L reporting

### 2. **Date Filtering**
- Revenue reports filter by `transaction_date`
- Expense reports would filter by `expense_date` or `date`
- Payroll reports filter by `created_at` (consider using period dates)

### 3. **Payment Status**
- Only include `payment_status = 'completed'` for revenue
- Only include `status IN ('approved', 'paid')` for expenses
- This ensures accurate financial reporting

### 4. **Branch Filtering**
- All reports support `branchId` parameter
- Multi-branch systems need branch-level financials

### 5. **Tax Handling**
- Revenue includes tax collected
- Expenses may include tax paid (if tracked)
- Consider separate tax reports

---

## ✅ **Verification Checklist**

Before generating financial reports, verify:

- [ ] `pos_transactions` table exists with all required columns
- [ ] `expenses` table exists (if implementing expense reports)
- [ ] `expense_categories` table exists (if implementing expense reports)
- [ ] `branches` table exists
- [ ] Foreign keys are properly set up
- [ ] Indexes exist on frequently queried columns:
  - [ ] `pos_transactions.transaction_date`
  - [ ] `pos_transactions.payment_status`
  - [ ] `pos_transactions.status`
  - [ ] `expenses.date` (if table exists)
  - [ ] `expenses.status` (if table exists)
  - [ ] `expenses.category_id` (if table exists)
- [ ] Sample data exists for testing

---

## 🚀 **Next Steps**

1. **Verify Tables Exist**: Run `SELECT` queries to confirm all tables exist
2. **Check Column Names**: Ensure column names match exactly (case-sensitive)
3. **Test Queries**: Run the example queries above with your data
4. **Add Indexes**: Create indexes on foreign keys and frequently filtered columns
5. **Populate Sample Data**: Add test transactions and expenses for validation

---

## 📝 **Notes**

### **Current Implementation Status**
- ✅ **Financial Summary Report**: Partially functional (revenue only)
- ⚠️ **Expense Report**: Not implemented (requires `expenses` table)
- ⚠️ **Profit & Loss Report**: Not implemented (requires `expenses` table)
- ⚠️ **Cash Flow Report**: Not implemented (requires `expenses` and `payments` tables)

### **Data Transformation Needed**
The current implementation may return raw aggregated data. Consider adding data transformation to ensure clean, readable output:
- Format currency values properly
- Format dates consistently
- Add percentage calculations (margins, growth rates)
- Include comparisons (vs previous period)

---

## ✅ **READY FOR PRODUCTION**

**Current Status**: 
- ✅ Financial Summary Report: **Partially Ready** (revenue calculations only)
- ⚠️ Complete Financial Reports: **Requires `expenses` table**

**Action Required**: 
1. ✅ Verify that `pos_transactions` table exists with all required columns
2. ⚠️ Add `expenses` and `expense_categories` tables for complete financial reporting
3. ⚠️ Consider implementing data transformation for clean, readable reports

---

## 📄 **Recommended SQL Schema for Expenses**

If you need to create the `expenses` table, here's a recommended schema:

```sql
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category_id UUID NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  branch_id UUID NULL,
  supplier_id UUID NULL,
  payment_method VARCHAR(50) NULL,
  receipt_url TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES expense_categories (id),
  CONSTRAINT expenses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id),
  CONSTRAINT expenses_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
  CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id),
  
  CONSTRAINT expenses_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  parent_id UUID NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id),
  CONSTRAINT expense_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES expense_categories (id),
  CONSTRAINT expense_categories_name_key UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_id);
```

