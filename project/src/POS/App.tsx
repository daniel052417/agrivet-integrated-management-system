import React, { useState, useEffect } from 'react';
import POSLayout from './layouts/POSLayout';
import CashierScreen from './screens/CashierScreen';
import InventoryScreen from './screens/InventoryScreen';
import CustomerScreen from './screens/CustomerScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import ReportsScreen from './screens/ReportsScreen';
import OnlineOrdersScreen from './screens/OnlineOrdersScreen';
import { customAuth, CustomUser } from '../lib/customAuth';
import { OnlineOrdersService } from './services/onlineOrdersService';

interface POSAppProps {
  user: CustomUser;
  onLogout?: () => void;
}

const POSApp: React.FC<POSAppProps> = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('cashier');
  const [onlineOrdersCount, setOnlineOrdersCount] = useState(0);

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen);
  };

  // Load online orders count
  useEffect(() => {
    const loadOrdersCount = async () => {
      try {
        const count = await OnlineOrdersService.getNewOrdersCount();
        setOnlineOrdersCount(count);
      } catch (error) {
        console.error('Error loading orders count:', error);
      }
    };

    loadOrdersCount();
    
    // Set up periodic refresh for orders count
    const interval = setInterval(loadOrdersCount, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleOrdersCountUpdate = (count: number) => {
    setOnlineOrdersCount(count);
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      } else {
        await customAuth.signOut();
        // Redirect to login or home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'cashier':
        return <CashierScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'customers':
        return <CustomerScreen />;
      case 'online-orders':
        return <OnlineOrdersScreen {...{ onOrdersCountUpdate: handleOrdersCountUpdate }} />;
      case 'users':
        return <UserManagementScreen />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <CashierScreen />;
    }
  };

  // Get current user from auth service if not provided
  const currentUser = user || customAuth.getCurrentUser();

  // If no user is available, show a loading or error state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <POSLayout
      currentScreen={currentScreen}
      onScreenChange={handleScreenChange}
      onLogout={handleLogout}
      user={currentUser}
      onlineOrdersCount={onlineOrdersCount}
    >
      {renderCurrentScreen()}
    </POSLayout>
  );
};

export default POSApp;
