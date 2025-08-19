import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'hr' | 'marketing' | 'cashier' | 'user'

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  phone?: string
  avatar_url?: string
  last_login?: string
  created_at: string
  updated_at: string
}

// Database types
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          parent_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string;
          email: string;
          phone: string;
          address: string;
          city: string;
          country: string;
          payment_terms: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      branches: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          phone: string;
          manager_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      staff: {
        Row: {
          id: string;
          employee_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          position: string;
          department: string;
          branch_id: string;
          hire_date: string;
          salary: number;
          is_active: boolean;
          role: string;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string;
          category_id: string;
          supplier_id: string;
          unit_price: number;
          cost_price: number;
          stock_quantity: number;
          minimum_stock: number;
          maximum_stock: number;
          unit_of_measure: string;
          barcode: string;
          expiry_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      customers: {
        Row: {
          id: string;
          customer_code: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          address: string;
          city: string;
          customer_type: string;
          date_of_birth: string | null;
          registration_date: string;
          is_active: boolean;
          total_spent: number;
          last_purchase_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      sales_transactions: {
        Row: {
          id: string;
          transaction_number: string;
          customer_id: string;
          staff_id: string;
          branch_id: string;
          transaction_date: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          payment_method: string;
          payment_status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          line_total: number;
          created_at: string;
        };
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          movement_type: string;
          quantity: number;
          reference_type: string;
          reference_id: string | null;
          notes: string;
          staff_id: string;
          created_at: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          staff_id: string;
          attendance_date: string;
          time_in: string | null;
          time_out: string | null;
          break_start: string | null;
          break_end: string | null;
          total_hours: number;
          overtime_hours: number;
          status: string;
          notes: string;
          created_at: string;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          staff_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string;
          status: string;
          approved_by: string | null;
          approved_date: string | null;
          emergency_contact: string;
          created_at: string;
          updated_at: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          name: string;
          description: string;
          promotion_type: string;
          discount_value: number;
          category_id: string | null;
          start_date: string;
          end_date: string;
          usage_limit: number;
          usage_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          announcement_type: string;
          target_audience: string;
          channels: string[];
          priority: string;
          status: string;
          publish_date: string | null;
          views_count: number;
          clicks_count: number;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          customer_id: string;
          title: string;
          message: string;
          notification_type: string;
          channel: string;
          status: string;
          priority: string;
          scheduled_at: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          created_at: string;
        };
      };
      loyalty_programs: {
        Row: {
          id: string;
          name: string;
          description: string;
          program_type: string;
          points_per_peso: number;
          minimum_spend: number;
          is_active: boolean;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      loyalty_members: {
        Row: {
          id: string;
          customer_id: string;
          program_id: string;
          membership_tier: string;
          points_balance: number;
          total_points_earned: number;
          total_points_redeemed: number;
          join_date: string;
          last_activity_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          referral_code: string;
          status: string;
          reward_amount: number;
          reward_given: boolean;
          conversion_date: string | null;
          created_at: string;
        };
      };
      venue_ads: {
        Row: {
          id: string;
          venue_name: string;
          location: string;
          ad_type: string;
          campaign_name: string;
          start_date: string;
          end_date: string;
          cost: number;
          impressions: number;
          clicks: number;
          conversions: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          event_type: string;
          event_date: string;
          start_time: string;
          end_time: string;
          venue: string;
          capacity: number;
          registered_attendees: number;
          actual_attendees: number;
          registration_fee: number;
          total_revenue: number;
          organizer_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}