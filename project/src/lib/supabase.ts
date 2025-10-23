import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'hr' | 'marketing' | 'cashier' | 'user'

export interface UserProfile {
  id: string // UUID
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  is_active: boolean
  last_login_at: string | null
  role: string
  created_at: string
  updated_at: string
}

// Database types - Updated to match UUID schema
export interface Database {
   public: {
     Tables: {
      users: {
        Row: {
          id: string; // UUID
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: string;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      roles: {
        Row: {
          id: string; // UUID
          role_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          display_name: string;
          is_custom: boolean;
          is_active: boolean;
        };
      };
      user_roles: {
        Row: {
          user_id: string; // UUID
          role_id: string; // UUID
          assigned_at: string;
          assigned_by_user_id: string | null; // UUID
        };
      };
      role_permissions: {
        Row: {
          id: string; // UUID
          role_id: string; // UUID
          role_name: string;
          module: string;
          can_view: boolean;
          can_create: boolean;
          can_update: boolean;
          can_delete: boolean;
          can_manage: boolean;
          granted_at: string;
        };
      };
      permissions: {
        Row: {
          id: string; // UUID
          name: string;
          description: string | null;
          resource: string;
          action: string;
          component: string;
          category: string;
          is_system: boolean;
          is_visible: boolean;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      // component_access table removed - using hardcoded role pages instead
      departments: {
        Row: {
          id: string; // UUID
          department_name: string;
          description: string | null;
          manager_staff_id: string | null; // UUID
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      job_titles: {
        Row: {
          id: string; // UUID
          title_name: string;
          description: string | null;
          department_id: string; // UUID
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      employees: {
        Row: {
          id: string; // UUID
          employee_code: string;
          hire_date: string;
          termination_date: string | null;
          job_title_id: string; // UUID
          department_id: string; // UUID
          manager_employee_id: string | null; // UUID
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
      staff: {
        Row: {
          id: string; // UUID
          employee_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          position: string;
          department: string;
          branch_id: string | null; // UUID
          hire_date: string;
          salary: number | null;
          is_active: boolean;
          user_account_id: string | null; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      staff_user_links: {
        Row: {
          id: string; // UUID
          staff_id: string; // UUID
          user_id: string; // UUID
          link_status: string;
          linked_at: string;
          unlinked_at: string | null;
          created_by: string | null; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      time_off_requests: {
        Row: {
          id: string; // UUID
          employee_id: string; // UUID
          request_type: string;
          start_date: string;
          end_date: string;
          status: string;
          reason: string | null;
          approved_by_employee_id: string | null; // UUID
          requested_at: string;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      performance_reviews: {
        Row: {
          id: string; // UUID
          employee_id: string; // UUID
          reviewer_employee_id: string; // UUID
          review_date: string;
          overall_rating: number | null;
          comments: string | null;
          goals_set: string | null;
          goals_achieved: string | null;
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
      suppliers: {
        Row: {
          id: string; // UUID
          supplier_name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      locations: {
        Row: {
          id: string; // UUID
          location_name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          phone_number: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      branches: {
        Row: {
          id: string; // UUID
          branch_name: string;
          address: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          manager_id: string | null; // UUID
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      inventory: {
        Row: {
          id: string; // UUID
          product_id: string; // UUID
          location_id: string; // UUID
          quantity_on_hand: number;
          reorder_point: number | null;
          last_restock_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      sales_transactions: {
        Row: {
          id: string; // UUID
          transaction_number: string;
          customer_id: string | null; // UUID
          staff_id: string; // UUID
          branch_id: string | null; // UUID
          transaction_date: string;
          transaction_type: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          payment_status: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      sales_transaction_items: {
        Row: {
          id: string; // UUID
          transaction_id: string; // UUID
          product_id: string; // UUID
          quantity: number;
          unit_price: number;
          discount_amount: number;
          line_total: number;
          created_at: string;
        };
      };
      pos_sessions: {
        Row: {
          id: string; // UUID
          cashier_id: string; // UUID
          branch_id: string | null; // UUID
          session_number: string;
          opened_at: string;
          closed_at: string | null;
          starting_cash: number;
          ending_cash: number | null;
          total_sales: number;
          total_transactions: number;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      pos_transactions: {
        Row: {
          id: string; // UUID
          pos_session_id: string; // UUID
          transaction_number: string;
          customer_id: string | null; // UUID
          cashier_id: string; // UUID
          branch_id: string | null; // UUID
          transaction_date: string;
          transaction_type: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          payment_status: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
          transaction_source: string;
        };
      };
      pos_transaction_items: {
        Row: {
          id: string; // UUID
          transaction_id: string; // UUID
          product_id: string; // UUID
          product_name: string;
          product_sku: string;
          quantity: number;
          unit_of_measure: string;
          unit_price: number;
          discount_amount: number;
          line_total: number;
          weight_kg: number | null;
          expiry_date: string | null;
          batch_number: string | null;
          created_at: string;
        };
      };
      pos_payments: {
        Row: {
          id: string; // UUID
          transaction_id: string; // UUID
          payment_method: string;
          payment_type: string | null;
          amount: number;
          change_given: number;
          reference_number: string | null;
          payment_status: string;
          processed_at: string;
          created_at: string;
        };
      };
      marketing_campaigns: {
        Row: {
          id: string; // UUID
          campaign_name: string;
          template_id: string; // UUID
          template_type: string;
          title: string;
          description: string | null;
          content: string | null;
          background_color: string | null;
          text_color: string | null;
          image_url: string | null;
          image_alt_text: string | null;
          cta_text: string | null;
          cta_url: string | null;
          cta_button_color: string | null;
          cta_text_color: string | null;
          is_active: boolean;
          is_published: boolean;
          publish_date: string | null;
          unpublish_date: string | null;
          target_audience: string[] | null;
          target_channels: string[] | null;
          views_count: number;
          clicks_count: number;
          conversions_count: number;
          created_by: string | null; // UUID
          updated_by: string | null; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      campaign_templates: {
        Row: {
          id: string; // UUID
          template_name: string;
          template_type: string;
          description: string;
          default_styles: Record<string, any>;
          required_fields: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      campaign_analytics: {
        Row: {
          id: string; // UUID
          campaign_id: string; // UUID
          event_type: string;
          event_data: Record<string, any> | null;
          user_agent: string | null;
          ip_address: string | null;
          referrer: string | null;
          created_at: string;
        };
      };
      campaign_schedules: {
        Row: {
          id: string; // UUID
          campaign_id: string; // UUID
          schedule_type: string;
          start_date: string | null;
          end_date: string | null;
          recurrence_pattern: Record<string, any> | null;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      payroll_records: {
        Row: {
          id: string; // UUID
          employee_id: string; // UUID
          pay_period_start: string;
          pay_period_end: string;
          basic_salary: number;
          gross_pay: number;
          total_deductions: number;
          net_pay: number;
          status: string;
          processed_by: string | null; // UUID
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payroll_components: {
        Row: {
          id: string; // UUID
          payroll_record_id: string; // UUID
          component_type: string;
          component_name: string;
          amount: number;
          is_deduction: boolean;
          created_at: string;
        };
      };
      leave_requests: {
        Row: {
          id: string; // UUID
          employee_id: string; // UUID
          leave_type: string;
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string | null;
          approved_by: string | null; // UUID
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      leads: {
        Row: {
          id: string; // UUID
          lead_number: string;
          first_name: string;
          last_name: string;
          company_name: string | null;
          email: string | null;
          phone_number: string | null;
          source: string | null;
          status: string;
          lead_score: number;
          assigned_to_staff_id: string | null; // UUID
          estimated_value: number | null;
          expected_close_date: string | null;
          notes: string | null;
          last_contact_date: string | null;
          next_follow_up_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      app_settings: {
        Row: {
          id: string; // UUID
          app_name: string;
          company_name: string;
          contact_email: string;
          support_phone: string;
          currency: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
      };
      system_settings: {
        Row: {
          id: string; // UUID
          setting_key: string;
          setting_value: string | null;
          setting_category: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string; // UUID
          user_id: string; // UUID
          action: string;
          entity_type: string;
          entity_id: string | null; // UUID
          old_values: Record<string, any> | null;
          new_values: Record<string, any> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
      };
      accounts: {
        Row: {
          id: string; // UUID
          account_number: string;
          account_name: string;
          account_type: string;
          account_subtype: string | null;
          parent_account_id: string | null; // UUID
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      expenses: {
        Row: {
          id: string; // UUID
          account_id: string | null; // UUID
          amount: number;
          description: string;
          expense_date: string;
          category: string;
          status: string;
          recorded_by_user_id: string; // UUID
          approved_by_user_id: string | null; // UUID
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      benefits: {
        Row: {
          id: string; // UUID
          benefit_name: string;
          description: string | null;
          benefit_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      employee_benefits: {
        Row: {
          id: string; // UUID
          staff_id: string; // UUID
          benefit_id: string; // UUID
          start_date: string;
          end_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      payroll_benefits: {
        Row: {
          id: string; // UUID
          benefit_name: string;
          description: string | null;
          employee_contribution: number;
          employer_contribution: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      employee_payroll_benefits: {
        Row: {
          id: string; // UUID
          staff_id: string; // UUID
          benefit_id: string; // UUID
          employee_contribution: number;
          employer_contribution: number;
          status: string;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      attendance_records: {
        Row: {
          id: string; // UUID
          staff_id: string; // UUID
          clock_in: string;
          clock_out: string | null;
          date: string;
          hours_worked: number | null;
          overtime_hours: number | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      client_notifications: {
        Row: {
          id: string; // UUID
          title: string;
          message: string;
          notification_type: string;
          target_audience: string[];
          is_active: boolean;
          created_by: string; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      email_invitations: {
        Row: {
          id: string; // UUID
          staff_id: string; // UUID
          email: string;
          invitation_token: string;
          status: string;
          sent_at: string | null;
          accepted_at: string | null;
          expires_at: string;
          created_by: string; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      account_creation_workflow: {
        Row: {
          id: string; // UUID
          staff_id: string; // UUID
          workflow_status: string;
          account_creation_method: string | null;
          email_invite_sent_at: string | null;
          account_created_at: string | null;
          created_by: string; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      marketing_user_roles: {
        Row: {
          id: string; // UUID
          user_id: string; // UUID
          role: string;
          permissions: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}