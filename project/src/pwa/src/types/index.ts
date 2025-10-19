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
  category_id: string
  brand: string | null
  unit_of_measure: string
  weight: number | null
  dimensions: any | null
  is_prescription_required: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  barcode: string | null
  supplier_id: string | null
  // Joined data
  categories?: Category
  suppliers?: Supplier
}

export interface ProductUnit {
  id: string
  product_id: string
  unit_name: string
  unit_label: string
  conversion_factor: number
  is_base_unit: boolean
  is_sellable: boolean
  price_per_unit: number
  min_sellable_quantity: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  image_name: string
  image_type: 'main' | 'gallery' | 'thumbnail' | 'other'
  alt_text?: string
  sort_order: number
  is_active: boolean
  file_size?: number
  width?: number
  height?: number
  created_at: string
  updated_at: string
}

// ProductVariant is now replaced by ProductUnit as the main product interface
// This interface is kept for backward compatibility but should be phased out
export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  name: string
  variant_type: string
  variant_value: string
  price: number
  cost: number | null
  is_active: boolean
  created_at: string
  stock_quantity: number | null
  minimum_stock: number | null
  maximum_stock: number | null
  pos_pricing_type: 'fixed' | 'weight_based' | 'bulk'
  weight_per_unit: number | null
  bulk_discount_threshold: number | null
  bulk_discount_percentage: number | null
  requires_expiry_date: boolean
  requires_batch_tracking: boolean
  is_quick_sale: boolean
  barcode: string | null
  expiry_date: string | null
  batch_number: string | null
  image_url: string | null
  // Multi-unit support
  available_units?: ProductUnit[] // Units this product can be sold in
  // Joined data
  products?: Product
  inventory?: Inventory[]
}

// New main product interface using ProductUnit
export interface ProductWithUnits {
  id: string
  product_id: string
  name: string
  description: string | null
  brand: string | null
  barcode: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Product unit information (replaces variant data)
  unit_name: string
  unit_label: string
  conversion_factor: number
  is_base_unit: boolean
  is_sellable: boolean
  price_per_unit: number
  min_sellable_quantity: number
  sort_order: number
  // Additional product data
  sku: string
  category_id: string
  supplier_id: string | null
  // Joined data
  product?: Product
  category?: Category
  supplier?: Supplier
  inventory?: Inventory[]
  // All available units for this product
  available_units?: ProductUnit[]
  // Product images
  images?: ProductImage[]
}

