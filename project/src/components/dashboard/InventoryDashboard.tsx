import React, { useState } from 'react';
import SimplifiedSidebar from '../shared/layout/SimplifiedSidebar';
import Header from '../shared/layout/Header';
import { CustomUser } from '../../lib/customAuth';

// Inventory-specific components
import InventoryManagement from '../inventory/InventoryManagement';
import Categories from '../inventory/Categories';
import LowStockAlerts from '../inventory/LowStockAlerts';

interface InventoryDashboardProps {
  user: CustomUser;
  onLogout: () => void;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('inventory-management');

  const renderContent = () => {
    switch (activeSection) {
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

export default InventoryDashboard;
