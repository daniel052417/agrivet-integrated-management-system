// TypeScript interfaces for inventory management with multi-unit support

export interface InventoryUnit {
  unit_id: string;
  unit_name: string;
  unit_label: string;
  price: number;
  conversion_factor: number;
  is_base_unit: boolean;
  is_sellable: boolean;
  quantity_in_unit: number;
}

export interface InventoryManagementRow {
  product_id: string;
  sku: string;
  product_name: string;
  image_url: string | null;
  cost: number;
  is_active: boolean;
  barcode: string | null;
  brand: string | null;
  description?: string;
  
  category_id: string;
  category_name: string;
  
  supplier_id: string;
  supplier_name?: string;

  branch_id: string;
  branch_name: string;
  branch_code: string;
  
  inventory_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_level: number;
  max_stock_level: number;
  base_unit: string;
  
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  
  primary_unit_id: string | null;
  unit_name: string | null;
  unit_label: string | null;
  price_per_unit: number | null;
  min_sellable_quantity: number;
  conversion_factor: number | null;
  is_base_unit: boolean | null;
  
  inventory_value: number;
  
  last_updated: string;
  last_counted: string | null;
  product_created_at: string;
  batch_no: string;
  expiration_date: string;
  
  
  // Multi-unit support
  units: InventoryUnit[];
}

export interface InventorySummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  profitMargin: number;
  totalProfit: number;
}

export interface CategorySummary {
  category: string;
  totalItems: number;
  totalValue: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  avgValue: number;
  color: string;
  trend?: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  supplier: string;
  supplierContact: string;
  supplierEmail: string;
  lastOrderDate: string;
  leadTime: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  daysUntilEmpty: number;
  avgDailyUsage: number;
  unitLabel: string;
  branchId: string;
  branchName: string;
}

export interface InventoryFilters {
  searchTerm?: string;
  categoryId?: string;
  branchId?: string;
  stockStatus?: 'In Stock' | 'Low Stock' | 'Out of Stock';
  isActive?: boolean;
}

export interface InventoryMetrics {
  title: string;
  value: string;
  color: string;
  change?: string;
  isPositive?: boolean;
  period: string;
  description?: string;
  bgColor?: string;
  icon?: any;
}

// Form data interfaces
export interface ProductFormData {
  name: string;
  category_id: string;
  sku: string;
  price_per_unit: string;
  stock_quantity: string;
  reorder_level: string;
  supplier_id: string;
  branch_id: string;
  description: string;
  unit_name: string;
  unit_label: string;
  conversion_factor: string;
  min_sellable_quantity: string;
  image_url: string;
  barcode?: string;
  brand?: string;
  enable_multi_unit: boolean; 
  batch_no: string;
  expiration_date: string;
}

export interface UnitFormData {
  unit_name: string;
  unit_label: string;
  conversion_factor: number;
  is_base_unit: boolean;
  is_sellable: boolean;
  price_per_unit: number;
  min_sellable_quantity: number;
}

// API response interfaces
export interface InventoryApiResponse {
  data: InventoryManagementRow[];
  count: number;
  error?: string;
}

export interface InventorySummaryResponse {
  summary: InventorySummary;
  categories: CategorySummary[];
  lowStockItems: LowStockItem[];
  topValueItems: Array<{
    name: string;
    value: number;
    quantity: number;
    category: string;
  }>;
}

// Multi-branch interfaces
export interface BranchSummary {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  branch_type: string;
  total_products: number;
  out_of_stock_count: number;
  low_stock_count: number;
  in_stock_count: number;
  total_inventory_value: number;
  total_selling_value: number;
  potential_profit: number;
  total_quantity_on_hand: number;
  total_quantity_reserved: number;
  total_quantity_available: number;
  stock_health_score: number;
  category_breakdown: Array<{
    category_id: string;
    category_name: string;
    product_count: number;
    total_value: number;
  }>;
}

export interface CriticalAlert {
  alert_type: 'out_of_stock' | 'low_stock';
  branch_name: string;
  branch_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  quantity_available: number;
  reorder_level: number;
  unit_label: string;
  message: string;
  severity: 'red' | 'orange' | 'yellow';
}

export interface TransferRecommendation {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  from_branch_id: string;
  from_branch_name: string;
  to_branch_id: string;
  to_branch_name: string;
  recommended_transfer_quantity: number;
  unit_label: string;
  price_per_unit: number;
  transfer_value: number;
  recommendation_type: string;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  total_quantity: number;
  total_value: number;
  branches_count: number;
  performance_type: 'fastest_moving' | 'slowest_moving' | 'most_profitable' | 'needs_attention';
}

export interface InventoryHealthScore {
  overall_score: number;
  stock_levels: 'excellent' | 'good' | 'adequate' | 'poor';
  distribution: 'balanced' | 'needs_balancing' | 'unbalanced';
  turnover_rate: 'healthy' | 'moderate' | 'slow';
  recommendations: string[];
}

export interface BranchComparison {
  selected_branches: string[];
  comparison_data: {
    [branchId: string]: BranchSummary;
  };
  consolidated_summary: BranchSummary;
}
