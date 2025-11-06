import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { CustomUser } from '../../lib/customAuth';
import { useBranchTerminal } from '../../hooks/useBranchTerminal';
import { branchTerminalService } from '../../lib/branchTerminalService';
import { settingsService } from '../../lib/settingsService';

interface POSLayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  onLogout: () => void;
  user: CustomUser;
  onlineOrdersCount?: number;
}

const POSLayout: React.FC<POSLayoutProps> = ({ 
  children, 
  currentScreen, 
  onScreenChange, 
  onLogout,
  user,
  onlineOrdersCount = 0
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const { branchTerminalData, loading, error } = useBranchTerminal(user);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getAllSettings();
        const general = settings.general || {};
        setCompanyLogo(general.companyLogo || settings.company_logo || null);
      } catch (error) {
        console.error('Error loading logo settings:', error);
      }
    };

    loadSettings();
  }, []);

  const navigationItems = [
    { id: 'cashier', label: 'Cashier', icon: ShoppingCart, color: 'bg-green-500' },
    { id: 'inventory', label: 'Inventory', icon: Package, color: 'bg-blue-500' },
    // { id: 'customers', label: 'Customers', icon: Users, color: 'bg-purple-500' },
    { id: 'online-orders', label: 'Online Orders', icon: ShoppingBag, color: 'bg-emerald-500' },
    { id: 'reports', label: 'Reports', icon: BarChart3, color: 'bg-orange-500' },
    // { id: 'users', label: 'Users', icon: Settings, color: 'bg-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-2 border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <img 
                  src={companyLogo || logo} 
                  alt="Company Logo" 
                  className="w-10 h-10 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = logo;
                  }}
                />
                <div>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : error ? (
                    <div>
                      <h1 className="text-xl font-bold text-red-600">Error</h1>
                      <p className="text-sm text-red-500">Failed to load branch info</p>
                    </div>
                  ) : branchTerminalData ? (
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        {branchTerminalService.getTerminalCode(branchTerminalData.terminal)}
                      </h1>
                      <p className="text-sm text-gray-500">
                        {branchTerminalData.branch.name}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">POS Terminal</h1>
                      <p className="text-sm text-gray-500">Point of Sale System</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products, customers..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onScreenChange('online-orders')}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user ? `${user.first_name} ${user.last_name}` : 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user ? `${user.role_display_name || user.role_name}` : 'Role'}
                  </p>
                  {branchTerminalData?.sessionNumber && (
                    <p className="text-xs text-blue-600 font-medium">
                      Session: {branchTerminalData.sessionNumber}
                    </p>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                const showBadge = item.id === 'online-orders' && onlineOrdersCount > 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onScreenChange(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-left transition-all duration-200 relative ${
                      isActive
                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${item.color} ${
                      isActive ? 'bg-green-500' : ''
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-lg font-medium">{item.label}</span>
                    
                    {/* Notification Badge */}
                    {showBadge && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                        {onlineOrdersCount > 99 ? '99+' : onlineOrdersCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions */}
            {/* <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors">
                  New Sale
                </button>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-colors">
                  Quick Stock Check
                </button>
              </div>
            </div> */}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default POSLayout;
