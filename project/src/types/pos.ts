// POS System Type Definitions

export interface POSSession {
  id: string;
  cashier_id: string;
  branch_id?: string;
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
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id: string;
  brand?: string;
  unit_of_measure: string;
  weight?: number;
  dimensions?: any;
  is_prescription_required?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  barcode?: string;
  supplier_id?: string;
  image_url?: string;
  // POS-specific fields from the actual products table
  unit_price?: number;
  cost_price?: number;
  expiry_date?: string;
  // Inventory information (joined from inventory table)
  inventory?: Inventory;
  // Category information (joined from categories table)
  category?: Category;
  // Unit information for display (added for InventoryScreen)
  productUnits?: Array<{
    id: string;
    unit_name: string;
    unit_label: string;
    price_per_unit: number;
    is_base_unit: boolean;
    is_sellable: boolean;
    conversion_factor: number;
    min_sellable_quantity: number;
  }>;
  displayUnit?: {
    id: string;
    unit_name: string;
    unit_label: string;
    price_per_unit: number;
    is_base_unit: boolean;
    is_sellable: boolean;
    conversion_factor: number;
    min_sellable_quantity: number;
  };
}

// Keep ProductVariant for backward compatibility, but it now maps to Product
export interface ProductVariant extends Product {
  // POS-specific fields for backward compatibility
  price?: number; // Will be set from unit_price
  pos_pricing_type?: 'fixed' | 'weight_based' | 'bulk';
  weight_per_unit?: number;
  bulk_discount_threshold?: number;
  bulk_discount_percentage?: number;
  // Additional POS fields
  requires_expiry_date?: boolean;
  requires_batch_tracking?: boolean;
  is_quick_sale?: boolean;
  batch_number?: string;
  // For backward compatibility with existing POS code
  products?: {
    id: string;
    name: string;
    category_id: string;
    is_active: boolean;
  };
  // Available units for grouped card design
  availableUnits?: Array<{
    id: string;
    label: string;
    price: number;
    isBase: boolean;
  }>;
  // New structure for proper unit management
  units?: Array<{
    id: string;
    unit_name: string;
    unit_label: string;
    price: number;
    is_base_unit: boolean;
    conversion_factor: number;
    min_sellable_quantity: number;
  }>;
  selectedUnit?: {
    id: string;
    unit_name: string;
    unit_label: string;
    price: number;
    is_base_unit: boolean;
  } | null;
}

export interface Inventory {
  id: string;
  branch_id: string;
  product_id: string; // Changed from product_variant_id to product_id
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number; // Generated column
  reorder_level: number;
  max_stock_level: number;
  last_counted?: string;
  updated_at?: string;
  base_unit?: string;
}


export interface CartItem {
  id: string;
  product: ProductVariant;
  quantity: number;
  weight?: number; // For weight-based products
  unitPrice: number;
  discount: number;
  lineTotal: number;
  expiryDate?: string;
  batchNumber?: string;
  isBaseUnit?: boolean; // Flag to distinguish base units from sub-units
  selectedUnit?: {
    id: string;
    unit_name: string;
    unit_label: string;
    price: number;
    is_base_unit: boolean;
    conversion_factor: number;
  };
}

export interface Customer {
  id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  customer_type: 'regular' | 'vip' | 'wholesale';
  is_active: boolean;
  created_at: string;
  user_id?: string;
  customer_code?: string;
  date_of_birth?: string;
  registration_date: string;
  total_spent: number;
  last_purchase_date?: string;
  loyalty_points: number;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_lifetime_spent: number;
}

export interface POSTransaction {
  id: string;
  transaction_number: string;
  pos_session_id: string;
  customer_id?: string;
  cashier_id: string;
  branch_id?: string;
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
  id: string;
  transaction_id: string;
  product_id: string;
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
  id: string;
  transaction_id: string;
  payment_method: 'cash' | 'digital';
  payment_type?: string; // 'gcash', 'paymaya', 'grab_pay', etc.
  amount: number;
  change_given: number;
  reference_number?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_at: string;
  created_at: string;
}

