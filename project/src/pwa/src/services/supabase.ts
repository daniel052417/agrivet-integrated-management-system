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

// Session management state
let isInitializing = false
let initPromise: Promise<boolean> | null = null

// Retry configuration
const MAX_RETRIES = 3
const BASE_DELAY = 1000 // 1 second
const MAX_DELAY = 10000 // 10 seconds

// Exponential backoff delay calculation
const getRetryDelay = (attempt: number): number => {
  const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY)
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000
}

// Check if we already have a valid anonymous session
const hasValidAnonymousSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.warn('⚠️ Error checking existing session:', error)
      return false
    }
    
    // Check if we have an anonymous session
    if (session?.user && session.user.is_anonymous) {
      console.log('✅ Found existing anonymous session:', session.user.id)
      return true
    }
    
    return false
  } catch (error) {
    console.warn('⚠️ Error checking session:', error)
    return false
  }
}

// Initialize anonymous session with retry logic
const initializeAnonymousSessionWithRetry = async (): Promise<boolean> => {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`🔐 Attempting anonymous sign-in (attempt ${attempt + 1}/${MAX_RETRIES})...`)
      
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) {
        console.error(`❌ Anonymous auth failed (attempt ${attempt + 1}):`, error)
        
        // If it's a rate limit error, wait longer before retrying
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          const delay = getRetryDelay(attempt) * 2 // Double delay for rate limits
          console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        // For other errors, use normal retry delay
        if (attempt < MAX_RETRIES - 1) {
          const delay = getRetryDelay(attempt)
          console.log(`⏳ Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        return false
      }
      
      if (data?.user) {
        console.log('✅ Anonymous session established:', data.user.id)
        return true
      }
      
      return false
    } catch (error) {
      console.error(`❌ Anonymous auth error (attempt ${attempt + 1}):`, error)
      
      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt)
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  console.error('❌ Failed to initialize anonymous session after all retries')
  return false
}

// Start guest session - only called when user explicitly chooses guest mode
export const startGuestSession = async (): Promise<boolean> => {
  // If currently initializing, wait for the existing promise
  if (isInitializing && initPromise) {
    console.log('⏳ Guest session initialization in progress, waiting...')
    return await initPromise
  }
  
  // Check if we already have a valid session
  const hasValidSession = await hasValidAnonymousSession()
  if (hasValidSession) {
    console.log('✅ Reusing existing anonymous session')
    return true
  }
  
  // Start initialization
  isInitializing = true
  initPromise = initializeAnonymousSessionWithRetry()
  
  try {
    const result = await initPromise
    return result
  } finally {
    isInitializing = false
    initPromise = null
  }
}

// Check if we have a valid session (without creating one)
export const hasValidSession = async (): Promise<boolean> => {
  return await hasValidAnonymousSession()
}

// Reset initialization state (useful for testing or manual reset)
export const resetGuestSession = () => {
  isInitializing = false
  initPromise = null
  console.log('🔄 Guest session state reset')
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
