# Branch Management Tab - Database Tables Requirements

This document outlines all the database tables needed for the **Branch Management** tab in `SettingsPage.tsx` to be fully functional.

---

## 📋 **Overview**

The Branch Management tab includes two main sections:
1. **Branch Locations** - CRUD operations for branches (Create, Read, Update, Delete)
2. **Branch Settings** - System-wide branch configuration options

---

## 🗄️ **Required Database Tables**

### **1. `branches` Table (Primary Table)**

**Purpose**: Store branch/location information.

**Current Schema** (from `GENERAL_SETTINGS_REQUIREMENTS.md`):
```sql
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
```

**Fields Used in Branch Management Tab**:
- `id` - Primary key
- `name` - Branch name (from form: `branchFormData.name`)
- `code` - Branch code (from form: `branchFormData.code`)
- `address` - Full address (from form: `branchFormData.address`)
- `city` - City (from form: `branchFormData.city`)
- `province` - Province (from form: `branchFormData.province`)
- `postal_code` - Postal code (from form: `branchFormData.postalCode`)
- `phone` - Phone number (from form: `branchFormData.phone`)
- `email` - Email address (from form: `branchFormData.email`)
- `manager_id` - Foreign key to `users` table (from form: `branchFormData.managerId`)
- `is_active` - Active status (from form: `branchFormData.status` === 'active')
- `operating_hours` - JSONB field storing operating hours (from form: `branchFormData.operatingHours`)
- `branch_type` - Type of branch (from form: `branchFormData.type`)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Operating Hours JSON Structure** (Database Format):
```json
{
  "monday": { "open": "08:00", "close": "18:00" },
  "tuesday": { "open": "08:00", "close": "23:00" },
  "wednesday": { "open": "08:00", "close": "09:00" },
  "thursday": { "open": "08:00", "close": "18:00" },
  "friday": { "open": "07:00", "close": "08:00" },
  "saturday": { "open": "08:00", "close": "17:00" },
  "sunday": { "open": "08:00", "close": "23:00" }
}
```

**Important Notes**:
- Only days that are **open** are included in the JSON
- Days that are **closed** are **omitted** from the JSON (not included at all)
- Keys are: `open` and `close` (not `start` and `end`)
- Format: `"HH:MM"` (24-hour format)
- If `operating_hours` is `null`, the branch has no operating hours configured

**Example from Database**:
```json
{
  "friday": { "open": "07:00", "close": "08:00" },
  "monday": { "open": "08:00", "close": "18:00" },
  "sunday": { "open": "08:00", "close": "23:00" },
  "tuesday": { "open": "08:00", "close": "23:00" },
  "saturday": { "open": "08:00", "close": "17:00" },
  "thursday": { "open": "08:00", "close": "18:00" },
  "wednesday": { "open": "08:00", "close": "09:00" }
}
```

**Required Indexes**:
```sql
CREATE INDEX idx_branches_is_active ON branches(is_active);
CREATE INDEX idx_branches_manager_id ON branches(manager_id);
CREATE INDEX idx_branches_code ON branches(code);
```

**RLS Policies**:
```sql
-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read branches
CREATE POLICY "Authenticated users can read branches"
ON branches FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert/update/delete branches
CREATE POLICY "Admins can manage branches"
ON branches FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'owner')
  )
);
```

---

### **2. `users` Table (Referenced Table)**

**Purpose**: Reference table for branch managers and user assignment.

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

### **3. `system_settings` Table (For Branch Settings)**

**Purpose**: Store branch-related system settings.

