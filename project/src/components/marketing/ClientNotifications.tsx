import React, { useState } from 'react';
import { 
  Plus, 
  Mail,
  Gift,
  Star
} from 'lucide-react';

const ClientNotifications: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('rewards-notifications');

  const renderRewardsNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Rewards & Notifications</h3>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Send Notification</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Rewards and notifications management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const renderLoyaltyProgram = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Loyalty Program</h3>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Manage Rewards</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Loyalty program management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const renderEmailCampaigns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Email Campaigns</h3>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Create Campaign</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Email campaign management functionality will be implemented here.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Notifications</h2>
          <p className="text-gray-600">Manage rewards, notifications, and loyalty programs for customer engagement</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            <span>Send Notification</span>
          </button>
          <button className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            <Plus className="w-4 h-4" />
            <span>Manage Rewards</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button 
              onClick={() => setActiveSubTab('rewards-notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'rewards-notifications'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4" />
                <span>Rewards & Notifications</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveSubTab('loyalty-program')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'loyalty-program'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Loyalty Program</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveSubTab('email-campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'email-campaigns'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Campaigns</span>
              </div>
            </button>
          </nav>
        </div>
        <div className="p-6">
          {activeSubTab === 'rewards-notifications' && renderRewardsNotifications()}
          {activeSubTab === 'loyalty-program' && renderLoyaltyProgram()}
          {activeSubTab === 'email-campaigns' && renderEmailCampaigns()}
        </div>
      </div>
    </div>
  );
};

export default ClientNotifications;