# Database Tables Required for Cash Flow Overview

## Overview
The `Cashflowoverview.tsx` component requires data from multiple tables to calculate and display accurate cash flow information. Below is a comprehensive list organized by data requirement.

---

## **CASH INFLOW (Revenue Sources)**

### 1. **`pos_transactions`** ⭐ PRIMARY
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

### 2. **`sales_transactions`** (Alternative/Primary)
I don't have this table. pos_transaction handles the transactions either it is walkin or online
---

## **CASH OUTFLOW (Expenses & Payments)**

### 3. **`expenses`** ⭐ PRIMARY
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

### 4. **`expense_categories`** ⭐ REQUIRED
create table public.expense_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  is_active boolean null default true,
  constraint expense_categories_pkey primary key (id),
  constraint expense_categories_name_key unique (name)
) TABLESPACE pg_default;
---

### 5. **`pos_payments`** ⭐ REQUIRED (handle customer and supplier payments or expenses)
create table public.pos_payments (
  id uuid not null default gen_random_uuid (),
  transaction_id uuid not null,
  payment_method character varying(20) not null,
  payment_type character varying(50) null,
  amount numeric(10, 2) not null default 0.00,
  change_given numeric(10, 2) not null default 0.00,
  reference_number character varying(100) null,
  payment_status character varying(20) not null default 'pending'::character varying,
  processed_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint pos_payments_pkey primary key (id),
  constraint pos_payments_transaction_id_fkey foreign KEY (transaction_id) references pos_transactions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pos_payments_transaction_id on public.pos_payments using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_pos_payments_payment_method on public.pos_payments using btree (payment_method) TABLESPACE pg_default;

create index IF not exists idx_pos_payments_payment_status on public.pos_payments using btree (payment_status) TABLESPACE pg_default;
---

### 6. **`payroll_requests` / `payroll_records`** ⭐ REQUIRED
create table public.payroll_requests (
  id uuid not null default gen_random_uuid (),
  period_id uuid not null,
  scope text not null,
  branch_id uuid null,
  total_employees integer not null default 0,
  total_gross numeric(12, 2) not null default 0,
  total_deductions numeric(12, 2) not null default 0,
  total_net numeric(12, 2) not null default 0,
  status text not null default 'pending'::text,
  requested_by uuid null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint payroll_requests_pkey primary key (id),
  constraint payroll_requests_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint payroll_requests_period_id_fkey foreign KEY (period_id) references payroll_periods (id) on delete CASCADE,
  constraint payroll_requests_requested_by_fkey foreign KEY (requested_by) references users (id) on delete set null,
  constraint payroll_requests_scope_check check (
    (
      scope = any (
        array['branch'::text, 'individual'::text, 'all'::text]
      )
    )
  ),
  constraint payroll_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text,
          'processed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

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

## **SUPPORTING / REFERENCE TABLES**

### 7. **`branches`** ⭐ REQUIRED
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

### 8. **`customers`** (Optional)
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

### 9. **`suppliers`** (Optional)
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

## **CALCULATED METRICS (No Direct Tables)**

🟢 Current Balance (Cash on Hand)

Calculation:

Previous day’s retained cash + Total Inflows (sales, collections, etc.) − Total Outflows (expenses, remittances)

Includes:

All physical cash currently in branch drawers or vault

Retained cash from last POS session

Cash not yet remitted or deposited

Data Source:

pos_sessions (opening, closing, retained amounts)

pos_transactions, expenses tables

💬 This represents the actual money available in the branch — your true “cash on hand.”

🟡 Net Cash Flow

Calculation:

Total Inflows − Total Outflows (for the selected period, e.g., today, this week, this month)

Inflows: pos_transactions,pos_payments

Outflows: Expenses

Purpose: Shows whether the branch generated or used cash within the period.

💬 A positive number = more cash came in than went out.

🔵 Working Capital (Simplified for Non-Bank Setup)

Calculation:

Cash on Hand + transactions − expenses




💬 Indicates liquidity — how much cash or near-cash the business has available to operate.
---

---

## **SUMMARY BY FUNCTIONALITY**

### Summary Cards (Current Balance, Net Cash Flow, etc.)
- `pos_transactions` (inflow)
- `expenses` (outflow)
- `payroll_requests` (outflow)
- `payments` (both inflow/outflow)
- Optional: `cash_accounts` for current balance

### Daily/Monthly Cash Flow Trends
- `pos_transactions` (group by date)
- `expenses` (group by date)
- `payroll_requests` (group by date)
- `payments` (group by date)

### Cash Inflow Categories
- `pos_transactions` (by source: 'pos', 'online', 'mobile_app')
- Or categorize by `sales_transactions.source` field

### Cash Outflow Categories
- `expenses` (grouped by `expense_categories.name`)
- `payroll_requests` (Payroll & Benefits)
- `payments` where `supplier_id` is not null (Supplier Payments)

### Recent Transactions
- Combine:
  - `pos_transactions` (type: 'inflow')
  - `expenses` (type: 'outflow')
  - `payments` (determine type by customer_id vs supplier_id)
  - `payroll_requests` (type: 'outflow')

---

## **QUERY EXAMPLES**

### Total Inflow (Current Period)
```sql
SELECT SUM(total_amount) as total_inflow
FROM pos_transactions
WHERE payment_status = 'completed'
  AND transaction_type = 'sale'
  AND status = 'active'
  AND transaction_date >= :start_date
  AND transaction_date <= :end_date;
```

### Total Outflow (Current Period)
```sql
SELECT 
  COALESCE(SUM(e.amount), 0) + 
  COALESCE(SUM(p.total_net), 0) + 
  COALESCE(SUM(pay.amount), 0) as total_outflow
FROM expenses e
WHERE e.status IN ('approved', 'paid')
  AND e.date >= :start_date
  AND e.date <= :end_date
UNION ALL
SELECT total_net FROM payroll_requests
WHERE status IN ('approved', 'processed')
  AND created_at >= :start_date
UNION ALL
SELECT amount FROM payments
WHERE supplier_id IS NOT NULL
  AND payment_date >= :start_date;
```

---

## **IMPLEMENTATION PRIORITY**

### **Phase 1 - Minimum Required** (Core Functionality)
1. `pos_transactions` or `sales_transactions`
2. `expenses`
3. `expense_categories`
4. `branches`

### **Phase 2 - Enhanced Accuracy** (Recommended)
5. `payroll_requests` / `payroll_records`
6. `payments` (for supplier payments)
7. `cash_accounts` (for current balance)

### **Phase 3 - Advanced Features** (Optional)
8. `cash_transactions` (unified transaction log)
9. `customers`, `suppliers` (for detailed transaction info)

---

## **NOTES**

1. **Payment Status**: Only include transactions with `payment_status = 'completed'` for accurate cash flow
2. **Expense Status**: Only include expenses with `status = 'approved'` or `'paid'` to match Expenses.tsx logic
3. **Date Filtering**: Use `transaction_date` or `date` fields for period filtering
4. **Branch Filtering**: Add `branch_id` filters if multi-branch support is needed
5. **Real-time Updates**: Consider using Supabase Realtime for live cash flow updates










