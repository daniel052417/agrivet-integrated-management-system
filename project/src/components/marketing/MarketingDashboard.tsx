import React, { useState } from 'react';
import { 
  Megaphone, 
  Tag, 
  Gift, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Target,
  Calendar,
  Eye,
  MousePointer as Click,
  DollarSign,
  Settings,
  Megaphone as Campaign,
  Bell
} from 'lucide-react';
import ClientNotifications from './ClientNotifications';
import CampaignForm from './CampaignForm';
import CampaignPreview from './CampaignPreview';
import TemplateManagement from './TemplateManagement';

const MarketingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const marketingMetrics = [
    {
      title: 'Total Campaigns',
      value: '24',
      change: '+3 this week',
      isPositive: true,
      color: 'blue',
      icon: <Campaign className="w-6 h-6" />
    },
    {
      title: 'Active Campaigns',
      value: '8',
      change: '+2 this week',
      isPositive: true,
      color: 'green',
      icon: <Megaphone className="w-6 h-6" />
    },
    {
      title: 'Total Views',
      value: '45.2K',
      change: '+12.5%',
      isPositive: true,
      color: 'purple',
      icon: <Eye className="w-6 h-6" />
    },
    {
      title: 'Click Rate',
      value: '3.2%',
      change: '+0.5%',
      isPositive: true,
      color: 'orange',
      icon: <Click className="w-6 h-6" />
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketingMetrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                metric.color === 'blue' ? 'bg-blue-100' :
                metric.color === 'green' ? 'bg-green-100' :
                metric.color === 'purple' ? 'bg-purple-100' :
                'bg-orange-100'
              }`}>
                <div className={`${
                  metric.color === 'blue' ? 'text-blue-600' :
                  metric.color === 'green' ? 'text-green-600' :
                  metric.color === 'purple' ? 'text-purple-600' :
                  'text-orange-600'
                }`}>
                  {metric.icon}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className={`text-sm font-semibold ${
                  metric.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Campaign className="w-5 h-5 text-blue-600" />
                <span className="text-blue-900 font-medium">Campaigns</span>
              </button>

            <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span className="text-green-900 font-medium">Analytics</span>
              </button>

            <button className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <Tag className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-900 font-medium">Templates</span>
              </button>

            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <Bell className="w-5 h-5 text-purple-600" />
                <span className="text-purple-900 font-medium">Notifications</span>
              </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Summer Sale 2024</p>
                <p className="text-sm text-gray-600">Active • 1,234 views</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Live</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">New Product Launch</p>
                <p className="text-sm text-gray-600">Scheduled • 567 views</p>
              </div>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Holiday Promotion</p>
                <p className="text-sm text-gray-600">Completed • 2,890 views</p>
              </div>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Ended</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <CampaignForm />
  );

  const renderAnalytics = () => (
    <CampaignPreview />
  );

  const renderTemplates = () => (
    <TemplateManagement />
  );

  const renderNotifications = () => (
    <ClientNotifications />
  );

  return (
    <div className="marketing-dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Dashboard</h1>
        <p className="text-gray-600">Campaign management and marketing analytics</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Campaigns
            </button>
          <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
          <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Templates
            </button>
          <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
            </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'notifications' && renderNotifications()}
      </div>
    </div>
  );
};

export default MarketingDashboard;
