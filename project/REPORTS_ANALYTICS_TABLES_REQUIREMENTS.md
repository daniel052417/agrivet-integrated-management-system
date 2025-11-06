# Database Tables Required for ReportsAnalytics.tsx

## Overview
The `ReportsAnalytics.tsx` component displays a comprehensive reports dashboard with multiple report categories. To be fully functional, it requires **2 main tables** plus access to existing data tables for report generation.

## 1. `report_definitions` Table (Report Templates)

### Purpose
Stores metadata about available report types - defines what reports can be generated.

### Required Schema
```sql
CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'on_demand',
    is_active BOOLEAN DEFAULT true,
    required_permission VARCHAR(100),
    required_role VARCHAR(50),
    parameters_schema JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color_scheme VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT report_definitions_category_check CHECK (
        category IN (
            'sales', 
            'inventory', 
            'hr', 
            'financial', 
            'marketing', 
            'operational'
        )
    ),
    CONSTRAINT report_definitions_frequency_check CHECK (
        frequency IN ('on_demand', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_definitions_category ON report_definitions(category);
CREATE INDEX IF NOT EXISTS idx_report_definitions_report_key ON report_definitions(report_key);
CREATE INDEX IF NOT EXISTS idx_report_definitions_is_active ON report_definitions(is_active);
```

### Field Descriptions
- `category`: Report category (sales, inventory, hr, financial, marketing, operational)
- `report_name`: Display name (e.g., "Daily Sales Summary")
- `report_key`: Unique identifier for programmatic access (e.g., "daily_sales_summary")
- `description`: Human-readable description
- `report_type`: Type within category (e.g., "summary", "detailed", "analytics")
- `frequency`: How often reports are typically generated
- `required_permission`: Permission required to generate this report
- `required_role`: Minimum role required
- `parameters_schema`: JSON schema defining what parameters this report accepts
- `display_order`: Order for display in UI
- `color_scheme`: UI color scheme (e.g., "green", "blue")

---

## 2. `generated_reports` Table (Generated Report Records)

### Purpose
Stores records of actually generated reports - tracks when reports were created, file paths, sizes, etc.

### Required Schema
```sql
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_definition_id UUID REFERENCES report_definitions(id) ON DELETE CASCADE,
    report_key VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_url TEXT,
    file_size INTEGER, -- Size in bytes
    file_format VARCHAR(20) DEFAULT 'pdf', -- pdf, csv, excel, json
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    parameters JSONB DEFAULT '{}', -- Parameters used to generate this report
    date_range_start DATE,
    date_range_end DATE,
    branch_id UUID REFERENCES branches(id),
    status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,
    execution_time INTEGER, -- Time taken to generate in milliseconds
    record_count INTEGER, -- Number of records in the report
    expires_at TIMESTAMP WITH TIME ZONE, -- When report data expires (optional)
    is_scheduled BOOLEAN DEFAULT false,
    schedule_id UUID, -- If generated from a schedule
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT generated_reports_category_check CHECK (
        category IN (
            'sales', 
            'inventory', 
            'hr', 
            'financial', 
            'marketing', 
            'operational'
        )
    ),
    CONSTRAINT generated_reports_status_check CHECK (
        status IN ('generating', 'completed', 'failed', 'expired')
    ),
    CONSTRAINT generated_reports_format_check CHECK (
        file_format IN ('pdf', 'csv', 'excel', 'json', 'html')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_reports_category ON generated_reports(category);
CREATE INDEX IF NOT EXISTS idx_generated_reports_report_key ON generated_reports(report_key);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by ON generated_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_branch_id ON generated_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);
```

### Field Descriptions
- `report_definition_id`: Link to report definition
- `report_key`: Copy of report key for quick lookup
- `file_path`: Server file system path (if stored locally)
- `file_url`: URL to access report (if stored in cloud storage)
- `file_size`: File size in bytes
- `file_format`: Export format (pdf, csv, excel, etc.)
- `generated_by`: User who generated the report
- `parameters`: JSON object with parameters used (date range, filters, etc.)
- `date_range_start/end`: Date range for report data
- `branch_id`: Branch filter (if applicable)
- `status`: Generation status
- `execution_time`: How long generation took
- `record_count`: Number of records included

