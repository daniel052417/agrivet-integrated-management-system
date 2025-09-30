// Re-export shared types from main project
export type { 
  Branch, 
  Product, 
  ProductVariant, 
  Category,
  Customer 
} from '@types/pos'

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
  promotion: Promotion
  isOpen: boolean
  onClose: () => void
  onAction?: () => void
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