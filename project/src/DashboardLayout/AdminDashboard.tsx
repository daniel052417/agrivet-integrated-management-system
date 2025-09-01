import React, { useState } from 'react';
import Sidebar from '../Admin/components/Layout/Sidebar';
import Header from '../Admin/components/Layout/Header';
import Overview from '../Admin/components/Dashboard/Overview';
import SalesValue from '../Admin/components/Sales/SalesValue';
import AllSalesRecords from '../Admin/components/Sales/AllSalesRecords';
import SalesDashboard from '../Admin/components/Sales/SalesDashboard';
import DailySalesSummary from '../Admin/components/Sales/DailySalesSummary';
import ProductSalesReport from '../Admin/components/Sales/ProductSalesReport';
import InventorySummaryPage from '../Admin/components/Inventory/InventorySummaryPage';
import InventoryManagement from '../Admin/components/Inventory/InventoryManagement';
import StaffManagement from '../Admin/components/Staff/StaffManagement';
import Reports from '../Admin/components/Reports/Reports';
import AttendanceTimesheet from '../Admin/components/Staff/AttendanceTimesheet';
import RolesPermissions from '../Admin/components/Staff/RolesPermissions';
import LeaveRequest from '../Admin/components/Staff/LeaveRequest';
import PromotionsDiscounts from '../Admin/components/Marketing/PromotionsDiscounts';
import Announcements from '../Admin/components/Marketing/Announcements';
import ReferralsVenueAds from '../Admin/components/Marketing/ReferralsVenueAds';
import ClientNotifications from '../Admin/components/Marketing/ClientNotifications';
import LoyaltyRewards from '../Admin/components/Marketing/LoyaltyRewards';
import InventoryReports from '../Admin/components/Reports/InventoryReports';
import TransactionReports from '../Admin/components/Reports/TransactionReports';
import StaffActivityReports from '../Admin/components/Reports/StaffActivityReports';
import ClientReports from '../Admin/components/Reports/ClientReports';
import EventCenter from '../Admin/components/Reports/EventCenter';
import ReportsAnalytics from '../Admin/components/Reports/ReportsAnalytics';
import SettingsPage from '../Admin/components/Settings/SettingsPage';
import LowStockAlerts from '../Admin/components/Inventory/LowStockAlerts';
import Categories from '../Admin/components/Inventory/Categories';
import ActiveUsers from '../Admin/components/Users/ActiveUsers';
import UserAccounts from '../Admin/components/Users/UserAccounts';
import UserActivity from '../Admin/components/Users/UserActivity';
import UserPermissions from '../Admin/components/Users/UserPermissions';
import HRDashboard from '../Admin/components/HR/HRDashboard';
import EnhancedEmployeeProfiles from '../Admin/components/HR/EnhancedEmployeeProfiles';
import PayrollCompensation from '../Admin/components/HR/PayrollCompensation';
import PerformanceManagement from '../Admin/components/HR/PerformanceManagement';
import { UserProfile } from '../lib/supabase';
interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}


function AdminDashboard({user, onLogout}: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

   const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'sales-value':
        return <SalesValue />;
      case 'sales-records':
        return <AllSalesRecords />;
      case 'sales-dashboard':
        return <SalesDashboard />;
      case 'daily-sales':
        return <DailySalesSummary />;
      case 'product-sales':
        return <ProductSalesReport />;
      case 'inventory-summary':
        return <InventorySummaryPage />;
      case 'inventory-management':
      case 'all-products':
        return <InventoryManagement />;
      case 'categories':
        return <Categories />;
      case 'feeds':
      case 'medicine':
      case 'agriculture':
      case 'tools':
        return <InventoryManagement />;
      case 'low-stock':
        return <LowStockAlerts />;
      
      // Staff & User Management Section
      case 'staff-user-management':
        return <StaffManagement />;
      case 'staff-accounts':
        return <StaffManagement />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'client-accounts':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Client Accounts</h2>
              <p className="text-gray-600">Manage client accounts and information</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <span className="text-sm">📋 Client Management</span>
              </div>
            </div>
          </div>
        );
      case 'roles-permissions':
        return <RolesPermissions />;
      case 'activity-logs':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Activity Logs</h2>
              <p className="text-gray-600">Track sign-ins, actions, and session activity</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <span className="text-sm">📊 Activity Monitoring</span>
              </div>
            </div>
          </div>
        );
      
      // Legacy staff management routes (for backward compatibility)
      case 'staff':
      case 'staff-management':
      case 'add-staff':
        return <StaffManagement />;
      case 'attendance':
        return <AttendanceTimesheet />;
      case 'leave':
        return <LeaveRequest />;
      case 'promotions':
        return <PromotionsDiscounts />;
      case 'announcements':
        return <Announcements />;
      case 'referrals':
        return <ReferralsVenueAds />;
      case 'notifications':
        return <ClientNotifications />;
      case 'loyalty':
        return <LoyaltyRewards />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'event-center':
        return <EventCenter />;
      case 'settings':
        return <SettingsPage />;
      
      // HR Section (Simplified)
      case 'hr':
        return <HRDashboard />;
      case 'employee-directory':
        return <EnhancedEmployeeProfiles />;
      case 'attendance-leave':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🕒 Attendance & Leave Management</h2>
              <p className="text-gray-600">Track attendance and manage leave requests</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <span className="text-sm">⏰ Time Tracking</span>
              </div>
            </div>
          </div>
        );
      case 'payroll':
        return <PayrollCompensation />;
      case 'performance-evaluation':
        return <PerformanceManagement />;
      
      // Legacy HR routes (for backward compatibility)
      case 'hr-dashboard':
        return <HRDashboard />;
      case 'employees':
        return <StaffManagement />;
      case 'performance':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Performance Management</h2>
              <p className="text-gray-600">Coming soon - Performance tracking and reviews</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
      case 'training':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Training & Development</h2>
              <p className="text-gray-600">Coming soon - Learning management system</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
      case 'active-users':
        return <ActiveUsers />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'user-activity':
        return <UserActivity />;
      case 'user-permissions':
        return <UserPermissions />;
      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {activeSection.replace('-', ' ').toUpperCase()}
              </h2>
              <p className="text-gray-600">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;