import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config Debug:')
console.log('🔧 VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing')
console.log('🔧 VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')
console.log('🔧 Full URL:', supabaseUrl)
console.log('🔧 Key starts with:', supabaseAnonKey?.substring(0, 10) + '...')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence for RLS
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// Initialize anonymous session for RLS access
export const initializeAnonymousSession = async () => {
  try {
    console.log('🔐 Initializing anonymous session for RLS access...')
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('❌ Anonymous auth failed:', error)
      return false
    }
    console.log('✅ Anonymous session established:', data.user?.id)
    return true
  } catch (error) {
    console.error('❌ Anonymous auth error:', error)
    return false
  }
}

// Debug the created client
console.log('🔧 Supabase Client Created:')
console.log('🔧 Client instance:', !!supabase)

// Database types - Updated to match the provided schema
export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string; // UUID
          name: string;
          code: string;
          address: string;
          city: string;
          province: string;
          postal_code: string | null;
          phone: string | null;
          email: string | null;
          manager_id: string | null; // UUID
          is_active: boolean;
          operating_hours: {
            monday?: { open: string; close: string } | { closed: boolean }
            tuesday?: { open: string; close: string } | { closed: boolean }
            wednesday?: { open: string; close: string } | { closed: boolean }
            thursday?: { open: string; close: string } | { closed: boolean }
            friday?: { open: string; close: string } | { closed: boolean }
            saturday?: { open: string; close: string } | { closed: boolean }
            sunday?: { open: string; close: string } | { closed: boolean }
          } | null;
          created_at: string;
          branch_type: 'main' | 'satellite';
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address: string;
          city: string;
          province: string;
          postal_code?: string | null;
          phone?: string | null;
          email?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
          operating_hours?: any;
          created_at?: string;
          branch_type?: 'main' | 'satellite';
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          address?: string;
          city?: string;
          province?: string;
          postal_code?: string | null;
          phone?: string | null;
          email?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
          operating_hours?: any;
          created_at?: string;
          branch_type?: 'main' | 'satellite';
        };
      };
      products: {
        Row: {
          id: string; // UUID
          sku: string;
          name: string;
          description: string | null;
          category_id: string | null; // UUID
          supplier_id: string | null; // UUID
          unit_of_measure: string;
          price: number;
          cost_price: number;
          stock_quantity: number;
          minimum_stock: number;
          maximum_stock: number | null;
          barcode: string | null;
          expiry_date: string | null;
          is_active: boolean;
          pos_pricing_type: string | null;
          weight_per_unit: number | null;
          bulk_discount_threshold: number | null;
          bulk_discount_percentage: number | null;
          requires_expiry_date: boolean;
          requires_batch_tracking: boolean;
          is_quick_sale: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      product_variants: {
        Row: {
          id: string; // UUID
          product_id: string; // UUID
          variant_name: string;
          sku: string;
          price: number;
          cost_price: number;
          stock_quantity: number;
          minimum_stock: number;
          maximum_stock: number | null;
          weight_kg: number | null;
          unit_of_measure: string;
          barcode: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      categories: {
        Row: {
          id: string; // UUID
          name: string;
          description: string;
          parent_id: string | null; // UUID
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      customers: {
        Row: {
          id: string; // UUID
          customer_code: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          customer_type: string;
          date_of_birth: string | null;
          registration_date: string;
          is_active: boolean;
          total_spent: number;
          last_purchase_date: string | null;
          loyalty_points: number | null;
          loyalty_tier: string | null;
          total_lifetime_spent: number | null;
          assigned_staff_id: string | null; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      inventory: {
        Row: {
          id: string; // UUID
          product_id: string; // UUID
          product_variant_id: string | null; // UUID
          branch_id: string; // UUID
          quantity_on_hand: number;
          quantity_reserved: number;
          quantity_available: number;
          reorder_level: number | null;
          max_stock_level: number | null;
          last_counted: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string; // UUID
          order_number: string;
          customer_id: string | null; // UUID
          branch_id: string; // UUID
          order_type: string;
          status: string;
          total_amount: number;
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          payment_method: string;
          payment_status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          id: string; // UUID
          order_id: string; // UUID
          product_id: string; // UUID
          product_variant_id: string | null; // UUID
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at: string;
        };
      };
      promotions: {
        Row: {
          id: string; // UUID
          title: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          valid_from: string;
          valid_until: string;
          is_active: boolean;
          target_audience: string;
          target_branch_ids: string[] | null;
          conditions: Record<string, any> | null;
          display_settings: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
      };
      pwa_sessions: {
        Row: {
          id: string; // UUID
          session_id: string;
          user_agent: string | null;
          ip_address: string | null;
          branch_id: string | null; // UUID
          is_active: boolean;
          last_activity: string;
          created_at: string;
          updated_at: string;
        };
      };
      pwa_analytics: {
        Row: {
          id: string; // UUID
          session_id: string;
          event_type: string;
          event_data: Record<string, any> | null;
          page_url: string | null;
          user_agent: string | null;
          ip_address: string | null;
          created_at: string;
        };
      };
    };
  };
}
