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
      users: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone_number: string | null;
          is_active: boolean;
          last_login_at: string | null;
          staff_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      roles: {
        Row: {
          role_id: number;
          role_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      user_roles: {
        Row: {
          user_id: number;
          role_id: number;
          assigned_at: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: number;
          permission_id: number;
          granted_at: string;
        };
      };
      departments: {
        Row: {
          department_id: number;
          department_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      job_titles: {
        Row: {
          job_title_id: number;
          title_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      employees: {
        Row: {
          employee_id: number;
          employee_code: string;
          hire_date: string;
          termination_date: string | null;
          job_title_id: number;
          department_id: number;
          manager_employee_id: number | null;
          salary: number | null;
          date_of_birth: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      time_off_requests: {
        Row: {
          request_id: number;
          employee_id: number;
          request_type: string;
          start_date: string;
          end_date: string;
          status: string;
          reason: string | null;
          approved_by_employee_id: number | null;
          requested_at: string;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      performance_reviews: {
        Row: {
          review_id: number;
          employee_id: number;
          reviewer_employee_id: number;
          review_date: string;
          overall_rating: number | null;
          comments: string | null;
          goals_set: string | null;
          goals_achieved: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      benefits: {
        Row: {
          benefit_id: number;
          benefit_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      employee_benefits: {
        Row: {
          employee_id: number;
          benefit_id: number;
          enrollment_date: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      hr_documents: {
        Row: {
          document_id: number;
          employee_id: number | null;
          document_type: string;
          file_path: string;
          file_name: string;
          uploaded_by_user_id: number;
          uploaded_at: string;
          created_at: string;
          updated_at: string;
        };
      };
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
      product_categories: {
        Row: {
          category_id: number;
          category_name: string;
          description: string | null;
          parent_category_id: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          product_id: number;
          product_name: string;
          sku: string;
          description: string | null;
          category_id: number;
          unit_of_measure: string;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      locations: {
        Row: {
          location_id: number;
          location_name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          phone_number: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      inventory: {
        Row: {
          inventory_id: number;
          product_id: number;
          location_id: number;
          quantity_on_hand: number;
          reorder_point: number | null;
          last_restock_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      suppliers: {
        Row: {
          supplier_id: number;
          supplier_name: string;
          contact_person: string | null;
          email: string | null;
          phone_number: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          payment_terms: string | null;
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
          user_account_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      staff_user_links: {
        Row: {
          id: string;
          staff_id: string;
          user_id: string;
          link_status: 'active' | 'inactive' | 'transferred';
          linked_at: string;
          unlinked_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      account_creation_workflow: {
        Row: {
          id: string;
          staff_id: string;
          workflow_status: 'pending' | 'in_progress' | 'completed' | 'failed';
          account_creation_method: 'manual' | 'email_invite' | 'auto_create' | null;
          email_invite_sent_at: string | null;
          account_created_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      user_account_audit: {
        Row: {
          id: string;
          actor_email: string | null;
          action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'suspend' | 'link' | 'unlink' | 'transfer';
          target_user_email: string;
          target_user_id: string | null;
          target_staff_id: string | null;
          details: any;
          created_at: string;
        };
      };
      email_invitations: {
        Row: {
          id: string;
          staff_id: string;
          email: string;
          invitation_token: string;
          expires_at: string;
          status: 'pending' | 'accepted' | 'expired' | 'cancelled';
          accepted_at: string | null;
          created_by: string | null;
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
      sales_orders: {
        Row: {
          order_id: number;
          customer_id: number;
          order_date: string;
          status: string;
          total_amount: number;
          shipping_address: string | null;
          billing_address: string | null;
          payment_status: string | null;
          processed_by_user_id: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          order_item_id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
          updated_at: string;
        };
      };
      sales_transaction_items: {
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
          movement_id: number;
          product_id: number;
          from_location_id: number | null;
          to_location_id: number | null;
          movement_type: string;
          quantity: number;
          movement_date: string;
          recorded_by_user_id: number;
          related_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      leads: {
        Row: {
          lead_id: number;
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          email: string | null;
          phone_number: string | null;
          source: string | null;
          status: string;
          assigned_to_user_id: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      marketing_campaigns: {
        Row: {
          campaign_id: number;
          campaign_name: string;
          start_date: string | null;
          end_date: string | null;
          budget: number | null;
          status: string;
          description: string | null;
          created_by_user_id: number;
          created_at: string;
          updated_at: string;
        };
      };
      campaign_leads: {
        Row: {
          campaign_id: number;
          lead_id: number;
          interaction_date: string;
          interaction_type: string | null;
          created_at: string;
        };
      };
      accounts: {
        Row: {
          account_id: number;
          account_name: string;
          account_number: string;
          account_type: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      accounting_transactions: {
        Row: {
          transaction_id: number;
          transaction_date: string;
          description: string | null;
          transaction_type: string;
          reference_number: string | null;
          total_amount: number;
          posted_by_user_id: number;
          created_at: string;
          updated_at: string;
        };
      };
      accounting_transaction_items: {
        Row: {
          transaction_item_id: number;
          transaction_id: number;
          account_id: number;
          debit_amount: number;
          credit_amount: number;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      invoices: {
        Row: {
          invoice_id: number;
          customer_id: number;
          invoice_date: string;
          due_date: string;
          total_amount: number;
          amount_due: number;
          status: string;
          sales_order_id: number | null;
          created_by_user_id: number;
          created_at: string;
          updated_at: string;
        };
      };
      invoice_items: {
        Row: {
          invoice_item_id: number;
          invoice_id: number;
          product_id: number | null;
          description: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at: string;
          updated_at: string;
        };
      };
      payments: {
        Row: {
          payment_id: number;
          customer_id: number;
          invoice_id: number | null;
          payment_date: string;
          amount: number;
          payment_method: string;
          transaction_reference: string | null;
          recorded_by_user_id: number;
          created_at: string;
          updated_at: string;
        };
      };
      expenses: {
        Row: {
          expense_id: number;
          expense_date: string;
          supplier_id: number | null;
          description: string;
          amount: number;
          category: string;
          receipt_url: string | null;
          approved_by_user_id: number | null;
          recorded_by_user_id: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      purchase_orders: {
        Row: {
          purchase_order_id: number;
          supplier_id: number;
          order_date: string;
          expected_delivery_date: string | null;
          status: string;
          total_amount: number;
          created_by_user_id: number;
          created_at: string;
          updated_at: string;
        };
      };
      purchase_order_items: {
        Row: {
          po_item_id: number;
          purchase_order_id: number;
          product_id: number;
          quantity: number;
          unit_cost: number;
          line_total: number;
          received_quantity: number;
          created_at: string;
          updated_at: string;
        };
      };
      system_settings: {
        Row: {
          setting_id: number;
          setting_key: string;
          setting_value: string | null;
          description: string | null;
          data_type: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      audit_logs: {
        Row: {
          log_id: number;
          user_id: number | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_value: string | null;
          new_value: string | null;
          ip_address: string | null;
          timestamp: string;
        };
      };
      integrations: {
        Row: {
          integration_id: number;
          integration_name: string;
          description: string | null;
          api_key: string | null;
          secret_key: string | null;
          webhook_url: string | null;
          status: string;
          created_by_user_id: number;
          created_at: string;
          updated_at: string;
        };
      };
      pos_sessions: {
        Row: {
          session_id: number;
          location_id: number;
          opened_by_user_id: number;
          opened_at: string;
          closed_at: string | null;
          starting_cash: number;
          ending_cash: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      pos_transactions: {
        Row: {
          pos_transaction_id: number;
          pos_session_id: number;
          sales_order_id: number;
          transaction_type: string;
          payment_method: string | null;
          amount: number;
          transaction_date: string;
          created_at: string;
          updated_at: string;
        };
      };
      customers: {
        Row: {
          customer_id: number;
          customer_type: string;
          company_name: string | null;
          contact_first_name: string | null;
          contact_last_name: string | null;
          email: string;
          phone_number: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          credit_limit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
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