export interface Inventory {
  id: string
  branch_id: string
  product_id: string // Changed from product_variant_id to product_id
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  reorder_level: number
  max_stock_level: number
  last_counted: string | null
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  sort_order: number | null
  is_active: boolean
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  code: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  payment_terms: string | null
  is_active: boolean
  created_at: string
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
  user_id?: string | null
  order_type: 'pickup' | 'delivery'
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
  // Additional fields from database schema
  payment_reference?: string | null
  payment_notes?: string | null
  estimated_ready_time?: string | null
  is_guest_order?: boolean
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  special_instructions?: string | null
  confirmed_at?: string | null
  completed_at?: string | null
  // Delivery fields
  delivery_method?: 'maxim' | 'other'
  delivery_address?: string | null
  delivery_contact_number?: string | null
  delivery_landmark?: string | null
  delivery_status?: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'failed'
  delivery_fee?: number | null
  delivery_tracking_number?: string | null
  // Joined data
  customer?: Customer
  branch?: Branch
  order_items?: OrderItem[]
  payments?: Payment[]
  tracking?: OrderTracking
  delivery_latitude?: number | null
  delivery_longitude?: number | null
}
// Add new interface for customer delivery addresses
export interface CustomerDeliveryAddress {
  id: string
  customer_id: string
  address_label: string
  address_line1: string
  address_line2?: string | null
  landmark?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  contact_number?: string | null
  latitude?: number | null
  longitude?: number | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// Update DeliveryInfo interface
export interface DeliveryInfo {
  method: 'pickup' | 'delivery'
  deliveryMethod?: 'maxim' | 'other'
  address?: string
  contactNumber?: string
  landmark?: string
  latitude?: number
  longitude?: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_unit_id: string | null // Changed from product_variant_id to product_unit_id
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
  // Additional fields from database schema
  base_unit_quantity?: number
  product_name?: string | null
  product_sku?: string | null
  unit_name?: string | null
  unit_label?: string | null
  weight?: number | null
  expiry_date?: string | null
  batch_number?: string | null
  notes?: string | null
  // Joined data
  product?: Product
  product_unit?: ProductUnit // Changed from product_variant to product_unit
}

export interface PaymentMethod {
  id: string
  name: string
  type: string
  is_active: boolean
  requires_reference: boolean
  processing_fee: number
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  payment_method_id: string
  amount: number
  reference_number: string | null
  status: string
  payment_date: string
  processing_fee: number
  notes: string | null
  processed_by: string
  created_at: string
  sales_transaction_id: string | null
  // Joined data
  payment_method?: PaymentMethod
  order?: Order
}

export interface PaymentTransaction {
  id: string
  order_id: string
  transaction_id: string | null
  payment_method: string
  payment_gateway: string | null
  amount: number
  currency: string
  processing_fee: number
  status: string
  gateway_status: string | null
  reference_number: string | null
  gateway_response: any | null
  failure_reason: string | null
  created_at: string
  processed_at: string | null
  completed_at: string | null
}

export interface OrderTracking {
  id: string
  order_id: string
  tracking_number: string | null
  carrier: string | null
  current_location: string | null
  estimated_delivery: string | null
  actual_delivery: string | null
  status: string
  last_update: string | null
  update_notes: string | null
  created_at: string
  // Joined data
  order?: Order
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: string
  previous_status: string | null
  changed_by: string | null
  changed_by_name: string | null
  notes: string | null
  metadata: any | null
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject_template: string
  html_template: string
  text_template: string | null
  variables: any | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailNotification {
  id: string
  order_id: string | null
  customer_id: string | null
  email_type: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  template_name: string | null
  content_html: string | null
  content_text: string | null
  status: string
  sent_at: string | null
  delivered_at: string | null
  error_message: string | null
  retry_count: number
  max_retries: number
  created_at: string
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
  product: ProductWithUnits // Changed from ProductVariant to ProductWithUnits
  product_unit?: ProductUnit // Which unit customer selected
  quantity: number // Quantity in selected unit
  unitPrice: number // Price per selected unit
  lineTotal: number
  base_unit_quantity: number // Converted quantity for inventory tracking
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
  isRealtimeConnected: boolean
}

// Promotional types
export interface Promotion {
  id: string
  title: string
  description: string
  imageUrl?: string
  // Announcement-focused extras
  imageUrls?: string[]
  buttonText?: string
  buttonLink?: string
  // Legacy fields (kept for backward compatibility; no longer used in UI)
  discountType?: 'percentage' | 'fixed' | 'bogo' | 'free_shipping'
  discountValue?: number
  validFrom: string
  validUntil: string
  isActive: boolean
  targetAudience: 'all' | 'new_customers' | 'returning_customers' | 'specific_branch'
  targetBranchIds?: string[]
  branchId?: string // Optional targeting
  // Deprecated: conditions for discounts; retained to avoid breaking imports
  conditions?: Record<string, any>
  // New display mode system
  displayMode: 'banner' | 'modal' | 'notification' | 'carousel'
  displayPriority: number // Higher number = higher priority
  displaySettings: {
    showAsBanner: boolean
    showAsModal: boolean
    showAsNotification: boolean
    showAsCarousel: boolean
    bannerPosition: 'top' | 'bottom'
    modalTrigger: 'immediate' | 'delay' | 'scroll' | 'exit_intent'
    notificationTrigger: 'immediate' | 'delay' | 'user_action'
    carouselInterval?: number // Auto-rotate interval in ms
    carouselPosition?: 'homepage' | 'promotions' | 'both'
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

// Enhanced promotion display system interfaces
export interface PromotionDisplayManagerProps {
  branchId?: string
  customerId?: string
  sessionId?: string
  position?: 'homepage' | 'promotions' | 'both'
  onPromotionAction?: (promotion: Promotion, action: 'view' | 'click' | 'dismiss') => void
}

export interface PromotionDisplayState {
  banners: Promotion[]
  modals: Promotion[]
  notifications: Promotion[]
  carousels: Promotion[]
  isLoading: boolean
  error?: string
}

export interface NotificationHookOptions {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
  onNotificationClick?: (notification: Notification) => void
  onNotificationError?: (error: Error) => void
}

export interface NotificationHookReturn {
  permission: NotificationPermission
  isSupported: boolean
  requestPermission: () => Promise<NotificationPermission>
  showNotification: (data: NotificationData) => Promise<void>
  scheduleNotification: (data: NotificationData, delay: number) => Promise<void>
  clearNotifications: () => void
}

// Delivery-related interfaces
export interface DeliveryInfo {
  method: 'pickup' | 'delivery'
  deliveryMethod?: 'maxim' | 'other'
  address?: string
  contactNumber?: string
  landmark?: string
}

export interface DeliveryFormData {
  deliveryMethod: 'pickup' | 'delivery'
  deliveryAddress: string
  deliveryContactNumber: string
  deliveryLandmark: string
}