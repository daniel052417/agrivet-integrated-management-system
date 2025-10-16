import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Mail,
  MessageSquare,
  Bell,
  Users,
  Calendar,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Target,
  TrendingUp
} from 'lucide-react';

// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    title: "Summer Sale Promotion",
    message: "Get up to 30% off on all fertilizers! Limited time offer.",
    type: "promotion",
    channel: "email",
    status: "sent",
    scheduledDate: "2025-01-15T09:00:00Z",
    sentDate: "2025-01-15T09:00:00Z",
    recipients: 1250,
    opened: 890,
    clicked: 234,
    conversions: 45,
    createdBy: "John Doe",
    createdAt: "2025-01-14T14:30:00Z"
  },
  {
    id: 2,
    title: "New Product Alert",
    message: "Check out our latest premium seeds collection!",
    type: "product",
    channel: "sms",
    status: "sent",
    scheduledDate: "2025-01-18T10:00:00Z",
    sentDate: "2025-01-18T10:00:00Z",
    recipients: 890,
    opened: 567,
    clicked: 123,
    conversions: 23,
    createdBy: "Jane Smith",
    createdAt: "2025-01-17T16:45:00Z"
  },
  {
    id: 3,
    title: "Order Confirmation",
    message: "Your order #12345 has been confirmed and is being processed.",
    type: "transaction",
    channel: "email",
    status: "sent",
    scheduledDate: "2025-01-20T11:30:00Z",
    sentDate: "2025-01-20T11:30:00Z",
    recipients: 1,
    opened: 1,
    clicked: 0,
    conversions: 0,
    createdBy: "System",
    createdAt: "2025-01-20T11:30:00Z"
  },
  {
    id: 4,
    title: "Valentine's Special",
    message: "Spread love with our special Valentine's offers!",
    type: "promotion",
    channel: "push",
    status: "scheduled",
    scheduledDate: "2025-02-10T08:00:00Z",
    sentDate: null,
    recipients: 0,
    opened: 0,
    clicked: 0,
    conversions: 0,
    createdBy: "Sarah Wilson",
    createdAt: "2025-01-25T10:15:00Z"
  },
  {
    id: 5,
    title: "Inventory Alert",
    message: "Low stock alert: Ammonium Sulfate running low.",
    type: "alert",
    channel: "email",
    status: "failed",
    scheduledDate: "2025-01-22T14:00:00Z",
    sentDate: null,
    recipients: 0,
    opened: 0,
    clicked: 0,
    conversions: 0,
    createdBy: "Mike Johnson",
    createdAt: "2025-01-22T13:45:00Z"
  }
];

const ClientNotifications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promotion': return <Target className="w-4 h-4" />;
      case 'product': return <TrendingUp className="w-4 h-4" />;
      case 'transaction': return <CheckCircle className="w-4 h-4" />;
      case 'alert': return <AlertCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-orange-100 text-orange-800';
      case 'product': return 'bg-blue-100 text-blue-800';
      case 'transaction': return 'bg-green-100 text-green-800';
      case 'alert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'push': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const filteredNotifications = mockNotifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesChannel = channelFilter === 'all' || notification.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    return matchesSearch && matchesType && matchesChannel && matchesStatus;
  });

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create Notification</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter notification message"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                <option value="promotion">Promotion</option>
                <option value="product">Product</option>
                <option value="transaction">Transaction</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push Notification</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="ml-2 text-sm text-gray-700">All customers</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="ml-2 text-sm text-gray-700">VIP customers only</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="ml-2 text-sm text-gray-700">Specific segments</span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Create Notification
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Notifications</h2>
          <p className="text-gray-600">Manage customer communications and notifications</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Notification</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="promotion">Promotion</option>
            <option value="product">Product</option>
            <option value="transaction">Transaction</option>
            <option value="alert">Alert</option>
          </select>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
          </select>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-3xl font-bold text-gray-900">{mockNotifications.filter(n => n.status === 'sent').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Send className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-3xl font-bold text-gray-900">{mockNotifications.filter(n => n.status === 'scheduled').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recipients</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(mockNotifications.reduce((sum, n) => sum + n.recipients, 0))}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(
                  mockNotifications
                    .filter(n => n.status === 'sent' && n.recipients > 0)
                    .reduce((sum, n) => sum + (n.opened / n.recipients), 0) / 
                  mockNotifications.filter(n => n.status === 'sent' && n.recipients > 0).length * 100
                )}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{notification.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {notification.sentDate ? `Sent: ${formatDate(notification.sentDate)}` : `Scheduled: ${formatDate(notification.scheduledDate)}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(notification.type)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(notification.channel)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChannelColor(notification.channel)}`}>
                        {notification.channel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(notification.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatNumber(notification.recipients)}</div>
                    <div className="text-xs text-gray-500">recipients</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {notification.status === 'sent' && notification.recipients > 0 ? (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {formatNumber(notification.opened)} / {formatNumber(notification.recipients)} opened
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(notification.clicked)} clicked, {formatNumber(notification.conversions)} converted
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-emerald-600 hover:text-emerald-900" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="Delete">
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

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new notification.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notification</span>
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && renderCreateModal()}
    </div>
  );
};

export default ClientNotifications;