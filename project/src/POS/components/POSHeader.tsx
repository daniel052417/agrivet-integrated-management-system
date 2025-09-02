import React, { useState } from 'react';
import { User, LogOut, Clock, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react';
import { POSSession } from '../../types/pos';

interface POSHeaderProps {
  user: any;
  session: POSSession;
  onLogout: () => void;
  onShowDashboard?: () => void;
}

const POSHeader: React.FC<POSHeaderProps> = ({ user, session, onLogout, onShowDashboard }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionDuration = () => {
    const start = new Date(session.opened_at);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo and Session Info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">POS System</h1>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Session: {session.session_number}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Started: {formatTime(session.opened_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Duration: {getSessionDuration()}</span>
              </div>
            </div>
          </div>

          {/* Center Section - Session Stats */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(session.total_sales)}
              </div>
              <div className="text-xs text-gray-500">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {session.total_transactions}
              </div>
              <div className="text-xs text-gray-500">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {session.total_transactions > 0 
                  ? formatPrice(session.total_sales / session.total_transactions)
                  : formatPrice(0)
                }
              </div>
              <div className="text-xs text-gray-500">Avg. Transaction</div>
            </div>
          </div>

          {/* Right Section - User Menu */}
          <div className="flex items-center space-x-4">
            {onShowDashboard && (
              <button
                onClick={onShowDashboard}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user.role} • {user.department || 'Staff'}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Session Stats */}
      <div className="lg:hidden bg-gray-50 border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{getSessionDuration()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{formatPrice(session.total_sales)}</span>
            </div>
          </div>
          <div className="text-gray-600">
            {session.total_transactions} transactions
          </div>
        </div>
      </div>
    </header>
  );
};

export default POSHeader;