export interface QuickSaleItem {
  id: string;
  branch_id?: string;
  product_id: string;
  shortcut_name: string;
  shortcut_key?: string;
  quantity: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReceiptTemplate {
  id: string;
  branch_id?: string;
  template_name: string;
  template_type: 'standard' | 'thermal' | 'email' | 'sms';
  header_text?: string;
  footer_text?: string;
  logo_url?: string;
  show_tax_breakdown: boolean;
  show_payment_methods: boolean;
  show_cashier_info: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSSettings {
  id: string;
  branch_id?: string;
  setting_key: string;
  setting_value?: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyPoints {
  id: string;
  customer_id: string;
  transaction_id: string;
  points_earned: number;
  points_redeemed: number;
  points_balance: number;
  transaction_date: string;
  created_at: string;
}

export interface POSAuditLog {
  id: string;
  session_id: string;
  transaction_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: string;
  new_value?: string;
  cashier_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Form interfaces
export interface PaymentFormData {
  paymentMethod: 'cash' | 'digital';
  paymentType?: string;
  amount: number;
  referenceNumber?: string;
}

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  customer_type: 'individual' | 'business' | 'veterinarian' | 'farmer';
  date_of_birth?: string;
}

// Search and filter interfaces
export interface ProductSearchFilters {
  category?: string;
  supplier?: string;
  pricing_type?: 'fixed' | 'weight_based' | 'bulk';
  in_stock_only?: boolean;
  quick_sale_only?: boolean;
}

export interface CustomerSearchFilters {
  customer_type?: string;
  loyalty_tier?: string;
  has_loyalty_points?: boolean;
}

// Dashboard and reporting interfaces
export interface SalesSummary {
  total_sales: number;
  total_transactions: number;
  average_transaction_value: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  payment_methods: Array<{
    payment_method: string;
    count: number;
    total_amount: number;
  }>;
}

export interface CashierPerformance {
  cashier_id: string;
  cashier_name: string;
  total_sales: number;
  total_transactions: number;
  average_transaction_value: number;
  session_duration: number;
}

// Error handling
export interface POSError {
  code: string;
  message: string;
  details?: any;
}

// API response interfaces
export interface APIResponse<T> {
  data?: T;
  error?: POSError;
  success: boolean;
}

// Component props interfaces
export interface ProductSearchProps {
  onAddToCart: (product: Product, quantity?: number, weight?: number) => void;
  filters?: ProductSearchFilters;
}

export interface ShoppingCartProps {
  cart: CartItem[];
  selectedCustomer?: Customer | null;
  onUpdateItem: (itemId: string, updates: Partial<CartItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  onProceedToPayment: () => void;
}

export interface PaymentProcessingProps {
  cart: CartItem[];
  selectedCustomer?: Customer | null;
  subtotal: number;
  tax: number;
  total: number;
  session: POSSession;
  onTransactionComplete: () => void;
  onBack: () => void;
}

export interface CustomerLookupProps {
  selectedCustomer?: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  filters?: CustomerSearchFilters;
}

// Additional database schema interfaces
export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  operating_hours?: any;
  created_at: string;
  branch_type: 'main' | 'satellite';
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  last_activity?: string;
  status: 'online' | 'away' | 'offline';
  current_session_id?: string;
  timezone?: string;
  preferred_language?: string;
  role: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'pending' | 'invite_sent' | 'no_account';
  mfa_enabled: boolean;
  mfa_secret?: string;
  mfa_backup_codes?: string;
  last_password_reset?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  display_name?: string;
  is_system_role: boolean;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  location_info?: any;
  current_page?: string;
  status: 'active' | 'away' | 'inactive';
  last_activity: string;
  created_at: string;
  expires_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface StockMovement {
  id: string;
  branch_id: string;
  product_id: string; // Changed from product_variant_id to product_id
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reference_type: 'purchase_order' | 'order' | 'adjustment' | 'transfer' | 'initial';
  reference_id?: string;
  batch_number?: string;
  expiry_date?: string;
  cost?: number;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  branch_id: string;
  adjustment_date: string;
  reason: string;
  status: 'draft' | 'approved' | 'cancelled';
  total_value: number;
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'digital_wallet';
  is_active: boolean;
  requires_reference: boolean;
  processing_fee: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Online Orders interfaces
export interface OnlineOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  branch_id: string;
  order_type: 'pickup' | 'delivery' | 'reservation';
  status: 'pending_confirmation' | 'confirmed' | 'ready_for_pickup' | 'for_payment' | 'for_dispatch' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'pending_verification' | 'verified'; 
  payment_method: 'cash' | 'digital' | 'card' | 'gcash';
  payment_reference?: string;      // <-- ADD THIS
  payment_proof_url?: string;      // <-- ADD THIS
  subtotal: number;
  tax_amount: number;
  delivery_fee?: number;
  total_amount: number;
  special_instructions?: string;
  estimated_ready_time?: string;
  actual_ready_time?: string;
  pickup_time?: string;
  delivery_time?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  ready_at?: string;
  // Delivery-related fields
  delivery_method?: 'maxim' | 'other';
  delivery_address?: string;
  delivery_contact_number?: string;
  delivery_landmark?: string;
  delivery_status?: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'failed';
  delivery_tracking_number?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  items: OnlineOrderItem[];
}

export interface OnlineOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  special_instructions?: string;
  weight_kg?: number;
  expiry_date?: string;
  batch_number?: string;
}

export interface OnlineOrderFilters {
  status?: string;
  order_type?: string;
  date_from?: string;
  date_to?: string;
  customer_name?: string;
}

