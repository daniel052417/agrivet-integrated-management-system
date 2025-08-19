/*
  # Insert Sample Data for AGRIVET System

  1. Sample Data
    - Categories for different product types
    - Suppliers and branches
    - Staff members with different roles
    - Products across all categories
    - Sample customers and transactions
    - Attendance records and leave requests
    - Marketing campaigns and events

  2. Data Relationships
    - Proper foreign key relationships
    - Realistic business data
    - Consistent data patterns
*/

-- Insert Categories
INSERT INTO categories (name, description) VALUES
('Veterinary Medicines', 'Medical supplies and medicines for animals'),
('Agricultural Products', 'Seeds, fertilizers, and farming supplies'),
('Fresh Fruits', 'Fresh fruits and produce'),
('Tools & Equipment', 'Farming and veterinary tools'),
('Animal Feed', 'Feed and nutrition for various animals'),
('Pet Supplies', 'Supplies for domestic pets');

-- Insert Suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, city) VALUES
('MedVet Supplies Inc.', 'Dr. Roberto Santos', 'roberto@medvet.com', '+63 912 345 6789', '123 Medical Ave', 'Quezon City'),
('Green Valley Seeds Co.', 'Maria Gonzales', 'maria@greenvalley.com', '+63 918 765 4321', '456 Agriculture St', 'Laguna'),
('Fresh Harvest Farms', 'Juan Dela Cruz', 'juan@freshharvest.com', '+63 917 555 0123', '789 Farm Road', 'Batangas'),
('AgriTools Philippines', 'Carmen Lopez', 'carmen@agritools.ph', '+63 915 444 7890', '321 Industrial Blvd', 'Makati'),
('Premium Pet Care', 'Lisa Chen', 'lisa@premiumpet.com', '+63 916 333 2222', '654 Pet Street', 'Pasig');

-- Insert Branches
INSERT INTO branches (name, address, city, phone, manager_name) VALUES
('Main Branch - Quezon City', '100 EDSA Corner Quezon Ave', 'Quezon City', '+63 2 8123 4567', 'Maria Santos'),
('Branch 2 - Makati', '200 Ayala Avenue', 'Makati', '+63 2 8234 5678', 'Juan Dela Cruz'),
('Branch 3 - Cebu', '300 Colon Street', 'Cebu City', '+63 32 234 5678', 'Ana Rodriguez'),
('Warehouse - Laguna', '400 Industrial Complex', 'Laguna', '+63 49 345 6789', 'Carlos Martinez');

-- Insert Staff
INSERT INTO staff (employee_id, first_name, last_name, email, phone, position, department, branch_id, hire_date, salary, role) VALUES
('EMP-001', 'Maria', 'Santos', 'maria.santos@agrivet.com', '+63 912 345 6789', 'Store Manager', 'Operations', (SELECT id FROM branches WHERE name LIKE 'Main Branch%'), '2023-01-15', 45000.00, 'manager'),
('EMP-002', 'Juan', 'Dela Cruz', 'juan.delacruz@agrivet.com', '+63 918 765 4321', 'Veterinarian', 'Veterinary Services', (SELECT id FROM branches WHERE name LIKE 'Main Branch%'), '2023-03-20', 55000.00, 'veterinarian'),
('EMP-003', 'Ana', 'Rodriguez', 'ana.rodriguez@agrivet.com', '+63 917 555 0123', 'Sales Associate', 'Sales', (SELECT id FROM branches WHERE name LIKE 'Branch 2%'), '2023-06-10', 25000.00, 'staff'),
('EMP-004', 'Carlos', 'Martinez', 'carlos.martinez@agrivet.com', '+63 915 444 7890', 'Inventory Clerk', 'Warehouse', (SELECT id FROM branches WHERE name LIKE 'Warehouse%'), '2023-08-05', 28000.00, 'staff'),
('EMP-005', 'Lisa', 'Chen', 'lisa.chen@agrivet.com', '+63 916 333 2222', 'Cashier', 'Sales', (SELECT id FROM branches WHERE name LIKE 'Branch 3%'), '2023-09-12', 22000.00, 'cashier');