---

## Supporting Tables (Reference - Already Exist)

The component references data from these existing tables for generating reports:

### For Sales Reports:
- `sales_transactions` or `pos_transactions`
- `transaction_items`
- `products`
- `categories`
- `branches`

### For Inventory Reports:
- `products`
- `inventory_movements` or `stock_movements`
- `suppliers`
- `categories`
- `branches`

### For HR Reports:
- `staff`
- `attendance_records`
- `payroll_records` (already exists)
- `payroll_reports` (already exists - could be integrated)
- `leave_requests`
- `performance_reviews`

### For Financial Reports:
- `sales_transactions`
- `expenses` or `financial_transactions`
- `accounts`
- `budgets`

### For Marketing Reports:
- `marketing_campaigns`
- `notifications`
- `customers`
- `promotions`

### For Operational Reports:
- `user_activity` (already exists)
- `user_sessions` (already exists)
- `audit_logs` (already exists)
- System logs/error logs

---

## Complete Migration Script

```sql
-- 1. Report Definitions Table
CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'on_demand',
    is_active BOOLEAN DEFAULT true,
    required_permission VARCHAR(100),
    required_role VARCHAR(50),
    parameters_schema JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color_scheme VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT report_definitions_category_check CHECK (
        category IN ('sales', 'inventory', 'hr', 'financial', 'marketing', 'operational')
    ),
    CONSTRAINT report_definitions_frequency_check CHECK (
        frequency IN ('on_demand', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')
    )
);

CREATE INDEX IF NOT EXISTS idx_report_definitions_category ON report_definitions(category);
CREATE INDEX IF NOT EXISTS idx_report_definitions_report_key ON report_definitions(report_key);
CREATE INDEX IF NOT EXISTS idx_report_definitions_is_active ON report_definitions(is_active);

-- 2. Generated Reports Table
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_definition_id UUID REFERENCES report_definitions(id) ON DELETE CASCADE,
    report_key VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_url TEXT,
    file_size INTEGER,
    file_format VARCHAR(20) DEFAULT 'pdf',
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    parameters JSONB DEFAULT '{}',
    date_range_start DATE,
    date_range_end DATE,
    branch_id UUID REFERENCES branches(id),
    status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,
    execution_time INTEGER,
    record_count INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_scheduled BOOLEAN DEFAULT false,
    schedule_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT generated_reports_category_check CHECK (
        category IN ('sales', 'inventory', 'hr', 'financial', 'marketing', 'operational')
    ),
    CONSTRAINT generated_reports_status_check CHECK (
        status IN ('generating', 'completed', 'failed', 'expired')
    ),
    CONSTRAINT generated_reports_format_check CHECK (
        file_format IN ('pdf', 'csv', 'excel', 'json', 'html')
    )
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_category ON generated_reports(category);
CREATE INDEX IF NOT EXISTS idx_generated_reports_report_key ON generated_reports(report_key);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by ON generated_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_branch_id ON generated_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);

-- 3. Insert Default Report Definitions (Optional)
INSERT INTO report_definitions (category, report_name, report_key, description, report_type, frequency, display_order, color_scheme) VALUES
-- Sales Reports
('sales', 'Daily Sales Summary', 'daily_sales_summary', 'Complete daily sales breakdown', 'summary', 'daily', 1, 'green'),
('sales', 'Monthly Sales Report', 'monthly_sales_report', 'Monthly performance analysis', 'summary', 'monthly', 2, 'green'),
('sales', 'Product Performance Report', 'product_performance', 'Top selling products analysis', 'analytics', 'weekly', 3, 'green'),
('sales', 'Sales by Category Report', 'sales_by_category', 'Category-wise sales breakdown', 'analytics', 'weekly', 4, 'green'),
('sales', 'Sales Target Achievement', 'sales_target_achievement', 'Target vs actual performance', 'analytics', 'monthly', 5, 'green'),

-- Inventory Reports
('inventory', 'Stock Level Report', 'stock_level', 'Current inventory levels by category', 'summary', 'daily', 1, 'blue'),
('inventory', 'Low Stock Alert Report', 'low_stock_alert', 'Products below reorder point', 'alert', 'daily', 2, 'blue'),
('inventory', 'Inventory Movement Report', 'inventory_movement', 'Stock in/out movement analysis', 'analytics', 'weekly', 3, 'blue'),
('inventory', 'Product Turnover Report', 'product_turnover', 'Product velocity and turnover rates', 'analytics', 'weekly', 4, 'blue'),
('inventory', 'Supplier Performance Report', 'supplier_performance', 'Supplier delivery and quality metrics', 'analytics', 'monthly', 5, 'blue'),

-- HR Reports
('hr', 'Employee Attendance Report', 'employee_attendance', 'Daily attendance tracking and analysis', 'summary', 'daily', 1, 'purple'),
('hr', 'Payroll Summary Report', 'payroll_summary', 'Monthly payroll breakdown and costs', 'summary', 'monthly', 2, 'purple'),
('hr', 'Leave Management Report', 'leave_management', 'Employee leave patterns and trends', 'analytics', 'weekly', 3, 'purple'),
('hr', 'Performance Review Report', 'performance_review', 'Employee performance evaluation summary', 'summary', 'quarterly', 4, 'purple'),
('hr', 'Staff Productivity Report', 'staff_productivity', 'Productivity metrics and KPIs', 'analytics', 'monthly', 5, 'purple'),

-- Financial Reports
('financial', 'Profit & Loss Statement', 'profit_loss', 'Monthly P&L analysis and trends', 'summary', 'monthly', 1, 'yellow'),
('financial', 'Cash Flow Report', 'cash_flow', 'Cash flow analysis and projections', 'summary', 'monthly', 2, 'yellow'),
('financial', 'Budget vs Actual Report', 'budget_vs_actual', 'Budget performance and variance analysis', 'analytics', 'monthly', 3, 'yellow'),
('financial', 'Revenue Analysis Report', 'revenue_analysis', 'Revenue streams and growth analysis', 'analytics', 'monthly', 4, 'yellow'),
('financial', 'Expense Breakdown Report', 'expense_breakdown', 'Detailed expense categorization and trends', 'analytics', 'monthly', 5, 'yellow'),

-- Marketing Reports
('marketing', 'Campaign Performance Report', 'campaign_performance', 'Marketing campaign effectiveness analysis', 'analytics', 'weekly', 1, 'pink'),
('marketing', 'Customer Engagement Report', 'customer_engagement', 'Customer interaction and engagement metrics', 'analytics', 'weekly', 2, 'pink'),
('marketing', 'Lead Generation Report', 'lead_generation', 'Lead sources and conversion analysis', 'analytics', 'weekly', 3, 'pink'),
('marketing', 'Social Media Analytics', 'social_media_analytics', 'Social media performance and reach', 'analytics', 'weekly', 4, 'pink'),
('marketing', 'Email Marketing Report', 'email_marketing', 'Email campaign performance and metrics', 'analytics', 'weekly', 5, 'pink'),

-- Operational Reports
('operational', 'System Performance Report', 'system_performance', 'System uptime and performance metrics', 'summary', 'daily', 1, 'indigo'),
('operational', 'Process Efficiency Report', 'process_efficiency', 'Operational process analysis and optimization', 'analytics', 'weekly', 2, 'indigo'),
('operational', 'Error Log Report', 'error_log', 'System errors and troubleshooting analysis', 'summary', 'daily', 3, 'indigo'),
('operational', 'User Activity Report', 'user_activity', 'User behavior and system usage patterns', 'analytics', 'weekly', 4, 'indigo'),
('operational', 'Security Audit Report', 'security_audit', 'Security events and compliance monitoring', 'summary', 'daily', 5, 'indigo')
ON CONFLICT (report_key) DO NOTHING;
```