[{"idx":4,"id":"179dbbc9-7e07-4b96-945f-b2b35b5daf95","key":"app_settings","value":"{\"hr\": {\"payrollPeriod\": \"monthly\", \"enableTaxComputation\": false, \"includeSSSDeductions\": false, \"lateThresholdMinutes\": 15, \"maxLeaveDaysPerMonth\": 2, \"requireLeaveApproval\": false, \"autoMarkLateEmployees\": false, \"enableLeaveManagement\": false, \"includeAllowanceInPay\": false, \"enableOvertimeTracking\": false, \"enableHRReportsDashboard\": false, \"enablePerformanceReviews\": false, \"includeAttendanceSummary\": false, \"includePagIBIGDeductions\": false, \"enableEmployeeSelfService\": false, \"enableDeductionForAbsences\": false, \"includePhilHealthDeductions\": false}, \"pwa\": {\"pwaName\": \"Agrivet Kiosk\", \"pwaTheme\": \"dark-green\", \"pickupEnabled\": true, \"deliveryEnabled\": true, \"maintenanceMode\": false, \"onlineOrderingEnabled\": true, \"defaultBranchForOrders\": \"main\", \"pushNotificationsEnabled\": true}, \"data\": {\"autoBackup\": true, \"auditLogging\": true, \"exportFormat\": \"csv\", \"backupLocation\": \"cloud\", \"dataEncryption\": true, \"backupFrequency\": \"daily\", \"retentionPeriod\": 365}, \"general\": {\"appName\": \"AGRIVET Admin Dashboard\", \"autoSave\": true, \"currency\": \"PHP\", \"brandColor\": \"#3aa15e\", \"dateFormat\": \"YYYY-MM-DD\", \"compactView\": false, \"companyLogo\": \"https://prhxgpbqkpdnjpmxndyp.supabase.co/storage/v1/object/public/settings/settings/company-logo-1762352671228.jpg\", \"companyName\": \"Tiongson\", \"contactEmail\": \"admin@agrivet.com\", \"itemsPerPage\": 25, \"showTooltips\": true, \"supportPhone\": \"+63 2 8123 4567\", \"defaultBranch\": \"\", \"receiptFooter\": \"Visit us again soon!\", \"receiptHeader\": \"Thank you for your business!\", \"companyAddress\": \"123 Business St, Manila, Philippines\", \"showLogoOnReceipt\": true, \"receiptNumberPrefix\": \"RCP\"}, \"app_name\": \"AGRIVET Admin Dashboard\", \"currency\": \"PHP\", \"pwa_logo\": null, \"pwa_name\": \"Agrivet Kiosk\", \"security\": {\"ipBanlist\": [], \"require2FA\": false, \"requireMFA\": true, \"ipWhitelist\": [], \"mfaAppliesTo\": {\"admin\": true, \"owner\": true, \"cashier\": true, \"manager\": true, \"superAdmin\": true}, \"loginAttempts\": 5, \"sessionTimeout\": 1, \"lockoutDuration\": 15, \"passwordMinLength\": 8, \"auditLogVisibility\": true, \"passwordExpiration\": 90, \"notifyOwnerOnNewDevice\": true, \"passwordRequireSpecial\": true, \"passwordRequireMixedCase\": false, \"requireEmailVerification\": false, \"allowLoginOnlyVerifiedBrowsers\": true}, \"auto_save\": true, \"pwa_theme\": \"dark-green\", \"ip_banlist\": [], \"auto_backup\": true, \"bcc_manager\": true, \"brand_color\": \"#3aa15e\", \"date_format\": \"YYYY-MM-DD\", \"pwa_version\": \"1.0.5\", \"require_2fa\": false, \"compact_view\": false, \"company_logo\": \"https://prhxgpbqkpdnjpmxndyp.supabase.co/storage/v1/object/public/settings/settings/company-logo-1762352671228.jpg\", \"company_name\": \"Tiongson\", \"ip_whitelist\": [], \"require2_f_a\": false, \"sales_alerts\": true, \"audit_logging\": true, \"contact_email\": \"admin@agrivet.com\", \"export_format\": \"csv\", \"manager_email\": \"manager@agrivet.com\", \"notifications\": {\"bccManager\": true, \"salesAlerts\": true, \"managerEmail\": \"manager@agrivet.com\", \"systemAlerts\": true, \"lowStockAlerts\": true, \"newOrderAlerts\": true, \"smsNotifications\": false, \"pushNotifications\": true, \"emailNotifications\": true, \"staffActivityAlerts\": true}, \"require_m_f_a\": true, \"show_tooltips\": true, \"support_phone\": \"+63 2 8123 4567\", \"system_alerts\": true, \"default_branch\": \"\", \"items_per_page\": 25, \"login_attempts\": 5, \"mfa_applies_to\": {\"cashier\": true, \"superAdmin\": true}, \"payroll_period\": \"monthly\", \"pickup_enabled\": true, \"receipt_footer\": \"Visit us again soon!\", \"receipt_header\": \"Thank you for your business!\", \"selected_theme\": \"light\", \"backup_location\": \"cloud\", \"company_address\": \"123 Business St, Manila, Philippines\", \"data_encryption\": true, \"session_timeout\": 1, \"backup_frequency\": \"daily\", \"delivery_enabled\": true, \"lockout_duration\": 15, \"low_stock_alerts\": true, \"maintenance_mode\": false, \"new_order_alerts\": true, \"retention_period\": 365, \"selected_language\": \"en\", \"selected_timezone\": \"Asia/Manila\", \"sms_notifications\": false, \"push_notifications\": true, \"email_notifications\": true, \"password_expiration\": 90, \"password_min_length\": 8, \"audit_log_visibility\": true, \"show_logo_on_receipt\": true, \"receipt_number_prefix\": \"RCP\", \"staff_activity_alerts\": true, \"enable_tax_computation\": false, \"include_sss_deductions\": true, \"late_threshold_minutes\": 15, \"require_leave_approval\": false, \"enable_leave_management\": false, \"online_ordering_enabled\": true, \"auto_mark_late_employees\": false, \"enable_overtime_tracking\": false, \"include_allowance_in_pay\": false, \"include_s_s_s_deductions\": false, \"max_leave_days_per_month\": 2, \"password_require_special\": true, \"default_branch_for_orders\": \"main\", \"enable_performance_reviews\": false, \"include_attendance_summary\": false, \"include_pagibig_deductions\": true, \"notify_owner_on_new_device\": true, \"push_notifications_enabled\": true, \"require_email_verification\": false, \"enable_hr_reports_dashboard\": false, \"password_require_mixed_case\": false, \"enable_employee_self_service\": false, \"enable_h_r_reports_dashboard\": false, \"enable_deduction_for_absences\": false, \"include_philhealth_deductions\": true, \"include_pag_i_b_i_g_deductions\": false, \"include_phil_health_deductions\": false, \"allow_login_only_verified_browsers\": true}","description":"Main application settings","is_public":false,"updated_by":"b617bc24-4d13-4da4-acee-a7aff1e973f8","updated_at":"2025-10-28 11:06:09.656059+00"}]
---


