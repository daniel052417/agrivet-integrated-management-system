/*
  # Create Database Indexes for Performance

  1. Indexes
    - Primary lookup indexes for foreign keys
    - Search indexes for commonly queried fields
    - Composite indexes for complex queries
    - Date-based indexes for time-series data

  2. Performance Optimization
    - Improve query performance for dashboard analytics
    - Optimize search functionality
    - Speed up reporting queries
*/

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Sales transactions indexes
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_staff ON sales_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_transactions(payment_status);

-- Transaction items indexes
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON transaction_items(product_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- Inventory movements indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_staff ON inventory_movements(staff_id);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_staff ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_type ON leave_requests(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

-- Loyalty members indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_program ON loyalty_members(program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier ON loyalty_members(membership_tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_active ON loyalty_members(is_active);