/*
  # App Settings and Password Reset Requests

  1. New Tables
    - app_settings: singleton-like table for global application configuration
    - password_reset_requests: staff password reset workflow

  2. Security
    - Enable RLS on both tables
    - Authenticated users can manage data (aligns with existing policy style)

  3. Indexes
    - Add useful indexes for common lookups
*/

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name text DEFAULT 'AGRIVET Admin Dashboard',
  company_name text DEFAULT 'AGRIVET Supply Co.',
  contact_email text DEFAULT 'admin@agrivet.com',
  support_phone text DEFAULT '',
  theme text DEFAULT 'light' CHECK (theme IN ('light','dark','auto')),
  language text DEFAULT 'en',
  timezone text DEFAULT 'Asia/Manila',
  currency text DEFAULT 'PHP',
  auto_save boolean DEFAULT true,
  show_tooltips boolean DEFAULT true,
  compact_view boolean DEFAULT false,
  items_per_page integer DEFAULT 25,
  date_format text DEFAULT 'YYYY-MM-DD',
  number_format text DEFAULT '1,234.56',
  notification_prefs jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Password reset requests
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  email text DEFAULT '',
  reason text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Policies (match existing style: allow authenticated to manage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'Users can manage app_settings'
  ) THEN
    CREATE POLICY "Users can manage app_settings" ON app_settings FOR ALL TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_reset_requests' AND policyname = 'Users can manage password_reset_requests'
  ) THEN
    CREATE POLICY "Users can manage password_reset_requests" ON password_reset_requests FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_at ON app_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_prr_staff ON password_reset_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_prr_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_prr_requested_at ON password_reset_requests(requested_at);


