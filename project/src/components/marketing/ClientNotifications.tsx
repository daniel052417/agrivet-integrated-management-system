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
      sentAt: '2024-01-15 10:30:00',
      customer: 'John Doe',
      priority: 'High'
    },
    {
      id: 2,
      title: 'Payment Confirmation',
      message: 'Thank you for your payment of ₱1,500.00. Your order has been confirmed.',
      type: 'Payment',
      channel: 'Email',
      recipients: 1,
      sent: 1,
      delivered: 1,
      opened: 1,
      clicked: 1,
      status: 'Delivered',
      sentAt: '2024-01-15 09:15:00',
      customer: 'Jane Smith',
      priority: 'Medium'
    },
    {
      id: 3,
      title: 'Product Restock Alert',
      message: 'The product you were interested in is now back in stock!',
      type: 'Marketing',
      channel: 'SMS',
      recipients: 50,
      sent: 48,
      delivered: 45,
      opened: 30,
      clicked: 12,
      status: 'Delivered',
      sentAt: '2024-01-14 14:20:00',
      customer: 'Bulk Campaign',
      priority: 'Low'
    },
    {
      id: 4,
      title: 'Appointment Reminder',
      message: 'You have an appointment scheduled for tomorrow at 2:00 PM.',
      type: 'Appointment',
      channel: 'SMS + Push',
      recipients: 1,
      sent: 1,
      delivered: 0,
      opened: 0,
      clicked: 0,
      status: 'Failed',
      sentAt: '2024-01-14 16:45:00',
      customer: 'Mike Johnson',
      priority: 'High'
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = selectedTab === 'all' || 
      (selectedTab === 'sent' && notification.status === 'Delivered') ||
      (selectedTab === 'failed' && notification.status === 'Failed') ||
      (selectedTab === 'scheduled' && notification.status === 'Scheduled');
    
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    return matchesTab && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    if (channel.includes('Email')) return <Mail className="w-4 h-4" />;
    if (channel.includes('SMS')) return <Smartphone className="w-4 h-4" />;
    if (channel.includes('Push')) return <Bell className="w-4 h-4" />;
    return <MessageSquare className="w-4 h-4" />;
  };

  return (
    <div className="client-notifications">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Notifications</h1>
          <p className="text-gray-600">Manage and track client communication</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.reduce((sum, n) => sum + n.sent, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.reduce((sum, n) => sum + n.delivered, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Opened</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.reduce((sum, n) => sum + n.opened, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clicked</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.reduce((sum, n) => sum + n.clicked, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'all', label: 'All', count: notifications.length },
                  { id: 'sent', label: 'Sent', count: notifications.filter(n => n.status === 'Delivered').length },
                  { id: 'failed', label: 'Failed', count: notifications.filter(n => n.status === 'Failed').length },
                  { id: 'scheduled', label: 'Scheduled', count: notifications.filter(n => n.status === 'Scheduled').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Order Update">Order Update</option>
                <option value="Payment">Payment</option>
                <option value="Marketing">Marketing</option>
                <option value="Appointment">Appointment</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Notification</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {notification.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{notification.message}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 font-medium">{notification.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Channel:</span>
                      <span className="ml-2 font-medium flex items-center space-x-1">
                        {getChannelIcon(notification.channel)}
                        <span>{notification.channel}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <span className="ml-2 font-medium">{notification.customer}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sent:</span>
                      <span className="ml-2 font-medium">{notification.sentAt}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Recipients: {notification.recipients}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Delivered: {notification.delivered}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">Opened: {notification.opened}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">Clicked: {notification.clicked}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button className="text-blue-600 hover:text-blue-800 p-1" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 p-1" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
            <p className="text-gray-500 mb-4">
              {selectedTab === 'all' 
                ? 'No notifications have been sent yet.'
                : `No ${selectedTab} notifications found.`
              }
            </p>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto">
              <Plus className="w-4 h-4" />
              <span>Send First Notification</span>
            </button>
          </div>
        )}
      </div>
  );
};

export default ClientNotifications;










