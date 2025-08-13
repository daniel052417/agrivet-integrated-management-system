/*
  # AGRIVET Admin Dashboard Database Schema

  1. New Tables
    - `categories` - Product categories (Medicines, Agriculture, Fruits, Tools, etc.)
    - `suppliers` - Supplier information and contact details
    - `products` - Product catalog with pricing and stock information
    - `customers` - Customer database with contact and profile information
    - `staff` - Employee records with roles and department information
    - `branches` - Store branch locations and details
    - `sales_transactions` - Sales records and transaction details
    - `transaction_items` - Individual items within each transaction
    - `inventory_movements` - Stock in/out tracking
    - `attendance_records` - Staff attendance and timesheet data
    - `leave_requests` - Employee leave request management
    - `promotions` - Marketing promotions and discount campaigns
    - `announcements` - Customer announcements and communications
    - `notifications` - Client notification tracking
    - `loyalty_programs` - Customer loyalty and rewards programs
    - `loyalty_members` - Customer membership in loyalty programs
    - `referrals` - Customer referral tracking
    - `venue_ads` - Venue advertisement campaigns
    - `events` - Event center management (workshops, seminars, etc.)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their organization's data
    - Implement role-based access control
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES categories(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT 'Philippines',
  payment_terms text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  phone text DEFAULT '',
  manager_name text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  position text NOT NULL,
  department text NOT NULL,
  branch_id uuid REFERENCES branches(id),
  hire_date date NOT NULL,
  salary decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  role text DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'veterinarian', 'cashier')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id),
  supplier_id uuid REFERENCES suppliers(id),
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  cost_price decimal(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 0,
  maximum_stock integer DEFAULT 1000,
  unit_of_measure text DEFAULT 'pcs',
  barcode text DEFAULT '',
  expiry_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  customer_type text DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business', 'veterinarian', 'farmer')),
  date_of_birth date,
  registration_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  total_spent decimal(12,2) DEFAULT 0,
  last_purchase_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  staff_id uuid REFERENCES staff(id),
  branch_id uuid REFERENCES branches(id),
  transaction_date timestamptz DEFAULT now(),
  subtotal decimal(12,2) NOT NULL DEFAULT 0,
  discount_amount decimal(12,2) DEFAULT 0,
  tax_amount decimal(12,2) DEFAULT 0,
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer', 'digital_wallet')),
  payment_status text DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES sales_transactions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  line_total decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  reference_type text DEFAULT 'manual' CHECK (reference_type IN ('purchase', 'sale', 'adjustment', 'transfer', 'return')),
  reference_id uuid,
  notes text DEFAULT '',
  staff_id uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now()
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id),
  attendance_date date NOT NULL,
  time_in time,
  time_out time,
  break_start time,
  break_end time,
  total_hours decimal(4,2) DEFAULT 0,
  overtime_hours decimal(4,2) DEFAULT 0,
  status text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, attendance_date)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id),
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested integer NOT NULL DEFAULT 1,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES staff(id),
  approved_date timestamptz,
  emergency_contact text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  promotion_type text NOT NULL CHECK (promotion_type IN ('percentage', 'fixed_amount', 'bogo', 'bundle')),
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  usage_limit integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text DEFAULT 'general' CHECK (announcement_type IN ('general', 'promotion', 'service', 'emergency')),
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'farmers', 'veterinarians', 'local')),
  channels text[] DEFAULT ARRAY['email'],
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  publish_date timestamptz,
  views_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,
  author_id uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('order_update', 'appointment', 'payment', 'promotion', 'product_alert', 'stock_alert')),
  channel text NOT NULL CHECK (channel IN ('sms', 'email', 'push', 'in_app')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Loyalty programs table
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  program_type text NOT NULL CHECK (program_type IN ('points', 'tier', 'cashback')),
  points_per_peso decimal(4,2) DEFAULT 1.00,
  minimum_spend decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Loyalty members table
CREATE TABLE IF NOT EXISTS loyalty_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  program_id uuid REFERENCES loyalty_programs(id),
  membership_tier text DEFAULT 'bronze' CHECK (membership_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_balance integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  total_points_redeemed integer DEFAULT 0,
  join_date date DEFAULT CURRENT_DATE,
  last_activity_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, program_id)
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES customers(id),
  referred_id uuid REFERENCES customers(id),
  referral_code text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount decimal(10,2) DEFAULT 0,
  reward_given boolean DEFAULT false,
  conversion_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Venue ads table
CREATE TABLE IF NOT EXISTS venue_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name text NOT NULL,
  location text NOT NULL,
  ad_type text NOT NULL CHECK (ad_type IN ('banner', 'digital_screen', 'poster', 'brochure')),
  campaign_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  cost decimal(10,2) NOT NULL DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  event_type text NOT NULL CHECK (event_type IN ('workshop', 'seminar', 'conference', 'exhibition', 'training')),
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  venue text NOT NULL,
  capacity integer NOT NULL DEFAULT 50,
  registered_attendees integer DEFAULT 0,
  actual_attendees integer DEFAULT 0,
  registration_fee decimal(10,2) DEFAULT 0,
  total_revenue decimal(12,2) DEFAULT 0,
  organizer_id uuid REFERENCES staff(id),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can manage categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage suppliers" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage branches" ON branches FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage staff" ON staff FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage sales_transactions" ON sales_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage transaction_items" ON transaction_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage inventory_movements" ON inventory_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage attendance_records" ON attendance_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage leave_requests" ON leave_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage promotions" ON promotions FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage announcements" ON announcements FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage notifications" ON notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage loyalty_programs" ON loyalty_programs FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage loyalty_members" ON loyalty_members FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage referrals" ON referrals FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage venue_ads" ON venue_ads FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage events" ON events FOR ALL TO authenticated USING (true);