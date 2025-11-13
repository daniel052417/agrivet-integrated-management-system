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
      <header className="bg-white shadow-lg border-b-2 border-gray-200 sticky top-0 z-30">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-[64px] md:h-16 py-2 md:py-0">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 md:p-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-button flex-shrink-0"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="w-6 h-6 md:w-7 md:h-7" /> : <Menu className="w-6 h-6 md:w-7 md:h-7" />}
              </button>
              
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <img 
                  src={companyLogo || logo} 
                  alt="Company Logo" 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = logo;
                  }}
                />
                <div className="min-w-0 flex-1">
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-gray-400 flex-shrink-0" />
                      <span className="text-xs md:text-sm text-gray-500 truncate">Loading...</span>
                    </div>
                  ) : error ? (
                    <div>
                      <h1 className="text-base md:text-xl font-bold text-red-600 truncate">Error</h1>
                      <p className="text-xs md:text-sm text-red-500 truncate">Failed to load</p>
                    </div>
                  ) : branchTerminalData ? (
                    <div>
                      <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">
                        {branchTerminalService.getTerminalCode(branchTerminalData.terminal)}
                      </h1>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {branchTerminalData.branch.name}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">POS Terminal</h1>
                      <p className="text-xs md:text-sm text-gray-500 truncate">Point of Sale</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products, customers..."
                  className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-lg search-input-mobile"
                />
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              <button 
                onClick={() => onScreenChange('online-orders')}
                className="relative p-2 md:p-3 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg touch-button"
                aria-label="Online orders"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                {onlineOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-semibold">
                    {onlineOrdersCount > 99 ? '99+' : onlineOrdersCount}
                  </span>
                )}
              </button>
              
              <div className="hidden sm:flex items-center space-x-2 md:space-x-3">
                <div className="text-right hidden lg:block">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {user ? `${user.first_name} ${user.last_name}` : 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {user ? `${user.role_display_name || user.role_name}` : 'Role'}
                  </p>
                  {branchTerminalData?.sessionNumber && (
                    <p className="text-xs text-blue-600 font-medium truncate">
                      S: {branchTerminalData.sessionNumber}
                    </p>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 md:p-3 text-gray-600 hover:text-red-600 active:bg-red-50 rounded-lg transition-colors touch-button"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5 md:w-6 md:h-6" />
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
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 md:w-64 lg:w-64 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out sidebar-tablet`}>
          <div className="flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-button"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <nav className="flex-1 p-3 md:p-4 space-y-2 overflow-y-auto">
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
                    className={`w-full flex items-center space-x-3 md:space-x-4 px-3 md:px-4 py-3 md:py-4 rounded-xl text-left transition-all duration-200 relative touch-button ${
                      isActive
                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                    }`}
                  >
                    <div className={`p-2 md:p-2.5 rounded-lg ${item.color} flex-shrink-0 ${
                      isActive ? 'bg-green-500' : ''
                    }`}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-base md:text-lg font-medium flex-1">{item.label}</span>
                    
                    {/* Notification Badge */}
                    {showBadge && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 md:h-5 md:w-5 flex items-center justify-center font-semibold flex-shrink-0">
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
        <main className="flex-1 lg:ml-0 w-full min-w-0">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default POSLayout;
