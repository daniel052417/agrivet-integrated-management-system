import React, { lazy, Suspense, ComponentType } from 'react';
import { ComponentPath } from '../types/permissions';

// Lazy load all components
const componentMap: Record<ComponentPath, ComponentType<any>> = {
  // Dashboard components
  'dashboard/admin': lazy(() => import('../components/dashboard/AdminDashboard')),
  'dashboard/overview': lazy(() => import('../components/dashboard/Overview')),
  'dashboard/sales-chart': lazy(() => import('../components/dashboard/SalesChart')),
  'dashboard/inventory-summary': lazy(() => import('../components/dashboard/InventorySummary')),
  'dashboard/sales-by-branch': lazy(() => import('../components/dashboard/SalesByBranch')),
  'dashboard/sales-by-product': lazy(() => import('../components/dashboard/SalesByProduct')),
  'dashboard/top-performers': lazy(() => import('../components/dashboard/TopPerformers')),
  'dashboard/recent-activity': lazy(() => import('../components/dashboard/RecentActivity')),
  'dashboard/low-stock-alerts': lazy(() => import('../components/dashboard/LowStockAlert')),
  'dashboard/hr': lazy(() => import('../components/hr/HRDashboard')),
  'dashboard/marketing': lazy(() => import('../components/marketing/MarketingDashboard')),
  
  // Inventory components
  'inventory/management': lazy(() => import('../components/inventory/InventoryManagement')),
  'inventory/categories': lazy(() => import('../components/inventory/Categories')),
  'inventory/low-stock': lazy(() => import('../components/inventory/LowStockAlerts')),
  'inventory/summary': lazy(() => import('../components/inventory/InventorySummaryPage')),
  
  // Sales components
  'sales/dashboard': lazy(() => import('../components/sales/SalesDashboard')),
  'sales/records': lazy(() => import('../components/sales/AllSalesRecords')),
  'sales/daily-summary': lazy(() => import('../components/sales/DailySalesSummary')),
  'sales/product-report': lazy(() => import('../components/sales/ProductSalesReport')),
  'sales/value': lazy(() => import('../components/sales/SalesValue')),
  
  // HR components
  'hr/staff': lazy(() => import('../components/hr/AddStaff')),
  'hr/attendance': lazy(() => import('../components/hr/AttendanceDashboard')),
  'hr/payroll': lazy(() => import('../components/hr/PayrollCompensation')),
  'hr/leave': lazy(() => import('../components/hr/LeaveManagement')),
  'hr/analytics': lazy(() => import('../components/hr/HRAnalytics')),
  
  // Staff components
  'staff/attendance-timesheet': lazy(() => import('../components/staff/AttendanceTimesheet')),
  'staff/leave-request': lazy(() => import('../components/staff/LeaveRequest')),
  'staff/roles-permissions': lazy(() => import('../components/staff/RolesPermissions')),
  
  // Users components
  'users/active': lazy(() => import('../components/users/ActiveUsers')),
  'users/accounts': lazy(() => import('../components/users/UserAccounts')),
  'users/activity': lazy(() => import('../components/users/UserActivity')),
  'users/permissions': lazy(() => import('../components/users/UserPermissions')),
  
  // Marketing components
  'marketing/dashboard': lazy(() => import('../components/marketing/MarketingDashboard')),
  'marketing/campaign-form': lazy(() => import('../components/marketing/CampaignForm')),
  'marketing/campaign-preview': lazy(() => import('../components/marketing/CampaignPreview')),
  'marketing/notifications': lazy(() => import('../components/marketing/ClientNotifications')),
  'marketing/templates': lazy(() => import('../components/marketing/TemplateManagement')),
  
  // POS components
  'pos/interface': lazy(() => import('../components/pos/POSInterface')),
  
  // Reports components
  'reports/events': lazy(() => import('../components/reports/EventCenter')),
  'reports/analytics': lazy(() => import('../components/reports/ReportsAnalytics')),
  
  // Settings components
  'settings/system': lazy(() => import('../components/settings/SettingsPage')),
  
  // Admin test components
  'admin/permission-test': lazy(() => import('../components/admin/PermissionTest')),
};

// Loading component
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Error boundary component
const ErrorComponent = ({ componentPath }: { componentPath: string }) => (
  <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg">
    <div className="text-center">
      <div className="text-red-600 text-4xl mb-2">⚠️</div>
      <h3 className="text-lg font-medium text-red-900 mb-2">Component Error</h3>
      <p className="text-red-700">Failed to load component: {componentPath}</p>
    </div>
  </div>
);

// Component registry interface
interface ComponentRegistryProps {
  componentPath: ComponentPath;
  props?: Record<string, any>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

// Main component registry
export const ComponentRegistry: React.FC<ComponentRegistryProps> = ({
  componentPath,
  props = {},
  fallback = <LoadingComponent />,
  errorFallback
}) => {
  const Component = componentMap[componentPath];
  
  if (!Component) {
    return (
      <div className="flex items-center justify-center p-8 bg-yellow-50 rounded-lg">
        <div className="text-center">
          <div className="text-yellow-600 text-4xl mb-2">🔍</div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Component Not Found</h3>
          <p className="text-yellow-700">Component not found: {componentPath}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <ErrorBoundary componentPath={componentPath} errorFallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

// Error boundary for component loading
class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode; 
    componentPath: string; 
    errorFallback?: React.ReactNode 
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.errorFallback || <ErrorComponent componentPath={this.props.componentPath} />;
    }

    return this.props.children;
  }
}

// Utility functions
export const getAvailableComponents = (): ComponentPath[] => {
  return Object.keys(componentMap) as ComponentPath[];
};

export const isComponentAvailable = (componentPath: string): boolean => {
  return componentPath in componentMap;
};

export const getComponentMetadata = (componentPath: ComponentPath) => {
  // This could be extended to include metadata about components
  return {
    path: componentPath,
    isLazy: true,
    category: componentPath.split('/')[0],
    name: componentPath.split('/')[1]
  };
};

// Hook for component access
export const useComponentRegistry = (componentPath: ComponentPath) => {
  return {
    isAvailable: isComponentAvailable(componentPath),
    metadata: getComponentMetadata(componentPath),
    Component: componentMap[componentPath]
  };
};