---

## Component Data Mapping

### Report Categories
The component displays 6 categories:
1. **Sales Reports** (category: 'sales')
2. **Inventory Reports** (category: 'inventory')
3. **HR Reports** (category: 'hr')
4. **Financial Reports** (category: 'financial')
5. **Marketing Reports** (category: 'marketing')
6. **Operational Reports** (category: 'operational')

### Metrics Calculation

#### Per Category Metrics:
- `totalReports`: COUNT of `generated_reports` WHERE `category = X`
- `lastGenerated`: MAX(`generated_at`) from `generated_reports` WHERE `category = X`
- `avgSize`: AVG(`file_size`) from `generated_reports` WHERE `category = X`
- `frequency`: FROM `report_definitions` WHERE `category = X` (most common frequency)

#### Summary Stats:
- `Total Reports`: SUM of all categories' totalReports
- `Generated Today`: COUNT WHERE `generated_at >= CURRENT_DATE`
- `Total Size`: SUM(`file_size`) from all reports
- `Avg Generation`: AVG(`execution_time`) from recent reports

---

## Example Queries

### Get All Report Categories with Metrics
```sql
SELECT 
    rd.category,
    COUNT(DISTINCT rd.id) as available_reports,
    COUNT(gr.id) as total_generated,
    MAX(gr.generated_at) as last_generated,
    AVG(gr.file_size) as avg_size,
    MODE() WITHIN GROUP (ORDER BY rd.frequency) as frequency
FROM report_definitions rd
LEFT JOIN generated_reports gr ON rd.report_key = gr.report_key
WHERE rd.is_active = true
GROUP BY rd.category
ORDER BY rd.category;
```