-- Insert Products
INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, cost_price, stock_quantity, minimum_stock) VALUES
('VET-ANT-001', 'Veterinary Antibiotics Premium', 'High-quality antibiotics for animal treatment', (SELECT id FROM categories WHERE name = 'Veterinary Medicines'), (SELECT id FROM suppliers WHERE name LIKE 'MedVet%'), 625.88, 375.53, 89, 50),
('AGR-FER-002', 'Organic Fertilizer Premium Grade', 'Premium organic fertilizer for sustainable farming', (SELECT id FROM categories WHERE name = 'Agricultural Products'), (SELECT id FROM suppliers WHERE name LIKE 'Green Valley%'), 613.43, 368.06, 156, 25),
('FRT-MNG-003', 'Fresh Mango Export Grade A', 'Premium export quality mangoes', (SELECT id FROM categories WHERE name = 'Fresh Fruits'), (SELECT id FROM suppliers WHERE name LIKE 'Fresh Harvest%'), 578.55, 277.70, 45, 20),
('TLS-PRN-004', 'Professional Pruning Tools Set', 'Complete set of professional pruning tools', (SELECT id FROM categories WHERE name = 'Tools & Equipment'), (SELECT id FROM suppliers WHERE name LIKE 'AgriTools%'), 681.26, 408.76, 23, 15),
('VET-VIT-005', 'Animal Vitamin Complex B12', 'Essential vitamin complex for animal health', (SELECT id FROM categories WHERE name = 'Veterinary Medicines'), (SELECT id FROM suppliers WHERE name LIKE 'MedVet%'), 421.58, 252.95, 67, 30),
('AGR-SED-006', 'Organic Tomato Seeds Premium', 'High-yield organic tomato seeds', (SELECT id FROM categories WHERE name = 'Agricultural Products'), (SELECT id FROM suppliers WHERE name LIKE 'Green Valley%'), 150.00, 90.00, 234, 100),
('PET-TOY-007', 'Interactive Pet Toy Set', 'Educational and fun toys for pets', (SELECT id FROM categories WHERE name = 'Pet Supplies'), (SELECT id FROM suppliers WHERE name LIKE 'Premium Pet%'), 345.00, 207.00, 78, 25),
('FEED-DOG-008', 'Premium Dog Food 20kg', 'High-nutrition dog food for all breeds', (SELECT id FROM categories WHERE name = 'Animal Feed'), (SELECT id FROM suppliers WHERE name LIKE 'Premium Pet%'), 1250.00, 750.00, 45, 20);

-- Insert Customers
INSERT INTO customers (customer_code, first_name, last_name, email, phone, address, city, customer_type, total_spent) VALUES
('CUST-001', 'Maria', 'Santos', 'maria.customer@email.com', '+63 912 111 2222', '123 Customer St', 'Quezon City', 'individual', 15600.00),
('CUST-002', 'Pedro', 'Martinez', 'pedro.martinez@email.com', '+63 918 333 4444', '456 Farm Road', 'Laguna', 'farmer', 24800.00),
('CUST-003', 'Green Valley Farm', 'Business', 'contact@greenvalley.com', '+63 917 555 6666', '789 Valley Road', 'Batangas', 'business', 245600.00),
('CUST-004', 'Pet Care Clinic', 'Business', 'admin@petcare.com', '+63 915 777 8888', '321 Clinic Ave', 'Makati', 'veterinarian', 189400.00),
('CUST-005', 'Carmen', 'Lopez', 'carmen.lopez@email.com', '+63 916 999 0000', '654 Residential St', 'Pasig', 'individual', 8900.00);

-- Insert Sample Sales Transactions
INSERT INTO sales_transactions (transaction_number, customer_id, staff_id, branch_id, subtotal, tax_amount, total_amount, payment_method) VALUES
('TXN-2024-001', (SELECT id FROM customers WHERE customer_code = 'CUST-001'), (SELECT id FROM staff WHERE employee_id = 'EMP-003'), (SELECT id FROM branches WHERE name LIKE 'Main Branch%'), 2200.00, 250.00, 2450.00, 'cash'),
('TXN-2024-002', (SELECT id FROM customers WHERE customer_code = 'CUST-002'), (SELECT id FROM staff WHERE employee_id = 'EMP-003'), (SELECT id FROM branches WHERE name LIKE 'Branch 2%'), 1650.00, 200.00, 1850.00, 'credit_card'),
('TXN-2024-003', (SELECT id FROM customers WHERE customer_code = 'CUST-003'), (SELECT id FROM staff WHERE employee_id = 'EMP-001'), (SELECT id FROM branches WHERE name LIKE 'Main Branch%'), 2900.00, 300.00, 3200.00, 'bank_transfer');

