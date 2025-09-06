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
import CampaignManagement from './CampaignManagement';
import TemplateManagement from './TemplateManagement';
import CampaignAnalytics from './CampaignAnalytics';

const MarketingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const marketingMetrics = [
    {
      title: 'Total Campaigns',
      value: '24',
      change: '+3 this week',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Campaign
    },
    {
      title: 'Active Promotions',
      value: '12',
      change: '+2 this month',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: Tag
    },
    {
      title: 'Loyalty Members',
      value: '3,690',
      change: '+18.5% growth',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: Users
    },
    {
      title: 'Total Reach',
      value: '23.1K',
      change: '+15.2% vs last month',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: TrendingUp
    }
  ];

  const recentCampaigns = [
    {
      id: 1,
      name: 'Summer Veterinary Sale',
      type: 'Hero Banner',
      status: 'Published',
      views: 2847,
      clicks: 456,
      ctr: 16.0,
      created: '2024-01-15'
    },
    {
      id: 2,
      name: 'New Customer Welcome',
      type: 'Promo Card',
      status: 'Active',
      views: 1923,
      clicks: 234,
      ctr: 12.2,
      created: '2024-01-12'
    },
    {
      id: 3,
      name: 'Holiday Special Offer',
      type: 'Popup',
      status: 'Scheduled',
      views: 0,
      clicks: 0,
      ctr: 0,
      created: '2024-01-18'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'campaigns', label: 'Campaigns', icon: Campaign },
    { id: 'templates', label: 'Templates', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-800';
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {marketingMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{metric.title}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent Campaigns</h3>
          <button 
            onClick={() => setActiveTab('campaigns')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentCampaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Campaign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                  <p className="text-xs text-gray-500">{campaign.type} • Created {campaign.created}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{campaign.views.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{campaign.clicks}</div>
                  <div className="text-xs text-gray-500">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{campaign.ctr}%</div>
                  <div className="text-xs text-gray-500">CTR</div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveTab('campaigns')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Campaign className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Create Campaign</span>
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Template Management</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Campaign Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Client Notifications</span>
          </button>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Marketing Performance</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Performance charts will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'campaigns':
        return <CampaignManagement />;
      case 'templates':
        return <TemplateManagement />;
      case 'analytics':
        return <CampaignAnalytics />;
      case 'notifications':
        return <ClientNotifications />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Marketing Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage campaigns, promotions, and customer engagement</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderActiveTab()}
    </div>
  );
};

export default MarketingDashboard;
