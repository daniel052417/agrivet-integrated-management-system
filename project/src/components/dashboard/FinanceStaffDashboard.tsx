import React, { useState, useMemo } from 'react';
import SimplifiedSidebar from '../shared/layout/SimplifiedSidebar';
import NonAdminSidebar from '../shared/layout/NonAdminSidebar';
import Header from '../shared/layout/Header';
import { CustomUser } from '../../lib/customAuth';

// Finance-specific components
import FinanceDashboard from '../finance/Financedashboard';
import SalesIncomeSummary from '../finance/Salesincomesummary';
import Expenses from '../finance/Expenses';
import CashFlowOverview from '../finance/Cashflowoverview';
import ReportsExports from '../finance/Reportsexports';

interface FinanceStaffDashboardProps {
  user: CustomUser;
  onLogout: () => void;
}

const FinanceStaffDashboard: React.FC<FinanceStaffDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('finance-dashboard');
  
  // Check if user is super admin
  const isSuperAdmin = useMemo(() => {
    return user.role_name === 'super-admin' || user.role === 'super-admin';
  }, [user]);

  const renderContent = () => {
    switch (activeSection) {
      case 'finance-dashboard':
        return <FinanceDashboard />;
      case 'sales-income':
        return <SalesIncomeSummary />;
      case 'expenses':
        return <Expenses />;
      case 'cash-flow':
        return <CashFlowOverview />;
      case 'financial-reports':
        return <ReportsExports />;
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
      {isSuperAdmin ? (
        <SimplifiedSidebar 
          user={user} 
          onLogout={onLogout}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      ) : (
        <NonAdminSidebar 
          user={user} 
          onLogout={onLogout}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => {}} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default FinanceStaffDashboard;