-- Insert Attendance Records (last 7 days)
INSERT INTO attendance_records (staff_id, attendance_date, time_in, time_out, total_hours, status) VALUES
((SELECT id FROM staff WHERE employee_id = 'EMP-001'), '2024-01-15', '08:00', '17:30', 8.5, 'present'),
((SELECT id FROM staff WHERE employee_id = 'EMP-002'), '2024-01-15', '09:15', '18:00', 8.0, 'late'),
((SELECT id FROM staff WHERE employee_id = 'EMP-003'), '2024-01-15', '08:30', '17:00', 7.5, 'present'),
((SELECT id FROM staff WHERE employee_id = 'EMP-004'), '2024-01-15', NULL, NULL, 0, 'absent'),
((SELECT id FROM staff WHERE employee_id = 'EMP-005'), '2024-01-15', '07:45', '16:45', 8.0, 'present');

-- Insert Leave Requests
INSERT INTO leave_requests (staff_id, leave_type, start_date, end_date, days_requested, reason, status) VALUES
((SELECT id FROM staff WHERE employee_id = 'EMP-001'), 'annual', '2024-01-20', '2024-01-22', 3, 'Family vacation', 'pending'),
((SELECT id FROM staff WHERE employee_id = 'EMP-002'), 'sick', '2024-01-18', '2024-01-19', 2, 'Medical appointment and recovery', 'approved'),
((SELECT id FROM staff WHERE employee_id = 'EMP-003'), 'personal', '2024-01-25', '2024-01-25', 1, 'Personal matters', 'rejected'),
((SELECT id FROM staff WHERE employee_id = 'EMP-005'), 'maternity', '2024-02-01', '2024-04-01', 60, 'Maternity leave', 'pending');

-- Insert Promotions
INSERT INTO promotions (name, description, promotion_type, discount_value, start_date, end_date, usage_limit) VALUES
('Summer Veterinary Sale', '25% off all veterinary medicines and supplies', 'percentage', 25.00, '2024-01-15', '2024-02-15', 500),
('New Customer Welcome', '₱500 off first purchase for new customers', 'fixed_amount', 500.00, '2024-01-01', '2024-12-31', 1000),
('Buy 2 Get 1 Free - Fertilizers', 'Buy 2 bags of fertilizer, get 1 free', 'bogo', 33.33, '2024-01-10', '2024-01-31', 200);

-- Insert Loyalty Programs
INSERT INTO loyalty_programs (name, description, program_type, points_per_peso, start_date) VALUES
('AGRIVET VIP Club', 'Earn points on every purchase and get exclusive rewards', 'points', 1.00, '2024-01-01'),
('Farmer Loyalty Program', 'Special rewards program for agricultural customers', 'tier', 1.50, '2024-01-15'),
('Pet Owner Rewards', 'Cashback program for pet owners', 'cashback', 0.05, '2024-01-10');

-- Insert Events
INSERT INTO events (title, description, event_type, event_date, start_time, end_time, venue, capacity, registration_fee, organizer_id) VALUES
('Agricultural Technology Seminar', 'Latest trends in agricultural technology and sustainable farming practices', 'seminar', '2024-01-25', '09:00', '17:00', 'Main Conference Hall', 200, 500.00, (SELECT id FROM staff WHERE employee_id = 'EMP-001')),
('Pet Care Workshop', 'Comprehensive pet care and health maintenance workshop', 'workshop', '2024-01-28', '14:00', '18:00', 'Training Room A', 50, 300.00, (SELECT id FROM staff WHERE employee_id = 'EMP-002')),
('Veterinary Medicine Conference', 'Annual conference on veterinary medicine advances and practices', 'conference', '2024-02-05', '08:00', '18:00', 'Grand Auditorium', 250, 1000.00, (SELECT id FROM staff WHERE employee_id = 'EMP-002'));