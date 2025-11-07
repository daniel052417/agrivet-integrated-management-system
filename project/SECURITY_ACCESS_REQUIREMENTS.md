# Security & Access Tab - Database Requirements

## 📋 **Overview**

This document outlines the database tables and schema required for the **Security & Access** tab in `SettingsPage.tsx` to be fully functional.

---

## ✅ **Required Database Tables**

### **1. `system_settings` (Primary Table)**

**Purpose**: Stores all security and access control settings.
create table public.system_settings (
  id uuid not null default gen_random_uuid (),
  key character varying(100) not null,
  value jsonb not null,
  description text null,
  is_public boolean null default false,
  updated_by uuid not null,
  updated_at timestamp with time zone null default now(),
  constraint system_settings_pkey primary key (id),
  constraint system_settings_key_key unique (key),
  constraint system_settings_updated_by_fkey foreign KEY (updated_by) references users (id)
) TABLESPACE pg_default;

**Security Settings Structure** (stored in `value` JSONB):
[{"idx":4,"id":"179dbbc9-7e07-4b96-945f-b2b35b5daf95","key":"app_settings","value":"{\"hr\": {\"payrollPeriod\": \"monthly\", \"enableTaxComputation\": false, \"includeSSSDeductions\": false, \"lateThresholdMinutes\": 15, \"maxLeaveDaysPerMonth\": 2, \"requireLeaveApproval\": false, \"autoMarkLateEmployees\": false, \"enableLeaveManagement\": false, \"includeAllowanceInPay\": false, \"enableOvertimeTracking\": false, \"enableHRReportsDashboard\": false, \"enablePerformanceReviews\": false, \"includeAttendanceSummary\": false, \"includePagIBIGDeductions\": false, \"enableEmployeeSelfService\": false, \"enableDeductionForAbsences\": false, \"includePhilHealthDeductions\": false}, \"pwa\": {\"pwaName\": \"Agrivet Kiosk\", \"pwaTheme\": \"dark-green\", \"pickupEnabled\": true, \"deliveryEnabled\": true, \"maintenanceMode\": false, \"onlineOrderingEnabled\": true, \"defaultBranchForOrders\": \"main\", \"pushNotificationsEnabled\": true}, \"data\": {\"autoBackup\": true, \"auditLogging\": true, \"exportFormat\": \"csv\", \"backupLocation\": \"cloud\", \"dataEncryption\": true, \"backupFrequency\": \"daily\", \"retentionPeriod\": 365}, \"general\": {\"appName\": \"AGRIVET Admin Dashboard\", \"autoSave\": true, \"currency\": \"PHP\", \"brandColor\": \"#3aa15e\", \"dateFormat\": \"YYYY-MM-DD\", \"compactView\": false, \"companyLogo\": \"https://prhxgpbqkpdnjpmxndyp.supabase.co/storage/v1/object/public/settings/settings/company-logo-1762352671228.jpg\", \"companyName\": \"Tiongson\", \"contactEmail\": \"admin@agrivet.com\", \"itemsPerPage\": 25, \"showTooltips\": true, \"supportPhone\": \"+63 2 8123 4567\", \"defaultBranch\": \"\", \"receiptFooter\": \"Visit us again soon!\", \"receiptHeader\": \"Thank you for your business!\", \"companyAddress\": \"123 Business St, Manila, Philippines\", \"showLogoOnReceipt\": true, \"receiptNumberPrefix\": \"RCP\"}, \"app_name\": \"AGRIVET Admin Dashboard\", \"currency\": \"PHP\", \"pwa_logo\": null, \"pwa_name\": \"Agrivet Kiosk\", \"security\": {\"ipBanlist\": [], \"require2FA\": false, \"ipWhitelist\": [], \"loginAttempts\": 5, \"sessionTimeout\": 30, \"lockoutDuration\": 15, \"passwordMinLength\": 8, \"auditLogVisibility\": true, \"passwordExpiration\": 90, \"passwordRequireSpecial\": true}, \"auto_save\": true, \"pwa_theme\": \"dark-green\", \"ip_banlist\": [], \"auto_backup\": true, \"bcc_manager\": true, \"brand_color\": \"#3aa15e\", \"date_format\": \"YYYY-MM-DD\", \"pwa_version\": \"1.0.5\", \"require_2fa\": false, \"compact_view\": false, \"company_logo\": \"https://prhxgpbqkpdnjpmxndyp.supabase.co/storage/v1/object/public/settings/settings/company-logo-1762352671228.jpg\", \"company_name\": \"Tiongson\", \"ip_whitelist\": [], \"require2_f_a\": false, \"sales_alerts\": true, \"audit_logging\": true, \"contact_email\": \"admin@agrivet.com\", \"export_format\": \"csv\", \"manager_email\": \"manager@agrivet.com\", \"notifications\": {\"bccManager\": true, \"salesAlerts\": true, \"managerEmail\": \"manager@agrivet.com\", \"systemAlerts\": true, \"lowStockAlerts\": true, \"newOrderAlerts\": true, \"smsNotifications\": false, \"pushNotifications\": true, \"emailNotifications\": true, \"staffActivityAlerts\": true}, \"show_tooltips\": true, \"support_phone\": \"+63 2 8123 4567\", \"system_alerts\": true, \"default_branch\": \"\", \"items_per_page\": 25, \"login_attempts\": 5, \"payroll_period\": \"monthly\", \"pickup_enabled\": true, \"receipt_footer\": \"Visit us again soon!\", \"receipt_header\": \"Thank you for your business!\", \"selected_theme\": \"light\", \"backup_location\": \"cloud\", \"company_address\": \"123 Business St, Manila, Philippines\", \"data_encryption\": true, \"session_timeout\": 30, \"backup_frequency\": \"daily\", \"delivery_enabled\": true, \"lockout_duration\": 15, \"low_stock_alerts\": true, \"maintenance_mode\": false, \"new_order_alerts\": true, \"retention_period\": 365, \"selected_language\": \"en\", \"selected_timezone\": \"Asia/Manila\", \"sms_notifications\": false, \"push_notifications\": true, \"email_notifications\": true, \"password_expiration\": 90, \"password_min_length\": 8, \"audit_log_visibility\": true, \"show_logo_on_receipt\": true, \"receipt_number_prefix\": \"RCP\", \"staff_activity_alerts\": true, \"enable_tax_computation\": false, \"include_sss_deductions\": true, \"late_threshold_minutes\": 15, \"require_leave_approval\": false, \"enable_leave_management\": false, \"online_ordering_enabled\": true, \"auto_mark_late_employees\": false, \"enable_overtime_tracking\": false, \"include_allowance_in_pay\": false, \"include_s_s_s_deductions\": false, \"max_leave_days_per_month\": 2, \"password_require_special\": true, \"default_branch_for_orders\": \"main\", \"enable_performance_reviews\": false, \"include_attendance_summary\": false, \"include_pagibig_deductions\": true, \"push_notifications_enabled\": true, \"enable_hr_reports_dashboard\": false, \"enable_employee_self_service\": false, \"enable_h_r_reports_dashboard\": false, \"enable_deduction_for_absences\": false, \"include_philhealth_deductions\": true, \"include_pag_i_b_i_g_deductions\": false, \"include_phil_health_deductions\": false}","description":"Main application settings","is_public":false,"updated_by":"b617bc24-4d13-4da4-acee-a7aff1e973f8","updated_at":"2025-10-28 11:06:09.656059+00"}]

