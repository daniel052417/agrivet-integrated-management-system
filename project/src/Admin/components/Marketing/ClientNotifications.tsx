import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Bell, Send, Users, Clock, Target, MessageSquare, Mail, Smartphone, Filter, Download, CheckCircle, AlertCircle } from 'lucide-react';

const ClientNotifications: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('sent');
  const [selectedType, setSelectedType] = useState('all');

  const notifications = [
    {
      id: 1,
      title: 'Order Ready for Pickup',
      message: 'Your order #ORD-2024-001 is ready for pickup at our main branch.',
      type: 'Order Update',
      channel: 'SMS + Email',
      recipients: 1,
      sent: 1,
      delivered: 1,
      opened: 1,
      clicked: 0,
      status: 'Delivered',
      sentDate: '2024-01-15 14:30',
      priority: 'High',
      customer: 'Maria Santos'
    },
    {
      id: 2,
      title: 'New Product Arrival - Organic Fertilizers',
      message: 'Check out our new collection of organic fertilizers now available in store!',
      type: 'Product Alert',
      channel: 'Email',
      recipients: 1245,
      sent: 1245,
      delivered: 1198,
      opened: 456,
      clicked: 89,
      status: 'Delivered',
      sentDate: '2024-01-14 09:00',
      priority: 'Medium',
      customer: 'All Customers'
    },
    {
      id: 3,
      title: 'Appointment Reminder',
      message: 'Reminder: Your veterinary appointment is scheduled for tomorrow at 2:00 PM.',
      type: 'Appointment',
      channel: 'SMS',
      recipients: 1,
      sent: 1,
      delivered: 1,
      opened: 1,
      clicked: 0,
      status: 'Delivered',
      sentDate: '2024-01-13 18:00',
      priority: 'High',
      customer: 'Juan Dela Cruz'
    },
    {
      id: 4,
      title: 'Payment Overdue Notice',
      message: 'Your payment for invoice #INV-2024-045 is overdue. Please settle your account.',
      type: 'Payment',
      channel: 'Email + SMS',
      recipients: 1,
      sent: 1,
      delivered: 1,
      opened: 0,
      clicked: 0,
      status: 'Delivered',
      sentDate: '2024-01-12 10:15',
      priority: 'High',
      customer: 'Carlos Martinez'
    },
    {
      id: 5,
      title: 'Seasonal Sale - 25% Off Veterinary Supplies',
      message: 'Don\'t miss our seasonal sale! Get 25% off all veterinary supplies this week.',
      type: 'Promotion',
      channel: 'Email + Push',
      recipients: 2847,
      sent: 2847,
      delivered: 2756,
      opened: 892,
      clicked: 234,
      status: 'Delivered',
      sentDate: '2024-01-11 08:00',
      priority: 'Medium',
      customer: 'All Customers'
    },
    {
      id: 6,
      title: 'Stock Alert - Low Inventory',
      message: 'The product you\'re interested in is running low. Order now to avoid disappointment!',
      type: 'Stock Alert',
      channel: 'SMS',
      recipients: 156,
      sent: 156,
      delivered: 0,
      opened: 0,
      clicked: 0,
      status: 'Scheduled',
      sentDate: '2024-01-16 16:00',
      priority: 'Medium',
      customer: 'Interested Customers'
    }
  ];

  const notificationTypes = [
    { type: 'Order Update', count: 45, deliveryRate: 98.5, color: 'bg-blue-500' },
    { type: 'Appointment', count: 23, deliveryRate: 99.2, color: 'bg-green-500' },
    { type: 'Payment', count: 12, deliveryRate: 95.8, color: 'bg-red-500' },
    { type: 'Promotion', count: 18, deliveryRate: 97.1, color: 'bg-purple-500' },
    { type: 'Product Alert', count: 8, deliveryRate: 96.3, color: 'bg-orange-500' },
    { type: 'Stock Alert', count: 15, deliveryRate: 94.7, color: 'bg-yellow-500' }
  ];

  const performanceMetrics = [
    {
      title: 'Total Notifications Sent',
      value: '8,456',
      change: '+12.3% this month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Send
    },
    {
      title: 'Delivery Rate',
      value: '97.2%',
      change: '+1.5% improvement',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    {
      title: 'Open Rate',
      value: '34.8%',
      change: '+2.1% vs last month',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: Eye
    },
    {
      title: 'Click Rate',
      value: '8.9%',
      change: '+0.8% improvement',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: Target
    }
  ];

  const channelPerformance = [
    { channel: 'SMS', sent: 3456, delivered: 3398, opened: 2847, clicked: 234, rate: 98.3 },
    { channel: 'Email', sent: 4234, delivered: 4089, opened: 1456, clicked: 345, rate: 96.6 },
    { channel: 'Push Notification', sent: 766, delivered: 723, opened: 456, clicked: 67, rate: 94.4 },
    { channel: 'In-App', sent: 234, delivered: 228, opened: 189, clicked: 45, rate: 97.4 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Order Update': return 'bg-blue-100 text-blue-800';
      case 'Appointment': return 'bg-green-100 text-green-800';
      case 'Payment': return 'bg-red-100 text-red-800';
      case 'Promotion': return 'bg-purple-100 text-purple-800';
      case 'Product Alert': return 'bg-orange-100 text-orange-800';
      case 'Stock Alert': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'all') return true;
    return notification.status.toLowerCase() === selectedTab;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Client Notifications</h2>
          <p className="text-gray-600 mt-1">Manage and track customer notifications across all channels</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Send Notification</span>
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

      {/* Notification Types and Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Notification Types</h3>
            <MessageSquare className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {notificationTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{type.type}</p>
                    <p className="text-xs text-gray-500">{type.count} sent this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{type.deliveryRate}%</p>
                  <p className="text-xs text-gray-500">delivery rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Channel Performance</h3>
            <Send className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {channelPerformance.map((channel, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {channel.channel === 'SMS' && <Smartphone className="w-4 h-4 text-green-600" />}
                    {channel.channel === 'Email' && <Mail className="w-4 h-4 text-blue-600" />}
                    {channel.channel === 'Push Notification' && <Bell className="w-4 h-4 text-purple-600" />}
                    {channel.channel === 'In-App' && <MessageSquare className="w-4 h-4 text-orange-600" />}
                    <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{channel.rate}%</span>
                    <span className="text-xs text-gray-500 ml-2">delivery</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>Sent: {channel.sent.toLocaleString()}</div>
                  <div>Delivered: {channel.delivered.toLocaleString()}</div>
                  <div>Opened: {channel.opened.toLocaleString()}</div>
                  <div>Clicked: {channel.clicked}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${channel.rate}%` }}
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
              {['all', 'delivered', 'scheduled', 'failed'].map((tab) => (
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="order">Order Updates</option>
              <option value="appointment">Appointments</option>
              <option value="payment">Payments</option>
              <option value="promotion">Promotions</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Notifications ({filteredNotifications.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900 truncate">{notification.title}</div>
                      <div className="text-sm text-gray-500 truncate">{notification.message}</div>
                      <div className="text-xs text-gray-400 mt-1">To: {notification.customer}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Send className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-900">{notification.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">{notification.recipients.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Delivered: {notification.delivered}/{notification.sent}</div>
                    <div className="text-gray-500">Opened: {notification.opened} • Clicked: {notification.clicked}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {notification.sentDate}
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
            <span className="text-sm font-medium text-gray-700">Bulk Notification</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Schedule Message</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Targeted Campaign</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <AlertCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Emergency Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientNotifications;