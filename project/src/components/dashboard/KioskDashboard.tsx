import React, { useState } from 'react';
import SimplifiedSidebar from '../shared/layout/SimplifiedSidebar';
import Header from '../shared/layout/Header';
import { SimplifiedUser } from '../../lib/simplifiedAuth';

// Kiosk-specific components (simplified interface for public use)
import POSInterface from '../pos/POSInterface';
import InventorySummaryPage from '../inventory/InventorySummaryPage';

interface KioskDashboardProps {
  user: SimplifiedUser;
  onLogout: () => void;
}

const KioskDashboard: React.FC<KioskDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('pos-interface');

  const renderContent = () => {
    switch (activeSection) {
      case 'pos-interface':
        return <POSInterface user={user} onLogout={onLogout} />;
      case 'inventory-summary':
        return <InventorySummaryPage />;
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

export default KioskDashboard;
