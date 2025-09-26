// Permission System Types

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string; // 'inventory', 'sales', 'hr', 'marketing', 'pos', 'reports', 'settings', 'dashboard'
  action: string;   // 'read', 'write', 'delete', 'admin', 'create', 'update'
  component: string; // Component path for dynamic loading
  category: 'sensitive' | 'upgradeable' | 'standard';
  isSystem: boolean; // Whether this is a system-defined permission
  isVisible: boolean; // Whether to show in UI
  isEnabled: boolean; // Whether user can interact with it
  upgradeMessage?: string; // Message shown when feature is upgradeable
  requiredRole?: string; // Minimum role required
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isCustom: boolean; // Whether this is a custom role created by super-admin
  permissions: Permission[];
  createdBy?: string; // User ID who created this role
  createdAt: string;
  updatedAt: string;
}

// ComponentAccess interface removed - using hardcoded role pages instead

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
  expiresAt?: string;
}

export interface PermissionMatrix {
  [resource: string]: {
    [action: string]: boolean;
  };
}

export interface RolePermissions {
  roleId: string;
  roleName: string;
  permissions: Permission[];
  componentAccess: ComponentAccess[];
  matrix: PermissionMatrix;
}

// Predefined system roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super-admin',
  HR_ADMIN: 'hr-admin',
  MARKETING_ADMIN: 'marketing-admin',
  HR_STAFF: 'hr-staff',
  MARKETING_STAFF: 'marketing-staff',
  CASHIER: 'cashier',
  INVENTORY_CLERK: 'inventory-clerk'
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// Permission categories
export const PERMISSION_CATEGORIES = {
  SENSITIVE: 'sensitive',     // Completely hidden if no permission
  UPGRADEABLE: 'upgradeable', // Shown but disabled with upgrade message
  STANDARD: 'standard'        // Normal permission-based access
} as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[keyof typeof PERMISSION_CATEGORIES];

// Component paths for dynamic loading
export const COMPONENT_PATHS = {
  // Dashboard components
  DASHBOARD_ADMIN: 'dashboard/admin',
  DASHBOARD_HR: 'dashboard/hr',
  DASHBOARD_MARKETING: 'dashboard/marketing',
  DASHBOARD_CASHIER: 'dashboard/cashier',
  DASHBOARD_INVENTORY: 'dashboard/inventory',
  
  // Inventory components
  INVENTORY_MANAGEMENT: 'inventory/management',
  INVENTORY_CATALOG: 'inventory/catalog',
  INVENTORY_STOCK: 'inventory/stock',
  INVENTORY_CATEGORIES: 'inventory/categories',
  INVENTORY_ALERTS: 'inventory/alerts',
  
  // Sales components
  SALES_DASHBOARD: 'sales/dashboard',
  SALES_TRANSACTIONS: 'sales/transactions',
  SALES_REPORTS: 'sales/reports',
  SALES_CUSTOMERS: 'sales/customers',
  
  // HR components
  HR_STAFF_MANAGEMENT: 'hr/staff',
  HR_ATTENDANCE: 'hr/attendance',
  HR_PAYROLL: 'hr/payroll',
  HR_LEAVE: 'hr/leave',
  HR_PERFORMANCE: 'hr/performance',
  
  // Marketing components
  MARKETING_CAMPAIGNS: 'marketing/campaigns',
  MARKETING_ANALYTICS: 'marketing/analytics',
  MARKETING_TEMPLATES: 'marketing/templates',
  MARKETING_NOTIFICATIONS: 'marketing/notifications',
  
  // POS components
  POS_INTERFACE: 'pos/interface',
  POS_SEARCH: 'pos/search',
  POS_CART: 'pos/cart',
  POS_PAYMENT: 'pos/payment',
  POS_RECEIPTS: 'pos/receipts',
  
  // Reports components
  REPORTS_FINANCIAL: 'reports/financial',
  REPORTS_SALES: 'reports/sales',
  REPORTS_INVENTORY: 'reports/inventory',
  REPORTS_HR: 'reports/hr',
  
  // Settings components
  SETTINGS_USERS: 'settings/users',
  SETTINGS_PERMISSIONS: 'settings/permissions',
  SETTINGS_SYSTEM: 'settings/system',
  SETTINGS_BRANCH: 'settings/branch'
} as const;

export type ComponentPath = typeof COMPONENT_PATHS[keyof typeof COMPONENT_PATHS];

