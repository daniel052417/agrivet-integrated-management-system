import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Megaphone, Calendar, Users, Send, Clock, Target, Filter, Download, Bell, MessageSquare, BarChart3 } from 'lucide-react';

const Announcements: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('published');
  const [selectedChannel, setSelectedChannel] = useState('all');

  const announcements = [
    {
      id: 1,
      title: 'New Veterinary Services Available',
      content: 'We are excited to announce our expanded veterinary services including emergency care and specialized treatments.',
      channel: 'Email & SMS',
      audience: 'All Customers',
      publishDate: '2024-01-15',
      status: 'Published',
      views: 2847,
      clicks: 456,
      engagement: 16.0,
      priority: 'High',
      author: 'Maria Santos'
    },
    {
      id: 2,
      title: 'Store Hours Update - Holiday Season',
      content: 'Please note our updated store hours during the holiday season. We will be open extended hours to serve you better.',
      channel: 'Website & Social Media',
      audience: 'Local Customers',
      publishDate: '2024-01-12',
      status: 'Published',
      views: 1923,
      clicks: 234,
      engagement: 12.2,
      priority: 'Medium',
      author: 'Juan Dela Cruz'
    },
    {
      id: 3,
      title: 'Fresh Organic Produce Arrival',
      content: 'New shipment of fresh organic fruits and vegetables has arrived. Visit our store for the best quality produce.',
      channel: 'SMS',
      audience: 'Fruit Customers',
      publishDate: '2024-01-18',
      status: 'Scheduled',
      views: 0,
      clicks: 0,
      engagement: 0,
      priority: 'Medium',
      author: 'Ana Rodriguez'
    },
    {
      id: 4,
      title: 'Agricultural Equipment Maintenance Tips',
      content: 'Learn how to properly maintain your agricultural equipment with our comprehensive guide and expert tips.',
      channel: 'Email',
      audience: 'Farmers',
      publishDate: '2024-01-10',
      status: 'Draft',
      views: 0,
      clicks: 0,
      engagement: 0,
      priority: 'Low',
      author: 'Carlos Martinez'
    },
    {
      id: 5,
      title: 'Emergency Veterinary Hotline',
      content: 'We now offer 24/7 emergency veterinary consultation. Call our hotline for immediate assistance with your animals.',
      channel: 'All Channels',
      audience: 'Pet Owners',
      publishDate: '2024-01-20',
      status: 'Published',
      views: 3456,
      clicks: 678,
      engagement: 19.6,
      priority: 'High',
      author: 'Dr. Lisa Chen'
    }
  ];

  const channels = [
    { name: 'Email', count: 15, reach: 4500, color: 'bg-blue-500' },
    { name: 'SMS', count: 12, reach: 3200, color: 'bg-green-500' },
    { name: 'Website', count: 8, reach: 8900, color: 'bg-purple-500' },
    { name: 'Social Media', count: 10, reach: 6700, color: 'bg-orange-500' }
  ];

  const performanceMetrics = [
    {
      title: 'Total Announcements',
      value: '45',
      change: '+8 this month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Megaphone
    },
    {
      title: 'Total Reach',
      value: '23.1K',
      change: '+15.2% vs last month',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: Users
    },
    {
      title: 'Average Engagement',
      value: '14.8%',
      change: '+2.3% improvement',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: Target
    },
    {
      title: 'Scheduled Posts',
      value: '12',
      change: 'Next 7 days',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: Clock
    }
  ];

  const audienceSegments = [
    { segment: 'All Customers', count: 4892, percentage: 45.2 },
    { segment: 'Pet Owners', count: 2156, percentage: 19.9 },
    { segment: 'Farmers', count: 1834, percentage: 16.9 },
    { segment: 'Local Customers', count: 1245, percentage: 11.5 },
    { segment: 'Fruit Customers', count: 689, percentage: 6.4 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Archived': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (selectedTab === 'all') return true;
    return announcement.status.toLowerCase() === selectedTab;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
          <p className="text-gray-600 mt-1">Create and manage customer announcements and communications</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => {
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

      {/* Channels and Audience Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channels Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Communication Channels</h3>
            <Send className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {channels.map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{channel.name}</p>
                    <p className="text-xs text-gray-500">{channel.count} announcements</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{channel.reach.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">total reach</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Segments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Audience Segments</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {audienceSegments.map((audience, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{audience.segment}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{audience.count.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-2">({audience.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${audience.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['all', 'published', 'scheduled', 'draft'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="website">Website</option>
              <option value="social">Social Media</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Announcements ({filteredAnnouncements.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Announcement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAnnouncements.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900 truncate">{announcement.title}</div>
                      <div className="text-sm text-gray-500 truncate">{announcement.content}</div>
                      <div className="text-xs text-gray-400 mt-1">By {announcement.author}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Send className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-900">{announcement.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-900">{announcement.audience}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{announcement.views.toLocaleString()} views</div>
                      <div className="text-gray-500">{announcement.clicks} clicks ({announcement.engagement}%)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(announcement.status)}`}>
                      {announcement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {announcement.publishDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Emergency Alert</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Schedule Campaign</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Newsletter</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Targeted Message</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Campaign Management</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Announcements;