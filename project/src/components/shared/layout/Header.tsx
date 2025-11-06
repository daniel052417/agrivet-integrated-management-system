import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Settings, Menu } from 'lucide-react';
import NotificationDropdown from '../NotificationDropdown';
import UserNotificationsService from '../../../lib/userNotificationsService';

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  showLiveIndicator?: boolean;
  user?: any;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  title = "Dashboard",
  showLiveIndicator = true,
  user,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id || user?.user_id;

  useEffect(() => {
    if (userId) {
      // Fetch unread count on mount
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchUnreadCount = async () => {
    if (!userId) return;
    
    try {
      const count = await UserNotificationsService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Refresh unread count when opening
    if (!showNotifications && userId) {
      fetchUnreadCount();
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          {/* <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          {showLiveIndicator && (
            <div className="hidden sm:block">
              <span className="px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full">
                Live
              </span>
            </div>
          )} */}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {userId ? (
            <div className="relative">
              <button 
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1 text-xs font-medium text-white bg-red-500 rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <NotificationDropdown 
                  userId={userId} 
                  onClose={() => {
                    setShowNotifications(false);
                    fetchUnreadCount(); // Refresh count when closing
                  }} 
                />
              )}
            </div>
          ) : (
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Daniel John Pepito'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'Super Admin'}
              </p>
            </div>
            
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                {onLogout && (
                  <button 
                    onClick={onLogout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <User className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


































