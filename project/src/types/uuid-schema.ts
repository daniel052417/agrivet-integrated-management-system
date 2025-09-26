// UUID-Based Database Schema Types
// This file contains all TypeScript interfaces using UUIDs consistently

export interface UserProfile {
  id: string; // UUID
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  is_active: boolean;
  last_login_at: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID
          username: string;
          password_hash: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone_number: string | null;
          is_active: boolean;
          last_login_at: string | null;
          staff_id: string | null; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      roles: {
        Row: {
          id: string; // UUID
          role_name: string;
          display_name: string;
          description: string | null;
          level: number;
          is_custom: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      user_roles: {
        Row: {
          user_id: string; // UUID
          role_id: string; // UUID
          assigned_at: string;
          assigned_by: string; // UUID
          is_active: boolean;
          expires_at: string | null;
        };
      };
      role_permissions: {
        Row: {
          id: string; // UUID
          role_id: string; // UUID
          role_name: string;
          module: string;
          can_view: boolean;
          can_edit: boolean;
          can_delete: boolean;
          created_at: string;
          updated_at: string;
          permission_id: string; // UUID
        };
      };
      permissions: {
        Row: {
          id: string; // UUID
          name: string;
          description: string;
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
          manager_id: string | null; // UUID
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
          created_at: string;
          updated_at: string;
        };
      };
      staff: {
        Row: {
          id: string; // UUID
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string | null;
          position: string;
          department: string;
          hire_date: string;
          salary: number | null;
          is_active: boolean;
          user_account_id: string | null; // UUID
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string; // UUID
          product_name: string;
          sku: string;
          description: string | null;
          category_id: string; // UUID
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
          status: string;
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
    };
  };
}

// Permission System Types (Updated for UUID)
export interface Permission {
  id: string; // UUID
  name: string;
  description: string;
  resource: string;
  action: string;
  component: string;
  category: 'sensitive' | 'upgradeable' | 'standard';
  isSystem: boolean;
  isVisible: boolean;
  isEnabled: boolean;
  upgradeMessage?: string;
  requiredRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string; // UUID
  name: string;
  displayName: string;
  description: string;
  level: number;
  isCustom: boolean;
  permissions: Permission[];
  // componentAccess removed - using hardcoded role pages instead
  createdBy?: string; // UUID
  createdAt: string;
  updatedAt: string;
}

// ComponentAccess interface removed - using hardcoded role pages instead

export interface UserRole {
  userId: string; // UUID
  roleId: string; // UUID
  assignedAt: string;
  assignedBy: string; // UUID
  isActive: boolean;
  expiresAt?: string;
}

// POS System Types (Updated for UUID)
export interface POSSession {
  id: string; // UUID
  cashier_id: string; // UUID
  branch_id?: string; // UUID
  session_number: string;
  opened_at: string;
  closed_at?: string;
  starting_cash: number;
  ending_cash?: number;
  total_sales: number;
  total_transactions: number;
  status: 'open' | 'closed' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string; // UUID
  sku: string;
  name: string;
  description?: string;
  category_id?: string; // UUID
  supplier_id?: string; // UUID
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  minimum_stock: number;
  maximum_stock?: number;
  unit_of_measure: string;
  barcode?: string;
  expiry_date?: string;
  is_active: boolean;
  pos_pricing_type?: 'fixed' | 'weight_based' | 'bulk';
  weight_per_unit?: number;
  bulk_discount_threshold?: number;
  bulk_discount_percentage?: number;
  requires_expiry_date?: boolean;
  requires_batch_tracking?: boolean;
  is_quick_sale?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string; // UUID
  customer_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  customer_type: 'individual' | 'business' | 'veterinarian' | 'farmer';
  date_of_birth?: string;
  registration_date: string;
  is_active: boolean;
  total_spent: number;
  last_purchase_date?: string;
  loyalty_points?: number;
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_lifetime_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface POSTransaction {
  id: string; // UUID
  transaction_number: string;
  pos_session_id: string; // UUID
  customer_id?: string; // UUID
  cashier_id: string; // UUID
  branch_id?: string; // UUID
  transaction_date: string;
  transaction_type: 'sale' | 'return' | 'exchange' | 'void';
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'active' | 'void' | 'returned';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface POSTransactionItem {
  id: string; // UUID
  transaction_id: string; // UUID
  product_id: string; // UUID
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
  weight_kg?: number;
  expiry_date?: string;
  batch_number?: string;
  created_at: string;
}

export interface Payment {
  id: string; // UUID
  transaction_id: string; // UUID
  payment_method: 'cash' | 'digital';
  payment_type?: string;
  amount: number;
  change_given: number;
  reference_number?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_at: string;
  created_at: string;
}

// Marketing Types (Updated for UUID)
export interface MarketingCampaign {
  id: string; // UUID
  campaign_name: string;
  template_id: string; // UUID
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  title: string;
  description?: string;
  content?: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
  image_alt_text?: string;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  is_active: boolean;
  is_published: boolean;
  publish_date?: string;
  unpublish_date?: string;
  target_audience?: string[];
  target_channels?: string[];
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface CampaignTemplate {
  id: string; // UUID
  template_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  description: string;
  default_styles: Record<string, any>;
  required_fields: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// HR Types (Updated for UUID)
export interface Staff {
  id: string; // UUID
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  position: string;
  department: string;
  hire_date: string;
  salary: number | null;
  is_active: boolean;
  user_account_id: string | null; // UUID
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
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
}

export interface LeaveRequest {
  id: string; // UUID
  employee_id: string; // UUID
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: string;
  approved_by: string | null; // UUID
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}
