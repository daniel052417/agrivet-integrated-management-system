import React, { useState } from 'react';
import SimplifiedSidebar from '../shared/layout/SimplifiedSidebar';
import Header from '../shared/layout/Header';
import { CustomUser } from '../../lib/customAuth';

// POS-specific components
import POSInterface from '../pos/POSInterface';
import SalesDashboard from '../sales/SalesDashboard';
import AllSalesRecords from '../sales/AllSalesRecords';
import DailySalesSummary from '../sales/DailySalesSummary';
import ProductSalesReport from '../sales/ProductSalesReport';

interface POSDashboardProps {
  user: CustomUser;
  onLogout: () => void;
}

const POSDashboard: React.FC<POSDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('pos-interface');

  const renderContent = () => {
    switch (activeSection) {
      case 'pos-interface':
        return <POSInterface user={user} onLogout={onLogout} />;
      case 'sales-dashboard':
        return <SalesDashboard />;
      case 'sales-records':
        return <AllSalesRecords />;
      case 'daily-sales':
        return <DailySalesSummary />;
      case 'product-sales':
        return <ProductSalesReport />;
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

export default POSDashboard;