// Default permissions for each system role
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: [
    // Super Admin has access to everything
    { id: 'super_admin_all', name: 'All Access', description: 'Full system access', resource: '*', action: '*', component: '*', category: 'standard', isVisible: true, isEnabled: true }
  ],
  
  [SYSTEM_ROLES.HR_ADMIN]: [
    { id: 'hr_admin_dashboard', name: 'HR Dashboard', description: 'Access to HR dashboard', resource: 'hr', action: 'read', component: 'dashboard/hr', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'hr_admin_staff', name: 'Staff Management', description: 'Manage staff members', resource: 'hr', action: 'admin', component: 'hr/staff', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'hr_admin_attendance', name: 'Attendance Management', description: 'Manage attendance records', resource: 'hr', action: 'admin', component: 'hr/attendance', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'hr_admin_payroll', name: 'Payroll Management', description: 'Manage payroll and compensation', resource: 'hr', action: 'admin', component: 'hr/payroll', category: 'sensitive', isVisible: true, isEnabled: true },
    { id: 'hr_admin_reports', name: 'HR Reports', description: 'Generate HR reports', resource: 'reports', action: 'read', component: 'reports/hr', category: 'standard', isVisible: true, isEnabled: true }
  ],
  
  [SYSTEM_ROLES.MARKETING_ADMIN]: [
    { id: 'marketing_admin_dashboard', name: 'Marketing Dashboard', description: 'Access to marketing dashboard', resource: 'marketing', action: 'read', component: 'dashboard/marketing', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'marketing_admin_campaigns', name: 'Campaign Management', description: 'Manage marketing campaigns', resource: 'marketing', action: 'admin', component: 'marketing/campaigns', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'marketing_admin_analytics', name: 'Marketing Analytics', description: 'View marketing analytics', resource: 'marketing', action: 'read', component: 'marketing/analytics', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'marketing_admin_templates', name: 'Template Management', description: 'Manage marketing templates', resource: 'marketing', action: 'admin', component: 'marketing/templates', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'marketing_admin_reports', name: 'Marketing Reports', description: 'Generate marketing reports', resource: 'reports', action: 'read', component: 'reports/marketing', category: 'standard', isVisible: true, isEnabled: true }
  ],
  
  [SYSTEM_ROLES.HR_STAFF]: [
    { id: 'hr_staff_dashboard', name: 'HR Dashboard', description: 'Access to HR dashboard', resource: 'hr', action: 'read', component: 'dashboard/hr', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'hr_staff_attendance', name: 'Attendance Tracking', description: 'Track attendance records', resource: 'hr', action: 'write', component: 'hr/attendance', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'hr_staff_leave', name: 'Leave Management', description: 'Manage leave requests', resource: 'hr', action: 'write', component: 'hr/leave', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'hr_staff_payroll_view', name: 'View Payroll', description: 'View payroll information', resource: 'hr', action: 'read', component: 'hr/payroll', category: 'sensitive', isVisible: true, isEnabled: false, upgradeMessage: 'Upgrade to HR Admin to manage payroll' }
  ],
  
  [SYSTEM_ROLES.MARKETING_STAFF]: [
    { id: 'marketing_staff_dashboard', name: 'Marketing Dashboard', description: 'Access to marketing dashboard', resource: 'marketing', action: 'read', component: 'dashboard/marketing', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'marketing_staff_campaigns', name: 'Campaign Management', description: 'Manage marketing campaigns', resource: 'marketing', action: 'write', component: 'marketing/campaigns', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'marketing_staff_analytics', name: 'View Analytics', description: 'View marketing analytics', resource: 'marketing', action: 'read', component: 'marketing/analytics', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'marketing_staff_templates', name: 'Use Templates', description: 'Use marketing templates', resource: 'marketing', action: 'read', component: 'marketing/templates', category: 'standard', isVisible: true, isEnabled: true }
  ],
  
  [SYSTEM_ROLES.CASHIER]: [
    { id: 'cashier_dashboard', name: 'Cashier Dashboard', description: 'Access to cashier dashboard', resource: 'pos', action: 'read', component: 'dashboard/cashier', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'cashier_pos', name: 'POS Interface', description: 'Access to POS system', resource: 'pos', action: 'admin', component: 'pos/interface', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'cashier_transactions', name: 'Transaction Management', description: 'Process transactions', resource: 'pos', action: 'write', component: 'pos/transactions', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'cashier_customers', name: 'Customer Management', description: 'Manage customers', resource: 'pos', action: 'write', component: 'pos/customers', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'cashier_reports', name: 'Sales Reports', description: 'View sales reports', resource: 'reports', action: 'read', component: 'reports/sales', category: 'standard', isVisible: true, isEnabled: true }
  ],
  
  [SYSTEM_ROLES.INVENTORY_CLERK]: [
    { id: 'inventory_dashboard', name: 'Inventory Dashboard', description: 'Access to inventory dashboard', resource: 'inventory', action: 'read', component: 'dashboard/inventory', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'inventory_management', name: 'Inventory Management', description: 'Manage inventory', resource: 'inventory', action: 'admin', component: 'inventory/management', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'inventory_catalog', name: 'Product Catalog', description: 'Manage product catalog', resource: 'inventory', action: 'write', component: 'inventory/catalog', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'inventory_stock', name: 'Stock Management', description: 'Manage stock levels', resource: 'inventory', action: 'write', component: 'inventory/stock', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'inventory_alerts', name: 'Stock Alerts', description: 'Manage stock alerts', resource: 'inventory', action: 'write', component: 'inventory/alerts', category: 'standard', isVisible: true, isEnabled: true },
    { id: 'inventory_reports', name: 'Inventory Reports', description: 'Generate inventory reports', resource: 'reports', action: 'read', component: 'reports/inventory', category: 'standard', isVisible: true, isEnabled: true }
  ]
};

