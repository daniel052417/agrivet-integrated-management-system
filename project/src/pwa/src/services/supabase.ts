import { createClient } from '@supabase/supabase-js'

// Use placeholder values for development - replace with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Only create Supabase client if we have valid credentials
let supabase: any = null
let pwaSupabase: any = null

try {
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    console.warn('Supabase credentials not configured. Using mock data for development.')
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // PWA doesn't need persistent auth
        autoRefreshToken: false
      }
    })

    pwaSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  }
} catch (error) {
  console.warn('Failed to initialize Supabase client:', error)
}

// Export mock clients for development
export { supabase, pwaSupabase }
