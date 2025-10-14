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
import { CustomUser } from '../../../lib/customAuth';

interface SimplifiedSidebarProps {
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
  indent?: boolean;
}

const SimplifiedSidebar: React.FC<SimplifiedSidebarProps> = ({ user, activeSection, onSectionChange, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Default']);

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
        { id: 'sales-dashboard', label: 'Sales Dashboard', icon: TrendingUp, category: 'Sales' },
        { id: 'daily-sales', label: 'Daily Sales Summary', icon: Calendar, category: 'Sales' },
        { id: 'product-sales', label: 'Product Sales Report', icon: FileText, category: 'Sales' },
      ]
    },
    
    { id: 'staff-user-management',
       label: 'User Management',
        icon: Users, category: 'Staff & Users',
         children: [ { id: 'user-accounts', label: 'User Accounts', icon: Users, category: 'Staff & Users' },
                     { id: 'activity-logs', label: 'Activity Logs', icon: BarChart3, category: 'Staff & Users' },
                     { id: 'session-history', label: 'Session History', icon: Clock, category: 'Staff & Users' },
                     { id: 'user-roles-overview', label: 'User Roles Overview', icon: Shield, category: 'Staff & Users' }, ] 
    },
    
    { 
      id: 'hr', 
      label: 'HR', 
      icon: Users, 
      category: 'HR',
      children: [
        { id: 'hr-dashboard', label: 'HR Dashboard', icon: Users, category: 'HR' },
        { id: 'staff', label: 'Staff', icon: UserCheck, category: 'HR' },
        { id: 'attendance-dashboard', label: 'Attendance Dashboard', icon: Clock, category: 'HR' },
        { id: 'leave-management', label: 'Leave Management', icon: Calendar, category: 'HR' },
        { id: 'hr-analytics', label: 'HR Analytics', icon: BarChart3, category: 'HR' },
        { id: 'payroll', label: 'Payroll Management', icon: DollarSign, category: 'HR' },
      ]
    },
    
    { 
      id: 'marketing', 
      label: 'Marketing', 
      icon: Megaphone, 
      category: 'Marketing',
      children: [
        { id: 'marketing-dashboard', label: 'Marketing Dashboard (Overview)', icon: BarChart3, category: 'Marketing' },
        { id: 'promotions-campaigns', label: 'Promotions & Campaigns', icon: Megaphone, category: 'Marketing' },
        { id: 'insights', label: 'Insights & Analytics', icon: TrendingUp, category: 'Marketing' },
        { id: 'campaign-management', label: 'Campaign Management', icon: Megaphone, category: 'Marketing' },
        { id: 'template-management', label: 'Template Management', icon: Settings, category: 'Marketing' },
        { id: 'client-notifications', label: 'Client Notifications', icon: Bell, category: 'Marketing' },
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

  // Filter menu items based on user's sidebar config
  const filteredMenuItems = menuItems.filter(item => {
    // Check if the main item or any of its children are in the user's allowed sections
    if (user.sidebar_config.sections.includes(item.id)) {
      return true;
    }
    if (item.children) {
      return item.children.some(child => user.sidebar_config.sections.includes(child.id));
    }
    return false;
  });

  const toggleCategory = (category: string) => {
    if (isCollapsed) return;
    
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.children && !isCollapsed) {
      toggleCategory(item.id);
    } else {
      onSectionChange(item.id);
    }
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedCategories.includes(item.id);
    const isNestedChild = isChild && item.children;

    // Check if this item should be visible based on user permissions
    const isVisible = user.sidebar_config.sections.includes(item.id) || 
      (item.children && item.children.some(child => user.sidebar_config.sections.includes(child.id)));

    if (!isVisible) return null;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center justify-between group transition-all duration-200 rounded-lg mx-2 ${
            isChild && !isNestedChild ? 'pl-10 pr-4 py-2 ml-4' : isChild ? 'pl-14 pr-4 py-2 ml-8' : 'px-4 py-3'
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
              <span className={`text-sm font-medium truncate ${item.indent ? 'ml-4' : ''}`}>
                {item.label}
              </span>
            )}
          </div>
          
          {!isCollapsed && hasChildren && (
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            } ${
              isActive ? 'text-white' : 'text-gray-400'
            }`} />
          )}
        </button>

        {/* Children */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="bg-gray-50/50">
            {item.children?.map(child => {
              // Only render child if user has permission
              if (user.sidebar_config.sections.includes(child.id)) {
                return renderMenuItem(child, true);
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  const categories = [
    { name: 'Default', items: filteredMenuItems.filter(item => item.category === 'Default') },
    { name: 'Inventory', items: filteredMenuItems.filter(item => item.category === 'Inventory') },
    { name: 'Sales', items: filteredMenuItems.filter(item => item.category === 'Sales') },
    { name: 'Staff & Users', items: filteredMenuItems.filter(item => item.category === 'Staff & Users') },
    { name: 'HR', items: filteredMenuItems.filter(item => item.category === 'HR') },
    { name: 'Marketing', items: filteredMenuItems.filter(item => item.category === 'Marketing') },
    { name: 'Reports', items: filteredMenuItems.filter(item => item.category === 'Reports') },
    { name: 'Other', items: filteredMenuItems.filter(item => item.category === 'Other') },
  ];

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
                <img src={logo} alt="AGRIVET" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">TIONGSON</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {categories.map(category => (
            <div key={category.name}>
              {!isCollapsed && category.items.length > 0 && (
                <div className="px-6 py-2 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {category.name}
                  </h3>
                </div>
              )}
              <div className="space-y-1">
                {category.items.map(item => renderMenuItem(item))}
              </div>
            </div>
          ))}
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

export default SimplifiedSidebar;