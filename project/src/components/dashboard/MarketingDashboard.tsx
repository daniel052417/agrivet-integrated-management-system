import React, { useState } from 'react';
import SimplifiedSidebar from '../shared/layout/SimplifiedSidebar';
import Header from '../shared/layout/Header';
import { SimplifiedUser } from '../../lib/simplifiedAuth';

// Marketing-specific components
import MarketingDashboard from '../marketing/MarketingDashboard';
import CampaignManagement from '../marketing/CampaignManagement';
import TemplateManagement from '../marketing/TemplateManagement';
import CampaignAnalytics from '../marketing/CampaignAnalytics';
import ClientNotifications from '../marketing/ClientNotifications';

interface MarketingDashboardProps {
  user: SimplifiedUser;
  onLogout: () => void;
}

const MarketingDashboardComponent: React.FC<MarketingDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('marketing-dashboard');

  const renderContent = () => {
    switch (activeSection) {
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

export default MarketingDashboardComponent;
