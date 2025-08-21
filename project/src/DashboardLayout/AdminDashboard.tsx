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
      case 'staff':
      case 'staff-management':
      case 'add-staff':
        return <StaffManagement />;
      case 'attendance':
        return <AttendanceTimesheet />;
      case 'roles':
        return <RolesPermissions />;
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