### Get Reports for a Category
```sql
SELECT 
    rd.report_name,
    rd.description,
    MAX(gr.generated_at)::DATE as last_generated,
    AVG(gr.file_size) / (1024 * 1024) as avg_size_mb
FROM report_definitions rd
LEFT JOIN generated_reports gr ON rd.report_key = gr.report_key
WHERE rd.category = 'sales' AND rd.is_active = true
GROUP BY rd.id, rd.report_name, rd.description, rd.display_order
ORDER BY rd.display_order;
```

### Get Recent Reports
```sql
SELECT 
    gr.report_name,
    gr.category,
    gr.generated_at,
    gr.file_size,
    gr.status,
    u.email as generated_by_email
FROM generated_reports gr
LEFT JOIN users u ON gr.generated_by = u.id
WHERE gr.generated_at >= CURRENT_DATE
ORDER BY gr.generated_at DESC
LIMIT 20;
```

---

## Optional: Report Scheduling Table

If you want to support scheduled reports:

```sql
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_definition_id UUID REFERENCES report_definitions(id) ON DELETE CASCADE,
    schedule_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    schedule_time TIME,
    schedule_day INTEGER, -- 1-7 for weekly, 1-31 for monthly
    is_active BOOLEAN DEFAULT true,
    parameters JSONB DEFAULT '{}',
    recipients JSONB DEFAULT '[]', -- Array of email addresses
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## Summary

### Required Tables:
1. **`report_definitions`** - Defines available report types
2. **`generated_reports`** - Tracks generated report instances

### Existing Tables Used:
- `users` - For `generated_by` reference
- `branches` - For branch filtering
- `payroll_reports` - Can be integrated or migrated to `generated_reports`
- All data tables (sales, inventory, hr, etc.) - For actual report data

### Next Steps:
1. Create the two main tables
2. Insert report definitions
3. Update component to query from database instead of hardcoded data
4. Implement report generation logic that populates `generated_reports`
5. Add file storage for generated reports (local or cloud)






