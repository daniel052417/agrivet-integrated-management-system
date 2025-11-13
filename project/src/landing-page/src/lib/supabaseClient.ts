import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types based on your database schema
export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string;
  brand: string | null;
  unit_of_measure: string;
  weight: number | null;
  dimensions: any;
  is_prescription_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  barcode: string | null;
  supplier_id: string | null;
  image_url: string | null;
  cost: number;
  requires_expiry_date: boolean;
  requires_batch_tracking: boolean;
  is_quick_sale: boolean;
  batch_number: string | null;
  expiry_date: string | null;
}

export interface ProductUnit {
  id: string;
  product_id: string;
  unit_name: string;
  unit_label: string;
  conversion_factor: number;
  is_base_unit: boolean;
  is_sellable: boolean;
  price_per_unit: number;
  min_sellable_quantity: number;
  created_at: string;
}

// Extended types with joins
export interface BrandWithCategory {
  brand_id: string;
  brand_name: string;
  brand_image_url: string | null;
  category_id: string;
  category_name: string;
  product_count: number;
}

// When fetching products with joined categories table
// Supabase returns the table name as the key (categories, not category)
export interface ProductWithDetails extends Product {
  categories?: Category;  // Joined category data (uses table name)
  product_units?: ProductUnit[];
  brand_details?: Brand;
}

// Type for the brand fetching query result
export interface ProductWithJoinedCategory {
  brand: string;
  category_id: string;
  categories: {
    id: string;
    name: string;
  };
}

// Promotion type based on database schema
export interface Promotion {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  products: any[] | null;
  categories: any[] | null;
  show_on_pwa: boolean;
  show_on_landing_page: boolean;
  share_to_facebook: boolean;
  status: 'draft' | 'active' | 'upcoming' | 'expired' | 'archived';
  max_uses: number | null;
  total_uses: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  promotion_type: 'new_item' | 'restock' | 'event';
  total_views: number;
  total_clicks: number;
  updated_by: string | null;
  image_urls: string[] | null;
  layout_style: string | null;
  text_alignment: string | null;
  font_family: string | null;
  font_size: string | null;
  text_color: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  display_priority: number;
  display_settings: any;
  display_mode: 'banner' | 'modal' | 'notification' | 'carousel';
  auto_end: boolean;
  pin_to_top: boolean;
  slideshow_autoplay: boolean;
  slideshow_speed: number | null;
}

// Branch type based on database schema
export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  operating_hours: any;
  created_at: string;
  branch_type: 'main' | 'satellite';
  latitude: number | null;
  longitude: number | null;
  attendance_pin: string | null;
  attendance_security_settings: any;
  allow_device_registration: boolean;
  allow_attendance_device_for_pos: boolean;
}

