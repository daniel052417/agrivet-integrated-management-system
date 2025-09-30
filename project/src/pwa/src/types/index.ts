// Base types - Updated to match provided database schema
export interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  province: string
  postal_code: string | null
  phone: string | null
  email: string | null
  manager_id: string | null
  is_active: boolean
  operating_hours: BranchOperatingHours | null
  created_at: string
  branch_type: 'main' | 'satellite'
  // Fields from the custom query
  real_time_status?: string
  payment_options?: string[]
}

export interface BranchOperatingHours {
  // JSONB structure for operating_hours column
  monday?: { open: string; close: string } | { closed: boolean }
  tuesday?: { open: string; close: string } | { closed: boolean }
  wednesday?: { open: string; close: string } | { closed: boolean }
  thursday?: { open: string; close: string } | { closed: boolean }
  friday?: { open: string; close: string } | { closed: boolean }
  saturday?: { open: string; close: string } | { closed: boolean }
  sunday?: { open: string; close: string } | { closed: boolean }
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  category_id: string | null
  supplier_id: string | null
  unit_of_measure: string
  price: number
  cost_price: number
  stock_quantity: number
  minimum_stock: number
  maximum_stock: number | null
  barcode: string | null
  expiry_date: string | null
  is_active: boolean
  pos_pricing_type: string | null
  weight_per_unit: number | null
  bulk_discount_threshold: number | null
  bulk_discount_percentage: number | null
  requires_expiry_date: boolean
  requires_batch_tracking: boolean
  is_quick_sale: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_name: string
  sku: string
  price: number
  cost_price: number
  stock_quantity: number
  minimum_stock: number
  maximum_stock: number | null
  weight_kg: number | null
  unit_of_measure: string
  barcode: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  products?: Product
  categories?: Category
}

export interface Category {
  id: string
  name: string
  description: string
  parent_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  customer_code: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  customer_type: string
  date_of_birth: string | null
  registration_date: string
  is_active: boolean
  total_spent: number
  last_purchase_date: string | null
  loyalty_points: number | null
  loyalty_tier: string | null
  total_lifetime_spent: number | null
  assigned_staff_id: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  branch_id: string
  order_type: string
  status: string
  total_amount: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  payment_method: string
  payment_status: string
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  customer?: Customer
  branch?: Branch
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_variant_id: string | null
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
  // Joined data
  product?: Product
  product_variant?: ProductVariant
}

// PWA-specific types
export interface PWASettings {
  isInstalled: boolean
  isOnline: boolean
  canInstall: boolean
  installPrompt: any
}

export interface CartItem {
  id: string
  product: ProductVariant
  quantity: number
  unitPrice: number
  lineTotal: number
  weight?: number
  expiryDate?: string
  batchNumber?: string
  notes?: string
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  itemCount: number
}

export interface BranchAvailability {
  branchId: string
  isOpen: boolean
  operatingHours: {
    open: string
    close: string
    days: string[]
  }
  lastUpdated: string
}

export interface ProductAvailability {
  productId: string
  branchId: string
  inStock: boolean
  quantity: number
  lastUpdated: string
}

export interface SearchFilters {
  category?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  searchQuery?: string
}

export interface SortOption {
  value: string
  label: string
  direction: 'asc' | 'desc'
}

export interface NotificationSettings {
  orderUpdates: boolean
  promotions: boolean
  stockAlerts: boolean
}

export interface PWAManifest {
  name: string
  short_name: string
  description: string
  theme_color: string
  background_color: string
  display: string
  orientation: string
  scope: string
  start_url: string
  icons: Array<{
    src: string
    sizes: string
    type: string
  }>
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Context types
export interface PWAContextType {
  settings: PWASettings
  updateSettings: (settings: Partial<PWASettings>) => void
  installApp: () => Promise<void>
  checkOnlineStatus: () => boolean
}

export interface CartContextType {
  cart: Cart
  addItem: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getTotal: () => number
}

export interface BranchContextType {
  selectedBranch: Branch | null
  availableBranches: Branch[]
  branchAvailability: BranchAvailability[]
  selectBranch: (branch: Branch) => void
  clearBranch: () => void
  refreshBranches: () => Promise<void>
  isBranchOpen: (branchId: string) => boolean
}

// Promotional types
export interface Promotion {
  id: string
  title: string
  description: string
  imageUrl?: string
  discountType: 'percentage' | 'fixed' | 'bogo' | 'free_shipping'
  discountValue: number
  validFrom: string
  validUntil: string
  isActive: boolean
  targetAudience: 'all' | 'new_customers' | 'returning_customers' | 'specific_branch'
  targetBranchIds?: string[]
  conditions?: {
    minOrderAmount?: number
    applicableProducts?: string[]
    maxUses?: number
  }
  displaySettings: {
    showAsBanner: boolean
    showAsModal: boolean
    showAsNotification: boolean
    bannerPosition: 'top' | 'bottom'
    modalTrigger: 'immediate' | 'delay' | 'scroll' | 'exit_intent'
    notificationTrigger: 'immediate' | 'delay' | 'user_action'
  }
  createdAt: string
  updatedAt: string
}

export interface PromoBannerProps {
  promotion: Promotion
  onDismiss?: () => void
  onAction?: () => void
}

export interface PromoModalProps {
  promotions: Promotion[]
  isOpen: boolean
  onClose: () => void
  onAction?: (promotion: Promotion) => void
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

export interface NotificationData {
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
}