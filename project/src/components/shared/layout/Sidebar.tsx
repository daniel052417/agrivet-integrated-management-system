import React, { useState } from 'react';
import { 
  Home, BarChart3, Package, TrendingUp, AlertTriangle, ShoppingCart, 
  Users, FileText, Settings, Bell, Shield, MessageSquare,
  Megaphone, Calendar, DollarSign,
  Archive, Warehouse, ChevronDown,
  Menu, X, LogOut, UserCheck,
  Clock
} from 'lucide-react';
import logo from '../../../assets/logo.png';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  user?: any;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  category: string;
  children?: MenuItem[];
  indent?: boolean;
  component?: string;
  resource?: string;
  action?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, onLogout, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Dashboard']);

  const menuItems: MenuItem[] = [
    // Dashboard Overview
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: Home, 
      category: 'Dashboard',
      component: 'dashboard/admin',
      resource: 'dashboard',
      action: 'read'
    },
    
    // Inventory Management
    { 
      id: 'inventory-management', 
      label: 'Inventory Management', 
      icon: Warehouse, 
      category: 'Inventory',
      component: 'inventory/management',
      resource: 'inventory',
      action: 'read',
      children: [
        { 
          id: 'all-products', 
          label: 'All Products', 
          icon: Archive, 
          category: 'Inventory',
          component: 'inventory/management',
          resource: 'inventory',
          action: 'read'
        },
        { 
          id: 'categories', 
          label: 'Categories', 
          icon: Package, 
          category: 'Inventory',
          component: 'inventory/categories',
          resource: 'inventory',
          action: 'read'
        },
        { 
          id: 'low-stock', 
          label: 'Low Stock Alerts', 
          icon: AlertTriangle, 
          category: 'Inventory',
          component: 'inventory/low-stock',
          resource: 'inventory',
          action: 'read'
        },
      ]
    },
    
    // Sales & POS
    { 
      id: 'sales-pos', 
      label: 'Sales & POS', 
      icon: ShoppingCart, 
      category: 'Sales',
      component: 'pos/interface',
      resource: 'pos',
      action: 'read',
      children: [
        { 
          id: 'pos-interface', 
          label: 'POS Interface', 
          icon: ShoppingCart, 
          category: 'Sales',
          component: 'pos/interface',
          resource: 'pos',
          action: 'read'
        },
        { 
          id: 'sales-dashboard', 
          label: 'Sales Dashboard', 
          icon: BarChart3, 
          category: 'Sales',
          component: 'sales/dashboard',
          resource: 'sales',
          action: 'read'
        },
        { 
          id: 'sales-records', 
          label: 'All Sales Records', 
          icon: FileText, 
          category: 'Sales',
          component: 'sales/records',
          resource: 'sales',
          action: 'read'
        },
        { 
          id: 'daily-sales', 
          label: 'Daily Sales Summary', 
          icon: Calendar, 
          category: 'Sales',
          component: 'sales/daily-summary',
          resource: 'sales',
          action: 'read'
        },
        { 
          id: 'product-sales', 
          label: 'Product Sales Report', 
          icon: TrendingUp, 
          category: 'Sales',
          component: 'sales/product-report',
          resource: 'sales',
          action: 'read'
        },
      ]
    },
    
    // Staff & User Management
    { 
      id: 'staff-user-management', 
      label: 'Staff & User Management', 
      icon: Users, 
      category: 'Staff & Users',
      component: 'users/accounts',
      resource: 'users',
      action: 'read',
      children: [
        { 
          id: 'user-accounts', 
          label: 'User Accounts', 
          icon: Users, 
          category: 'Staff & Users',
          component: 'users/accounts',
          resource: 'users',
          action: 'read'
        },
        { 
          id: 'add-staff', 
          label: 'Add Staff', 
          icon: UserCheck, 
          category: 'Staff & Users',
          component: 'hr/staff',
          resource: 'hr',
          action: 'read'
        },
        { 
          id: 'roles-permissions', 
          label: 'Roles & Permissions', 
          icon: Shield, 
          category: 'Staff & Users',
          component: 'staff/roles-permissions',
          resource: 'staff',
          action: 'read'
        },
        { 
          id: 'activity-logs', 
          label: 'Activity Logs', 
          icon: BarChart3, 
          category: 'Staff & Users',
          component: 'users/activity',
          resource: 'users',
          action: 'read'
        },
      ]
    },
    
    // HR Management
    { 
      id: 'hr-management', 
      label: 'HR Management', 
      icon: Users, 
      category: 'HR',
      component: 'hr/staff',
      resource: 'hr',
      action: 'read',
      children: [
        { 
          id: 'hr-dashboard', 
          label: 'HR Dashboard', 
          icon: Users, 
          category: 'HR',
          component: 'dashboard/hr',
          resource: 'hr',
          action: 'read'
        },
        { 
          id: 'attendance-dashboard', 
          label: 'Attendance Dashboard', 
          icon: Clock, 
          category: 'HR',
          component: 'hr/attendance',
          resource: 'hr',
          action: 'read'
        },
        { 
          id: 'leave-management', 
          label: 'Leave Management', 
          icon: Calendar, 
          category: 'HR',
          component: 'hr/leave',
          resource: 'hr',
          action: 'read'
        },
        { 
          id: 'hr-analytics', 
          label: 'HR Analytics', 
          icon: BarChart3, 
          category: 'HR',
          component: 'hr/analytics',
          resource: 'hr',
          action: 'read'
        },
        { 
          id: 'payroll', 
          label: 'Payroll Management', 
          icon: DollarSign, 
          category: 'HR',
          component: 'hr/payroll',
          resource: 'hr',
          action: 'read'
        },
      ]
    },
    
    // Marketing
    { 
      id: 'marketing', 
      label: 'Marketing', 
      icon: Megaphone, 
      category: 'Marketing',
      component: 'marketing/dashboard',
      resource: 'marketing',
      action: 'read',
      children: [
        { 
          id: 'marketing-dashboard', 
          label: 'Marketing Dashboard', 
          icon: BarChart3, 
          category: 'Marketing',
          component: 'marketing/dashboard',
          resource: 'marketing',
          action: 'read'
        },
        { 
          id: 'campaigns', 
          label: 'Campaign Management', 
          icon: Megaphone, 
          category: 'Marketing',
          component: 'marketing/campaign-form',
          resource: 'marketing',
          action: 'read'
        },
        { 
          id: 'templates', 
          label: 'Template Management', 
          icon: FileText, 
          category: 'Marketing',
          component: 'marketing/templates',
          resource: 'marketing',
          action: 'read'
        },
        { 
          id: 'analytics', 
          label: 'Campaign Analytics', 
          icon: TrendingUp, 
          category: 'Marketing',
          component: 'reports/analytics',
          resource: 'marketing',
          action: 'read'
        },
        { 
          id: 'notifications', 
          label: 'Client Notifications', 
          icon: Bell, 
          category: 'Marketing',
          component: 'marketing/notifications',
          resource: 'marketing',
          action: 'read'
        },
      ]
    },
    
    // Reports & Analytics
    { 
      id: 'reports', 
      label: 'Reports & Analytics', 
      icon: FileText, 
      category: 'Reports',
      component: 'reports/analytics',
      resource: 'reports',
      action: 'read',
      children: [
        { 
          id: 'reports-analytics', 
          label: 'Reports Analytics', 
          icon: BarChart3, 
          category: 'Reports',
          component: 'reports/analytics',
          resource: 'reports',
          action: 'read'
        },
        { 
          id: 'event-center', 
          label: 'Event Center', 
          icon: Bell, 
          category: 'Reports',
          component: 'reports/events',
          resource: 'reports',
          action: 'read'
        },
      ]
    },
    
    // Other Features
    { 
      id: 'exports', 
      label: 'Exports & Reports', 
      icon: FileText, 
      category: 'Other',
      component: 'reports/analytics',
      resource: 'reports',
      action: 'read'
    },
    { 
      id: 'claims', 
      label: 'Claims', 
      icon: MessageSquare, 
      category: 'Other',
      component: 'reports/events',
      resource: 'reports',
      action: 'read'
    },
    
    // Settings
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      category: 'Settings',
      component: 'settings/system',
      resource: 'settings',
      action: 'read',
      children: [
        { 
          id: 'user-management', 
          label: 'User Management', 
          icon: Users, 
          category: 'Settings',
          component: 'settings/users',
          resource: 'settings',
          action: 'read'
        },
        { 
          id: 'permissions', 
          label: 'Permissions', 
          icon: Shield, 
          category: 'Settings',
          component: 'settings/permissions',
          resource: 'settings',
          action: 'read'
        },
        { 
          id: 'system-settings', 
          label: 'System Settings', 
          icon: Settings, 
          category: 'Settings',
          component: 'settings/system',
          resource: 'settings',
          action: 'read'
        },
        { 
          id: 'branch-settings', 
          label: 'Branch Settings', 
          icon: Warehouse, 
          category: 'Settings',
          component: 'settings/branch',
          resource: 'settings',
          action: 'read'
        },
      ]
    },
  ];

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activeSection === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedCategories.includes(item.category);

    const menuItemContent = (
      <button
        onClick={() => {
          if (hasChildren) {
            toggleCategory(item.category);
          } else {
            onSectionChange(item.id);
          }
        }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
            : 'text-gray-700 hover:bg-gray-100'
        } ${item.indent ? 'ml-6' : ''}`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
        {!isCollapsed && (
          <>
            <span className="flex-1 font-medium">{item.label}</span>
            {hasChildren && (
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
              />
            )}
          </>
        )}
      </button>
    );

    return <div key={item.id}>{menuItemContent}</div>;
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-gray-800">AgriVet</h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <div key={item.id}>
            {renderMenuItem(item)}
            {item.children && expandedCategories.includes(item.category) && !isCollapsed && (
              <div className="mt-2 space-y-1">
                {item.children.map(child => renderMenuItem(child))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">
                {user?.role || 'Role'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