**Backward Compatibility** (flat keys also supported):
- `session_timeout` (integer)
- `login_attempts` (integer)
- `lockout_duration` (integer)
- `require_email_verification` (boolean)
- `require_mfa` or `require_2fa` (boolean)
- `mfa_applies_to` (JSONB)
- `password_min_length` (integer)
- `password_require_special` (boolean)
- `password_require_mixed_case` (boolean)
- `allow_login_only_verified_browsers` (boolean)
- `notify_owner_on_new_device` (boolean)

---

### **2. `user_sessions` (For Logout All Sessions)**

**Purpose**: Tracks active user sessions. Required for "Logout All Sessions" functionality.

create table public.user_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  session_token character varying(255) not null,
  ip_address inet null,
  user_agent text null,
  device_info jsonb null,
  location_info jsonb null,
  current_page character varying(500) null,
  status character varying(20) null default 'active'::character varying,
  last_activity timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  expires_at timestamp with time zone not null,
  updated_at timestamp with time zone null default now(),
  is_active boolean null default true,
  logout_time timestamp with time zone null,
  login_method character varying(20) null default 'password'::character varying,
  mfa_used boolean null default false,
  risk_score character varying(10) null default 'low'::character varying,
  constraint user_sessions_pkey primary key (id),
  constraint user_sessions_session_token_key unique (session_token),
  constraint user_sessions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint login_method_check check (
    (
      (login_method)::text = any (
        (
          array[
            'password'::character varying,
            'mfa'::character varying,
            'sso'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint risk_score_check check (
    (
      (risk_score)::text = any (
        (
          array[
            'low'::character varying,
            'medium'::character varying,
            'high'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_sessions_logout_time on public.user_sessions using btree (logout_time) TABLESPACE pg_default;

create index IF not exists idx_user_sessions_login_method on public.user_sessions using btree (login_method) TABLESPACE pg_default;

create index IF not exists idx_user_sessions_risk_score on public.user_sessions using btree (risk_score) TABLESPACE pg_default;

create index IF not exists idx_user_sessions_created_at on public.user_sessions using btree (created_at desc) TABLESPACE pg_default;
---

### **3. `users` (For Logout All Sessions)**

**Purpose**: Stores user account information. Required for updating user status during logout.

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

## 🔧 **Required Functionality**

### **1. Settings Storage & Retrieval**

**Store Settings**:
- All security settings are saved to `system_settings` table
- Key: `'app_settings'`
- Value: JSONB object with nested `security` section
- Service: `settingsService.updateSettings()`

**Load Settings**:
- Fetch from `system_settings` WHERE `key = 'app_settings'`
- Parse JSONB `value.security` section
- Support both nested (`security.sessionTimeout`) and flat (`session_timeout`) keys
- Service: `settingsService.getAllSettings()`

### **2. Logout All Sessions**

**Function**: `handleLogoutAllSessions()`

**Steps**:
1. **Update `user_sessions`**:
   ```sql
   UPDATE user_sessions
   SET 
     is_active = false,
     status = 'inactive',
     logout_time = NOW(),
     updated_at = NOW()
   WHERE is_active = true;
   ```

2. **Update `users`**:
   ```sql
   UPDATE users
   SET 
     status = 'offline',
     current_session_id = NULL
   WHERE status != 'offline';
   ```

---

## 📊 **Database Schema Summary**

| Table | Purpose | Critical Columns |
|-------|---------|------------------|
| `system_settings` | Store security settings | `key`, `value` (JSONB) |
| `user_sessions` | Track active sessions | `is_active`, `status`, `logout_time` |
| `users` | User account management | `status`, `current_session_id` |

---

## 🔐 **RLS Policies Required**

### **`system_settings` Table**
```sql
-- Allow authenticated users to read settings
CREATE POLICY "Users can read system_settings"
ON system_settings FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Users can update system_settings"
ON system_settings FOR UPDATE
TO authenticated
USING (true);
```

### **`user_sessions` Table**
```sql
-- Allow authenticated users to update sessions
CREATE POLICY "Users can update user_sessions"
ON user_sessions FOR UPDATE
TO authenticated
USING (true);
```

### **`users` Table**
```sql
-- Allow authenticated users to update user status
CREATE POLICY "Users can update users"
ON users FOR UPDATE
TO authenticated
USING (true);
```

---

## ✅ **Verification Checklist**

- [ ] `system_settings` table exists with `key` and `value` (JSONB) columns
- [ ] `user_sessions` table exists with `is_active`, `status`, and `logout_time` columns
- [ ] `users` table exists with `status` and `current_session_id` columns
- [ ] RLS policies allow authenticated users to read/update these tables
- [ ] Indexes exist for performance (`is_active`, `status`, `user_id`)
- [ ] Foreign key constraints are properly set up

---

## 🚀 **Quick Setup SQL**

```sql
-- Ensure system_settings table exists
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure user_sessions has logout_time column
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS logout_time TIMESTAMP WITH TIME ZONE;

-- Ensure users has current_session_id column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL;

-- Ensure users has status column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_current_session_id ON users(current_session_id);
```

---

## 📝 **Notes**

1. **Settings Storage**: The Security & Access settings are stored as part of the larger `app_settings` JSONB object in `system_settings.value`. The `security` section contains all security-related settings.

2. **Backward Compatibility**: The code supports both nested (`security.sessionTimeout`) and flat (`session_timeout`) key formats for backward compatibility.

3. **Logout All Sessions**: This feature requires direct database access to `user_sessions` and `users` tables. Ensure proper RLS policies are in place.

4. **MFA Settings**: The `mfaAppliesTo` field is stored as a JSONB object with `owner`, `admin`, and `manager` boolean values.

5. **Future Enhancements**: Consider adding:
   - `verified_devices` table for browser/device tracking
   - `login_attempts` table for tracking failed login attempts per user
   - `email_verification_tokens` table for email verification workflow







