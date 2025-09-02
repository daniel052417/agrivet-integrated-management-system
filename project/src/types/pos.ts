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
  category_id?: string;
  supplier_id?: string;
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

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  price_modifier: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  weight?: number; // For weight-based products
  unitPrice: number;
  discount: number;
  lineTotal: number;
  expiryDate?: string;
  batchNumber?: string;
}

export interface Customer {
  id: string;
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

