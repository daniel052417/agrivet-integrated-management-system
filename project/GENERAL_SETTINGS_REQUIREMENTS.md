# General Settings Tab - Requirements for Full Functionality

This document outlines all the database tables, storage buckets, and configurations needed for the General Settings tab in `SettingsPage.tsx` to be fully functional.

---

## 📋 **Overview**

The General Settings tab includes three main sections:
1. **Business Information** - Company details and logo
2. **System Preferences** - Application configuration
3. **Receipt Settings** - Receipt customization

---

## 🗄️ **1. Database Tables Required**

### **A. `system_settings` Table**

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
---

### **B. `branches` Table**

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

### **C. `users` Table** (for `updated_by` tracking)
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

## 📦 **2. Supabase Storage Buckets Required**

### **A. Storage Bucket for Company Logo**

**Purpose**: Store uploaded company logo images.

**Required Buckets** (the code tries both, in order):
1. **`public` bucket** (fallback)
2. **`settings` bucket** (preferred)

**Setup Instructions**:

1. **Create the `settings` bucket** (recommended):
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'settings',
     'settings',
     true,  -- Public bucket
     2097152,  -- 2MB limit
     ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
   );
   ```


---

## 🔧 **3. Service Configuration**

### **A. `settingsService.ts`**

**Status**: ✅ Already implemented

**Key Methods**:
- `getAllSettings()` - Fetches settings from `system_settings` table
- `updateSettings(settings)` - Saves settings to `system_settings` table
- `getHRSettings()` - Returns HR-specific settings

**Configuration**:
- Uses `system_settings` table with `setting_key = 'app_settings'`
- Stores settings as JSON in `setting_value` field
- Caches settings for 5 minutes
- Automatically determines `updated_by` user ID

---

## ✅ **4. Checklist for Full Functionality**

### **Database Setup**:
- [ ] `system_settings` table exists with proper schema
- [ ] RLS policies are enabled and configured
- [ ] Initial `app_settings` record exists (or will be created on first save)
- [ ] `branches` table exists with at least one active branch
- [ ] `users` table exists with at least one active admin user

### **Storage Setup**:
- [ ] `settings` storage bucket created (or `public` bucket available)
- [ ] Storage bucket is set to **public** (for public URL access)
- [ ] File size limit: **2MB** maximum
- [ ] Allowed MIME types: `image/png`, `image/jpeg`, `image/jpg`, `image/svg+xml`, `image/webp`
- [ ] RLS policies allow authenticated users to upload/read/delete

### **Code Configuration**:
- [ ] `settingsService.ts` is properly configured
- [ ] `supabase` client is initialized
- [ ] `simplifiedAuth` is working for user authentication

---

## 🚀 **5. Quick Setup SQL Script**

Run this script to set up everything needed:

```sql
-- 1. Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_category VARCHAR(50) NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(setting_category);

-- 3. Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy
DROP POLICY IF EXISTS "Authenticated users can manage system_settings" ON system_settings;
CREATE POLICY "Authenticated users can manage system_settings"
ON system_settings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Create settings storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'settings',
  'settings',
  true,
  2097152,  -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage policies
DROP POLICY IF EXISTS "Authenticated users can upload to settings" ON storage.objects;
CREATE POLICY "Authenticated users can upload to settings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'settings');

DROP POLICY IF EXISTS "Authenticated users can read from settings" ON storage.objects;
CREATE POLICY "Authenticated users can read from settings"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'settings');

DROP POLICY IF EXISTS "Authenticated users can delete from settings" ON storage.objects;
CREATE POLICY "Authenticated users can delete from settings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'settings');
```

---

## 🐛 **6. Common Issues & Troubleshooting**

### **Issue**: Settings not saving
- **Check**: `system_settings` table exists and RLS policies allow writes
- **Check**: `updated_by` field can find a valid user ID
- **Check**: Browser console for errors

### **Issue**: Logo upload fails
- **Check**: Storage bucket (`settings` or `public`) exists and is public
- **Check**: RLS policies allow authenticated users to upload
- **Check**: File size is under 2MB
- **Check**: File type is one of: PNG, JPG, SVG, WebP

### **Issue**: Branch dropdown is empty
- **Check**: `branches` table exists
- **Check**: At least one branch has `is_active = true`
- **Check**: RLS policies allow reading from `branches` table

### **Issue**: Settings not loading
- **Check**: `system_settings` table has a record with `setting_key = 'app_settings'`
- **Check**: RLS policies allow reading from `system_settings` table
- **Check**: `settingsService` is working (check browser console)

---

## 📝 **7. Data Structure**

The General Settings are stored in `system_settings` as:

```json
{
  "general": {
    "appName": "string",
    "companyName": "string",
    "contactEmail": "string",
    "supportPhone": "string",
    "companyAddress": "string",
    "companyLogo": "string | null",  // URL to uploaded logo
    "brandColor": "string",  // Hex color
    "currency": "string",  // PHP, USD, EUR, JPY
    "showTooltips": "boolean",
    "compactView": "boolean",
    "itemsPerPage": "number",  // 10, 25, 50, 100
    "dateFormat": "string",  // YYYY-MM-DD, DD/MM/YYYY, etc.
    "receiptHeader": "string",
    "receiptFooter": "string",
    "showLogoOnReceipt": "boolean",
    "receiptNumberPrefix": "string",  // Max 10 chars
    "defaultBranch": "string"  // UUID of branch
  }
}
```

---

## ✅ **Status: Ready for Production**

Once all the above requirements are met, the General Settings tab will be **fully functional** with:
- ✅ Business information management
- ✅ Company logo upload and storage
- ✅ System preferences configuration
- ✅ Branch selection for default dashboard
- ✅ Receipt settings customization
- ✅ All settings persisted to database
- ✅ Settings loaded on page mount









