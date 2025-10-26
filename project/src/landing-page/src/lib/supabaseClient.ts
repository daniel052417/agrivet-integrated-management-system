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