---

### **5. Related Tables (For Full Branch Functionality)**

These tables are **not directly part of Branch Management tab** but are needed for branch-related features:

#### **A. `inventory` Table**
create table public.inventory (
  id uuid not null default gen_random_uuid (),
  branch_id uuid not null,
  quantity_on_hand numeric(10, 2) not null default 0,
  quantity_reserved numeric(10, 2) not null default 0,
  quantity_available numeric GENERATED ALWAYS as ((quantity_on_hand - quantity_reserved)) STORED (10, 2) null,
  reorder_level numeric(10, 2) not null default 0,
  max_stock_level numeric(10, 2) not null default 0,
  last_counted timestamp with time zone null,
  updated_at timestamp with time zone null default now(),
  base_unit character varying(20) null default 'piece'::character varying,
  product_id uuid null,
  constraint inventory_pkey primary key (id),
  constraint inventory_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint inventory_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

#### **C. `inventory_movements` Table** (If inter-branch transfers enabled)
```sql
create table public.inventory_movements (
  id uuid not null default gen_random_uuid (),
  inventory_id uuid null,
  product_id uuid not null,
  branch_id uuid not null,
  movement_type character varying(50) not null,
  quantity numeric(10, 2) not null,
  reference_number character varying(100) null,
  reference_id uuid null,
  movement_date timestamp with time zone not null default now(),
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint inventory_movements_pkey primary key (id),
  constraint inventory_movements_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint inventory_movements_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint inventory_movements_inventory_id_fkey foreign KEY (inventory_id) references inventory (id) on delete set null,
  constraint inventory_movements_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint inventory_movements_type_check check (
    (
      (movement_type)::text = any (
        array[
          'purchase'::text,
          'sale'::text,
          'adjustment'::text,
          'transfer_in'::text,
          'transfer_out'::text,
          'return'::text,
          'damage'::text,
          'expired'::text,
          'count_adjustment'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_inventory_movements_product_id on public.inventory_movements using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_movements_branch_id on public.inventory_movements using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_movements_movement_date on public.inventory_movements using btree (movement_date desc) TABLESPACE pg_default;
```

#### **D. `pos_terminals` Table**
create table public.pos_terminals (
  id uuid not null default gen_random_uuid (),
  terminal_name character varying(100) not null,
  terminal_code character varying(50) not null,
  branch_id uuid not null,
  status character varying(20) not null default 'active'::character varying,
  assigned_user_id uuid null,
  last_sync timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  notes text null,
  constraint pos_terminals_pkey primary key (id),
  constraint pos_terminals_code_key unique (terminal_code),
  constraint pos_terminals_assigned_user_id_fkey foreign KEY (assigned_user_id) references users (id),
  constraint pos_terminals_branch_id_fkey foreign KEY (branch_id) references branches (id)
) TABLESPACE pg_default;
---

## 🔧 **Functionality Mapping**

### **Branch List Card**
**Features**:
- ✅ List all branches
- ✅ Add new branch
- ✅ Edit existing branch
- ✅ Delete/deactivate branch
- ✅ View branch details

**Database Operations**:
- `SELECT * FROM branches WHERE is_active = true ORDER BY name`
- `INSERT INTO branches (...) VALUES (...)`
- `UPDATE branches SET ... WHERE id = ?`
- `UPDATE branches SET is_active = false WHERE id = ?` (soft delete)

**Required Tables**:
- ✅ `branches` - Primary table
- ✅ `users` - For manager lookup and display

---

### **Branch Settings Card**
**Features**:
- ✅ Allow inter-branch transfers (checkbox)
- ✅ Share inventory across branches (checkbox)
- ✅ Enable branch-specific pricing (checkbox)

**Database Operations**:
- `SELECT setting_value FROM system_settings WHERE setting_key = 'branch_settings'`
- `INSERT/UPDATE system_settings SET setting_value = '{...}' WHERE setting_key = 'branch_settings'`

**Required Tables**:
- ✅ `system_settings` - Store branch settings

**Related Tables** (if features enabled):
- 🔄 `inventory_transfers` - For inter-branch transfers
- 🔄 `branch_pricing` - For branch-specific pricing
- ✅ `inventory` - Already exists (has `branch_id`)

---

## 📊 **Complete SQL Setup Script**

```sql
-- =====================================================
-- BRANCH MANAGEMENT TABLES SETUP
-- =====================================================

-- 1. Ensure branches table exists with all required fields
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  province VARCHAR(50) NOT NULL,
  postal_code VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  operating_hours JSONB,
  branch_type VARCHAR(20) DEFAULT 'satellite',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT branches_branch_type_check CHECK (
    branch_type IN ('main', 'satellite')
  )
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_branch_type ON branches(branch_type);

-- 3. Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Authenticated users can read branches" ON branches;
CREATE POLICY "Authenticated users can read branches"
ON branches FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage branches" ON branches;
CREATE POLICY "Admins can manage branches"
ON branches FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'owner')
  )
);

-- 5. Ensure system_settings table exists (for branch settings)
-- (Should already exist from General Settings setup)

-- 6. Insert default branch settings (if using system_settings)
INSERT INTO system_settings (setting_key, setting_value, setting_category, description)
VALUES (
  'branch_settings',
  '{"allowInterBranchTransfers": false, "shareInventoryAcrossBranches": false, "enableBranchSpecificPricing": false}'::jsonb,
  'branches',
  'Branch management settings'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_branches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_branches_updated_at ON branches;
CREATE TRIGGER trigger_update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_branches_updated_at();

-- 9. Optional: Create branch_pricing table (if branch-specific pricing enabled)
CREATE TABLE IF NOT EXISTS public.branch_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT branch_pricing_unique UNIQUE (branch_id, product_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_pricing_branch_id ON branch_pricing(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_pricing_product_variant_id ON branch_pricing(product_variant_id);

-- 10. Optional: Create inventory_transfers table (if inter-branch transfers enabled)
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id UUID NOT NULL REFERENCES branches(id),
  to_branch_id UUID NOT NULL REFERENCES branches(id),
  product_variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity DECIMAL(10, 2) NOT NULL,
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) DEFAULT 'pending',
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT inventory_transfers_different_branches CHECK (from_branch_id != to_branch_id),
  CONSTRAINT inventory_transfers_status_check CHECK (
    status IN ('pending', 'in_transit', 'completed', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_inventory_transfers_from_branch ON inventory_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_to_branch ON inventory_transfers(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status ON inventory_transfers(status);
```

---

## ✅ **Functionality Checklist**

### **Branch List Card**:
- [ ] `branches` table exists with all required fields
- [ ] RLS policies allow authenticated users to read branches
- [ ] RLS policies allow admins to create/update/delete branches
- [ ] `users` table exists for manager lookup
- [ ] Can fetch all active branches
- [ ] Can create new branch
- [ ] Can update existing branch
- [ ] Can deactivate branch (soft delete)
- [ ] Branch code uniqueness enforced
- [ ] Manager assignment validated

### **Branch Settings Card**:
- [ ] `system_settings` table exists
- [ ] Branch settings stored in `system_settings` table
- [ ] Can read branch settings
- [ ] Can update branch settings
- [ ] Settings persist after page refresh

### **Optional Features** (If enabled):
- [ ] `branch_pricing` table exists (for branch-specific pricing)
- [ ] `inventory_transfers` table exists (for inter-branch transfers)
- [ ] `inventory` table has `branch_id` column
- [ ] Inter-branch transfer functionality works
- [ ] Branch-specific pricing functionality works

---

## 🔄 **Data Flow**

### **Creating a Branch**:
1. User fills form in Branch Management tab
2. Form data: `branchFormData` (name, code, address, city, province, postalCode, phone, email, operatingHours, managerId, status, type)
3. API call: `INSERT INTO branches (...) VALUES (...)`
4. Success: Branch appears in branch list
5. Settings: Branch settings saved to `system_settings` table

### **Updating a Branch**:
1. User clicks edit on branch item
2. Form populated with existing branch data
3. User modifies fields
4. API call: `UPDATE branches SET ... WHERE id = ?`
5. Success: Branch list refreshes with updated data

### **Deleting a Branch**:
1. User clicks delete on branch item
2. Confirmation dialog
3. API call: `UPDATE branches SET is_active = false WHERE id = ?` (soft delete)
4. Success: Branch removed from active list

### **Branch Settings**:
1. User toggles checkbox in Branch Settings card
2. Settings object updated
3. API call: `UPDATE system_settings SET setting_value = '{...}' WHERE setting_key = 'branch_settings'`
4. Success: Settings persist across sessions

---

## 📝 **API Service Methods Needed**

### **Branch Service** (`branchService.ts` or similar):

```typescript
// Get all branches
async getAllBranches(): Promise<Branch[]>

// Get branch by ID
async getBranchById(branchId: string): Promise<Branch | null>

// Create branch
async createBranch(branchData: CreateBranchData): Promise<Branch>

// Update branch
async updateBranch(branchId: string, branchData: UpdateBranchData): Promise<Branch>

// Delete branch (soft delete)
async deleteBranch(branchId: string): Promise<void>

// Get branch settings
async getBranchSettings(): Promise<BranchSettings>

// Update branch settings
async updateBranchSettings(settings: BranchSettings): Promise<void>

// Get users who can be managers
async getManagerCandidates(): Promise<User[]>
```

---

## 🎯 **Summary**

### **Required Tables** (Core):
1. ✅ **`branches`** - Primary table for branch data
2. ✅ **`users`** - Reference table for managers
3. ✅ **`system_settings`** - Store branch settings

### **Optional Tables** (For Advanced Features):
4. 🔄 **`branch_pricing`** - For branch-specific pricing
5. 🔄 **`inventory_transfers`** - For inter-branch transfers
6. ✅ **`inventory`** - Already exists (needs `branch_id` column)
7. ✅ **`pos_terminals`** - Already exists (links terminals to branches)

### **Current Status**:
- ✅ `branches` table exists (from General Settings requirements)
- ✅ `users` table exists
- ✅ `system_settings` table exists
- ⚠️ Branch Management tab shows **hardcoded sample data** - needs implementation
- ⚠️ Add/Edit branch modal **not implemented** - needs implementation
- ⚠️ Branch settings **not connected to database** - needs implementation

---

## 🚀 **Next Steps**

1. ✅ **Verify tables exist** - Run the SQL setup script above
2. ⚠️ **Implement branch CRUD operations** - Create API service methods
3. ⚠️ **Implement Add/Edit branch modal** - Complete the UI
4. ⚠️ **Connect branch settings to database** - Save/load from `system_settings`
5. ⚠️ **Add validation** - Branch code uniqueness, manager validation
6. ⚠️ **Add error handling** - User-friendly error messages
7. ⚠️ **Add success notifications** - Confirm actions to user

---

**Status**: Tables exist, but Branch Management tab needs **full implementation** to be functional.

