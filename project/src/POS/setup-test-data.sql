-- Setup test data for POS system
-- Run this in your Supabase SQL editor

-- 1. Insert a test branch
INSERT INTO public.branches (id, name, code, address, city, province, postal_code, phone, email, is_active, branch_type)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Main Branch',
  'MAIN001',
  '123 Main Street',
  'Manila',
  'Metro Manila',
  '1000',
  '+63-2-1234-5678',
  'main@agrivet.com',
  true,
  'main'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert test categories
INSERT INTO public.categories (id, name, description, is_active, sort_order)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Feed', 'Animal feed products', true, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Supplements', 'Vitamins and supplements', true, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Medication', 'Veterinary medications', true, 3)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert test products
INSERT INTO public.products (id, name, description, brand, category_id, unit_of_measure, barcode, is_prescription_required, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 'Premium Chicken Feed', 'High-quality chicken feed for layers', 'AgriVet', '550e8400-e29b-41d4-a716-446655440001', 'kg', '1234567890123', false, true),
  ('550e8400-e29b-41d4-a716-446655440011', 'Vitamin Supplement', 'Multi-vitamin supplement for poultry', 'AgriVet', '550e8400-e29b-41d4-a716-446655440002', 'ml', '1234567890124', false, true),
  ('550e8400-e29b-41d4-a716-446655440012', 'Antibiotic Injection', 'Broad-spectrum antibiotic for livestock', 'AgriVet', '550e8400-e29b-41d4-a716-446655440003', 'ml', '1234567890125', true, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert test product variants
INSERT INTO public.product_variants (id, product_id, name, sku, price, barcode, requires_expiry_date, requires_batch_tracking, batch_number, expiry_date, is_quick_sale, is_active, variant_type, variant_value, pos_pricing_type)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'Premium Chicken Feed 50kg', 'PCF-50', 1250.00, '1234567890123', false, true, 'B2024001', '2025-12-31', true, true, 'standard', '', 'fixed'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'Vitamin Supplement 1L', 'VS-1L', 450.00, '1234567890124', true, true, 'B2024002', '2025-06-30', false, true, 'standard', '', 'fixed'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'Antibiotic Injection 10ml', 'AI-10', 85.00, '1234567890125', true, true, 'B2024003', '2025-03-31', false, true, 'standard', '', 'fixed')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert test inventory records
INSERT INTO public.inventory (id, branch_id, product_variant_id, quantity_on_hand, quantity_reserved, quantity_available, reorder_level, max_stock_level)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440020', 25, 0, 25, 5, 50),
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440021', 3, 0, 3, 5, 20),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440022', 50, 0, 50, 10, 100)
ON CONFLICT (id) DO NOTHING;

-- 6. Verify the data
SELECT 
  b.name as branch_name,
  p.name as product_name,
  pv.name as variant_name,
  pv.sku,
  pv.price,
  i.quantity_on_hand,
  i.quantity_available,
  i.reorder_level
FROM public.branches b
JOIN public.inventory i ON b.id = i.branch_id
JOIN public.product_variants pv ON i.product_variant_id = pv.id
JOIN public.products p ON pv.product_id = p.id
WHERE b.is_active = true
ORDER BY p.name, pv.name;
