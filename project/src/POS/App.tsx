import React, { useState, useEffect } from 'react';
import POSLayout from './layouts/POSLayout';
import CashierScreen from './screens/CashierScreen';
import InventoryScreen from './screens/InventoryScreen';
import CustomerScreen from './screens/CustomerScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import ReportsScreen from './screens/ReportsScreen';
import OnlineOrdersScreen from './screens/OnlineOrdersScreen';
import ClosingCashModal from './components/ClosingCashModal';
import { customAuth, CustomUser } from '../lib/customAuth';
import { OnlineOrdersService } from './services/onlineOrdersService';
import { posSessionService } from '../lib/posSessionService';
import { supabase } from '../lib/supabase';

interface POSAppProps {
  user: CustomUser;
  onLogout?: () => void;
}

interface SessionSummary {
  sessionNumber: string;
  cashierName: string;
  startTime: string;
  startingCash: number;
  totalSales: number;
  totalTransactions: number;
  duration: string;
  expectedCash: number;
  totalExpenses: number;
}

const POSApp: React.FC<POSAppProps> = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('cashier');
  const [onlineOrdersCount, setOnlineOrdersCount] = useState(0);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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

  // Get current POS session on mount
  useEffect(() => {
    const loadCurrentSession = async () => {
      try {
        const session = await posSessionService.getCurrentSession(user.id);
        if (session) {
          setCurrentSessionId(session.id);
        }
      } catch (error) {
        console.error('Error loading current session:', error);
      }
    };

    loadCurrentSession();
  }, [user.id]);

  const handleOrdersCountUpdate = (count: number) => {
    setOnlineOrdersCount(count);
  };

  /**
   * Calculate session duration in hours and minutes
   */
  const calculateDuration = (startTime: string): string => {
    const start = new Date(startTime);
    const end = new Date();
    const diffMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  /**
   * Calculate total approved expenses for the session
   * Only includes expenses with status = 'approved'
   */
  const calculateApprovedExpenses = async (branchId: string, sessionStartTime: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('branch_id', branchId)
        .eq('status', 'approved')
        .gte('date', new Date(sessionStartTime).toISOString().split('T')[0])
        .lte('date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error calculating approved expenses:', error);
        return 0;
      }

      const totalExpenses = data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      return totalExpenses;
    } catch (error) {
      console.error('Error calculating approved expenses:', error);
      return 0;
    }
  };

  /**
   * Handle logout button click - show closing cash modal
   */
  const handleLogoutClick = async () => {
    try {
      // Get current session
      const session = await posSessionService.getCurrentSession(user.id);
      
      if (!session) {
        // No active session, logout directly
        await performLogout();
        return;
      }

      // Check if session is already closed
      if (session.status === 'closed') {
        await performLogout();
        return;
      }

      // Get branch ID from user or session
      const branchId = user.branch_id || session.branch_id;
      
      // Calculate session summary
      const duration = calculateDuration(session.opened_at);
      
      // Calculate approved expenses (only approved expenses are included in closing)
      const totalExpenses = branchId ? await calculateApprovedExpenses(branchId, session.opened_at) : 0;
      
      // Expected cash = starting cash + total sales - approved expenses
      const expectedCash = (session.starting_cash || 0) + (session.total_sales || 0) - totalExpenses;

      const summary: SessionSummary = {
        sessionNumber: session.session_number,
        cashierName: `${user.first_name} ${user.last_name}`,
        startTime: session.opened_at,
        startingCash: session.starting_cash || 0,
        totalSales: session.total_sales || 0,
        totalTransactions: session.total_transactions || 0,
        duration: duration,
        expectedCash: expectedCash,
        totalExpenses: totalExpenses
      };

      setSessionSummary(summary);
      setCurrentSessionId(session.id);
      setShowClosingModal(true);
    } catch (error) {
      console.error('Error preparing logout:', error);
      // If there's an error, still allow logout
      const confirmLogout = window.confirm(
        'Unable to load session data. Do you want to logout anyway?'
      );
      if (confirmLogout) {
        await performLogout();
      }
    }
  };

  /**
   * Handle closing cash submission
   */
  const handleClosingCashSubmit = async (endingCash: number) => {
    try {
      if (!currentSessionId) {
        throw new Error('No active session found');
      }

      console.log('💰 Closing session with ending cash:', endingCash);

      // Close the POS session
      await posSessionService.closeSession(
        currentSessionId,
        user.id,
        endingCash,
        `Session closed by ${user.first_name} ${user.last_name}`
      );

      console.log('✅ Session closed successfully');

      // Wait a moment for the success screen to show
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Perform logout
      await performLogout();
    } catch (error) {
      console.error('❌ Error closing session:', error);
      throw error;
    }
  };

  /**
   * Perform actual logout
   */
  const performLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      } else {
        await customAuth.signOut();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  /**
   * Handle cancel on closing modal (if closable)
   */
  const handleClosingModalCancel = () => {
    setShowClosingModal(false);
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
    <>
      <POSLayout
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
        onLogout={handleLogoutClick}
        user={currentUser}
        onlineOrdersCount={onlineOrdersCount}
      >
        {renderCurrentScreen()}
      </POSLayout>

      {/* Closing Cash Modal */}
      {showClosingModal && sessionSummary && (
        <ClosingCashModal
          isOpen={showClosingModal}
          sessionSummary={sessionSummary}
          onSubmit={handleClosingCashSubmit}
          onCancel={handleClosingModalCancel}
          isClosable={true} // Cannot dismiss - must enter ending cash
        />
      )}
    </>
  );
};

export default POSApp;