import React, { useState } from 'react';
import SimplifiedSidebar from '../shared/layout/SimplifiedSidebar';
import Header from '../shared/layout/Header';
import { SimplifiedUser } from '../../lib/simplifiedAuth';

// Import all admin components for super admin access
import Overview from '../dashboard/Overview';
import SalesValue from '../sales/SalesValue';
import AllSalesRecords from '../sales/AllSalesRecords';
import SalesDashboard from '../sales/SalesDashboard';
import DailySalesSummary from '../sales/DailySalesSummary';
import ProductSalesReport from '../sales/ProductSalesReport';
import InventorySummaryPage from '../inventory/InventorySummaryPage';
import InventoryManagement from '../inventory/InventoryManagement';
import AttendanceTimesheet from '../staff/AttendanceTimesheet';
import RolesPermissions from '../staff/RolesPermissions';
import LeaveRequest from '../staff/LeaveRequest';
import MarketingDashboard from '../marketing/MarketingDashboard';
import CampaignManagement from '../marketing/CampaignManagement';
import TemplateManagement from '../marketing/TemplateManagement';
import CampaignAnalytics from '../marketing/CampaignAnalytics';
import ClientNotifications from '../marketing/ClientNotifications';
import EventCenter from '../reports/EventCenter';
import ReportsAnalytics from '../reports/ReportsAnalytics';
import SettingsPage from '../settings/SettingsPage';
import LowStockAlerts from '../inventory/LowStockAlerts';
import Categories from '../inventory/Categories';
import ActiveUsers from '../users/ActiveUsers';
import UserAccounts from '../users/UserAccounts';
import UserActivity from '../users/UserActivity';
import SessionHistory from '../users/SessionHistory';
import UserRolesOverview from '../users/UserRolesOverview';
import AddStaff from '../hr/AddStaff';
import UserPermissions from '../users/UserPermissions';
import HRDashboard from '../hr/HRDashboard';
import AttendanceDashboard from '../hr/AttendanceDashboard';
import LeaveManagement from '../hr/LeaveManagement';
import HRAnalytics from '../hr/HRAnalytics';
import PayrollCompensation from '../hr/PayrollCompensation';

interface SuperAdminDashboardProps {
  user: SimplifiedUser;
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('overview');

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
        return <UserAccounts />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'add-staff':
        return <AddStaff onBack={() => setActiveSection('user-accounts')} />;
      case 'roles-permissions':
        return <RolesPermissions />;
      case 'activity-logs':
        return <UserActivity />;
      case 'session-history':
        return <SessionHistory />;
      case 'user-roles-overview':
        return <UserRolesOverview />;
      
      // Legacy staff management routes (for backward compatibility)
      case 'staff':
      case 'staff-management':
        return <UserAccounts />;
      case 'attendance':
        return <AttendanceTimesheet />;
      case 'leave':
        return <LeaveRequest />;
      case 'marketing':
      case 'marketing-dashboard':
        return <MarketingDashboard />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'templates':
        return <TemplateManagement />;
      case 'analytics':
        return <CampaignAnalytics />;
      case 'notifications':
        return <ClientNotifications />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'event-center':
        return <EventCenter />;
      case 'settings':
        return <SettingsPage />;
      
      // HR Section (Simplified)
      case 'hr':
        return <HRDashboard />;
      case 'hr-dashboard':
        return <HRDashboard />;
      case 'attendance-dashboard':
        return <AttendanceDashboard />;
      case 'leave-management':
        return <LeaveManagement />;
      case 'hr-analytics':
        return <HRAnalytics />;
      case 'attendance-leave':
        return <AttendanceDashboard />;
      case 'payroll':
        return <PayrollCompensation />;
      
      // Legacy HR routes (for backward compatibility)
      case 'employees':
        return <UserAccounts />;
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
      case 'user-permissions':
        return <UserPermissions />;
      
      // New menu items from the updated sidebar
      case 'sales-pos':
        return <SalesDashboard />; // Use SalesDashboard for Sales & POS
      case 'exports':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Exports & Reports</h2>
              <p className="text-gray-600">Export data and generate reports</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <span className="text-sm">📊 Export Tools</span>
              </div>
            </div>
          </div>
        );
      case 'claims':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Claims Management</h2>
              <p className="text-gray-600">Manage insurance claims and reimbursements</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <span className="text-sm">📋 Claims System</span>
              </div>
            </div>
          </div>
        );
      
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
      <SimplifiedSidebar 
        user={user} 
        onLogout={onLogout}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => {}} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
