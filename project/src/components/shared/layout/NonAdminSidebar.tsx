import React, { useState, useEffect } from 'react';
import { 
  Home, BarChart3, Package, TrendingUp, AlertTriangle, ShoppingCart, 
  Users, FileText, Settings, MessageSquare,
  Megaphone, Calendar, DollarSign,
  Archive, Warehouse,
  Menu, X, LogOut, UserCheck,
  Clock, Tag, Target, Star, Gift, Building, Receipt, Activity
} from 'lucide-react';
import logo from '../../../assets/logo.png';
import { CustomUser } from '../../../lib/customAuth';
import { settingsService } from '../../../lib/settingsService';

interface NonAdminSidebarProps {
  user: CustomUser;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  category: string;
  children?: MenuItem[];
}

const NonAdminSidebar: React.FC<NonAdminSidebarProps> = ({ user, activeSection, onSectionChange, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hrSettings, setHrSettings] = useState<any>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [appName, setAppName] = useState('TIONGSON');

  useEffect(() => {
    loadHRSettings();
    loadLogoSettings();
  }, []);

  const loadHRSettings = async () => {
    try {
      const settings = await settingsService.getHRSettings();
      setHrSettings(settings);
      console.log('🔧 HR Settings loaded in sidebar:', settings);
    } catch (err) {
      console.error('Error loading HR settings:', err);
    }
  };

  const loadLogoSettings = async () => {
    try {
      const settings = await settingsService.getAllSettings();
      const general = settings.general || {};
      setCompanyLogo(general.companyLogo || settings.company_logo || null);
      setAppName(general.companyName || settings.company_name || 'TIONGSON');
    } catch (error) {
      console.error('Error loading logo settings:', error);
    }
  };

  // Function to flatten menu items - all items are flat, no nesting
  const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
    const flattened: MenuItem[] = [];
    
    items.forEach(item => {
      // Check if user has permission for this item
      const hasPermission = user.sidebar_config.sections.includes(item.id) || 
        (item.children && item.children.some(child => user.sidebar_config.sections.includes(child.id)));
      
      if (hasPermission) {
        if (item.children && item.children.length > 0) {
          // Add parent item if user has permission
          if (user.sidebar_config.sections.includes(item.id)) {
            flattened.push({
              ...item,
              children: undefined // Remove children for flat structure
            });
          }
          
          // Add children as separate items
          item.children.forEach(child => {
            if (user.sidebar_config.sections.includes(child.id)) {
              flattened.push({
                ...child,
                indent: true // Mark as indented for visual hierarchy
              });
            }
          });
        } else {
          // Add regular item
          flattened.push(item);
        }
      }
    });
    
    return flattened;
  };

  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: Home, category: 'Default' },
    
    { 
      id: 'inventory-management', 
      label: 'Inventory Management', 
      icon: Warehouse, 
      category: 'Inventory',
      children: [
        { id: 'all-products', label: 'All Products', icon: Archive, category: 'Inventory' },
        { id: 'categories', label: 'Categories', icon: Package, category: 'Inventory' },
        { id: 'brands', label: 'Brands', icon: Tag, category: 'Inventory' },
        { id: 'suppliers', label: 'Suppliers', icon: Building, category: 'Inventory' },
        { id: 'low-stock', label: 'Low Stock Alerts', icon: AlertTriangle, category: 'Inventory' },
      ]
    },
    
    { 
      id: 'sales-pos', 
      label: 'Sales & POS', 
      icon: ShoppingCart, 
      category: 'Sales',
      children: [
        { id: 'sales-records', label: 'All Sales Records', icon: BarChart3, category: 'Sales' },
        { id: 'daily-sales', label: 'Daily Sales Summary', icon: Calendar, category: 'Sales' },
        { id: 'product-sales', label: 'Product Sales Report', icon: FileText, category: 'Sales' },
      ]
    },

    {
      id: 'finance',
      label: 'Finance Management',
      icon: DollarSign,
      category: 'Finance',
      children: [
        { id: 'expenses', label: 'Expenses', icon: Receipt, category: 'Finance' },
        { id: 'cash-flow', label: 'Cash Flow Overview', icon: Activity, category: 'Finance' },
      ]
    },
    
    { 
      id: 'staff-user-management',
      label: 'User Management',
      icon: Users, 
      category: 'Staff & Users',
      children: [ 
        { id: 'user-accounts', label: 'User Accounts', icon: Users, category: 'Staff & Users' },
        { id: 'activity-logs', label: 'Activity Logs', icon: BarChart3, category: 'Staff & Users' },
        { id: 'session-history', label: 'Session History', icon: Clock, category: 'Staff & Users' }, 
      ]
    },
    
    { 
      id: 'hr', 
      label: 'HR', 
      icon: Users, 
      category: 'HR',
      children: [
        { id: 'hr-dashboard', label: 'HR Dashboard', icon: Users, category: 'Default' },
        { id: 'staff', label: 'Employee Management', icon: UserCheck, category: 'HR' },
        { id: 'attendance-dashboard', label: 'Attendance Dashboard', icon: Clock, category: 'HR' },
        // Only show Leave Management if enabled in settings
        ...(hrSettings?.enable_leave_management ? [
          { id: 'leave-management', label: 'Leave Management', icon: Calendar, category: 'HR' }
        ] : []),
        { id: 'payroll', label: 'Payroll Management', icon: DollarSign, category: 'HR' },
      ]
    },
    
    { 
      id: 'marketing', 
      label: 'Marketing', 
      icon: Megaphone, 
      category: 'Marketing',
      children: [
        { id: 'marketing-overview', label: 'Overview', icon: BarChart3, category: 'Marketing' },
        { id: 'promotions-announcements', label: 'Promotions & Announcements', icon: Tag, category: 'Marketing'},
        { id: 'insights-analytics', label: 'Insights & Analytics', icon: TrendingUp, category: 'Marketing' },
        { id: 'client-notifications', label: 'Client Notifications', icon: Gift, category: 'Marketing' },
        { id: 'facebook-integration', label: 'Facebook Integration', icon: Users, category: 'Marketing' },
      ]
    },
    
    { 
      id: 'reports', 
      label: 'Report & Analytics', 
      icon: FileText, 
      category: 'Reports',
    },
    
    { id: 'exports', label: 'Exports & Reports', icon: FileText, category: 'Other' },
    { id: 'claims', label: 'Claims', icon: MessageSquare, category: 'Other' },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'Other' },
  ];

  // Filter menu items based on user's sidebar config - always flattened
  const filteredMenuItems = flattenMenuItems(menuItems);

  const handleItemClick = (item: MenuItem) => {
    // Always navigate directly - no expand/collapse behavior
    onSectionChange(item.id);
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    const isIndented = (item as any).indent === true;

    // Check visibility based on user's sidebar config
    const isVisible = user.sidebar_config.sections.includes(item.id);

    if (!isVisible) return null;

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`w-full flex items-center justify-between group transition-all duration-200 rounded-lg mx-2 ${
          isIndented 
            ? 'pl-8 pr-4 py-3 ml-2' 
            : 'px-3 py-4'
        } ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <div className="flex items-center min-w-0">
          <Icon className={`flex-shrink-0 transition-colors duration-200 ${
            isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
          } ${
            isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'
          }`} />
          {!isCollapsed && (
            <span className={`text-sm font-medium truncate ${isIndented ? 'ml-2' : ''}`}>
              {item.label}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div className={`${
        isCollapsed ? 'w-16' : 'w-72'
      } bg-white shadow-xl h-screen overflow-hidden transition-all duration-300 ease-in-out flex flex-col relative z-50`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-100 ${
          isCollapsed ? 'px-3' : 'px-6'
        }`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={companyLogo || logo} 
                  alt="Company Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = logo;
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">{appName}</h1>
                <p className="text-xs text-gray-500">
                  Admin Dashboard
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg mx-auto">
              <img 
                src={companyLogo || logo} 
                alt="Company Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = logo;
                }}
              />
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${
              isCollapsed ? 'mx-auto' : ''
            }`}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 text-gray-600" />
            ) : (
              <X className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation - Flat menu, no categories */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-2">
          <div className="space-y-2">
            {filteredMenuItems.map(item => renderMenuItem(item))}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role_display_name || user.role_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NonAdminSidebar;




