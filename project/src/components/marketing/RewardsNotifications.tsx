import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Bell, 
  Users, 
  Star, 
  Award, 
  Target, 
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Percent,
  ShoppingCart,
  Download,
  Filter,
  Search,
  RefreshCw,
  MoreVertical,
  BellRing,
  GiftBox,
  Trophy,
  Crown,
  Sparkles,
  Heart,
  ThumbsUp,
  MessageSquare,
  Mail,
  Smartphone,
  Globe,
  Zap,
  Shield,
  Lock,
  Unlock,
  EyeOff,
  Play,
  Pause,
  Stop,
  RotateCcw,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck2,
  UserClock,
  UserStar,
  UserAward,
  UserGift,
  UserCrown,
  UserTrophy,
  UserSparkles,
  UserHeart,
  UserThumbsUp,
  UserMessage,
  UserMail,
  UserSmartphone,
  UserGlobe,
  UserZap,
  UserShield,
  UserLock,
  UserUnlock,
  UserEyeOff,
  UserPlay,
  UserPause,
  UserStop,
  UserRotateCcw,
  UserBarChart3,
  UserPieChart,
  UserActivity
} from 'lucide-react';

// Mock data for rewards and notifications
const mockRewardsData = {
  rewards: [
    {
      id: '1',
      name: 'Welcome Bonus',
      description: 'Get 100 points for your first purchase',
      type: 'points',
      value: 100,
      condition: 'first_purchase',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      usageCount: 245,
      maxUsage: 1000,
      priority: 'high',
      icon: 'gift',
      color: 'emerald'
    },
    {
      id: '2',
      name: 'Loyalty Discount',
      description: '10% off for customers with 5+ purchases',
      type: 'discount',
      value: 10,
      condition: 'loyalty_level',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      usageCount: 89,
      maxUsage: 500,
      priority: 'medium',
      icon: 'percent',
      color: 'blue'
    },
    {
      id: '3',
      name: 'Referral Reward',
      description: 'Earn 50 points for each successful referral',
      type: 'points',
      value: 50,
      condition: 'referral',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      usageCount: 156,
      maxUsage: 1000,
      priority: 'medium',
      icon: 'users',
      color: 'purple'
    },
    {
      id: '4',
      name: 'Birthday Special',
      description: 'Special 20% discount on your birthday month',
      type: 'discount',
      value: 20,
      condition: 'birthday',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      usageCount: 67,
      maxUsage: 200,
      priority: 'high',
      icon: 'cake',
      color: 'pink'
    },
    {
      id: '5',
      name: 'VIP Exclusive',
      description: 'Exclusive access to premium products for VIP members',
      type: 'access',
      value: 0,
      condition: 'vip_member',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      usageCount: 23,
      maxUsage: 50,
      priority: 'high',
      icon: 'crown',
      color: 'gold'
    }
  ],
  notifications: [
    {
      id: '1',
      title: 'New Reward Available',
      message: 'Welcome Bonus is now available for new customers',
      type: 'reward',
      status: 'sent',
      channel: 'email',
      target: 'all_customers',
      scheduledAt: '2024-01-15T10:00:00Z',
      sentAt: '2024-01-15T10:05:00Z',
      openRate: 45.2,
      clickRate: 12.8,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Loyalty Program Update',
      message: 'Your loyalty points have been updated. Check your account!',
      type: 'loyalty',
      status: 'sent',
      channel: 'push',
      target: 'loyal_customers',
      scheduledAt: '2024-01-14T14:30:00Z',
      sentAt: '2024-01-14T14:35:00Z',
      openRate: 67.8,
      clickRate: 23.4,
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Special Offer Ending Soon',
      message: 'Don\'t miss out! 20% off on selected items ends tomorrow',
      type: 'promotion',
      status: 'scheduled',
      channel: 'sms',
      target: 'active_customers',
      scheduledAt: '2024-01-16T09:00:00Z',
      sentAt: null,
      openRate: 0,
      clickRate: 0,
      priority: 'high'
    },
    {
      id: '4',
      title: 'Welcome to Our App',
      message: 'Thank you for downloading our app! Here\'s a special welcome offer',
      type: 'welcome',
      status: 'sent',
      channel: 'in_app',
      target: 'new_app_users',
      scheduledAt: '2024-01-13T16:00:00Z',
      sentAt: '2024-01-13T16:02:00Z',
      openRate: 89.3,
      clickRate: 45.7,
      priority: 'high'
    },
    {
      id: '5',
      title: 'Order Confirmation',
      message: 'Your order #12345 has been confirmed and is being processed',
      type: 'transaction',
      status: 'sent',
      channel: 'email',
      target: 'customer_12345',
      scheduledAt: '2024-01-15T11:30:00Z',
      sentAt: '2024-01-15T11:32:00Z',
      openRate: 95.2,
      clickRate: 78.9,
      priority: 'low'
    }
  ],
  templates: [
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to Tiongson Agrivet!',
      content: 'Thank you for joining us. Here\'s your welcome bonus...',
      type: 'email',
      category: 'welcome',
      status: 'active',
      usageCount: 156,
      lastUsed: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Loyalty Points Update',
      subject: 'Your Loyalty Points Have Been Updated',
      content: 'Great news! You\'ve earned new loyalty points...',
      type: 'email',
      category: 'loyalty',
      status: 'active',
      usageCount: 89,
      lastUsed: '2024-01-14T14:30:00Z'
    },
    {
      id: '3',
      name: 'Promotion Alert',
      subject: 'Special Offer - Limited Time!',
      content: 'Don\'t miss out on our special promotion...',
      type: 'email',
      category: 'promotion',
      status: 'active',
      usageCount: 234,
      lastUsed: '2024-01-16T09:00:00Z'
    }
  ],
  analytics: {
    totalRewards: 5,
    activeRewards: 5,
    totalNotifications: 1250,
    sentNotifications: 1200,
    scheduledNotifications: 50,
    averageOpenRate: 65.4,
    averageClickRate: 23.8,
    topReward: 'Welcome Bonus',
    topChannel: 'email',
    engagementRate: 78.9
  }
};

const RewardsNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rewards');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleCreate = (type: 'reward' | 'notification' | 'template') => {
    setSelectedItem({ type, isNew: true });
    if (type === 'template') {
      setShowTemplateModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    if (item.type === 'template') {
      setShowTemplateModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleDelete = (id: string) => {
    console.log('Delete item:', id);
    // Implement delete functionality
  };

  const handleSend = (id: string) => {
    console.log('Send notification:', id);
    // Implement send functionality
  };

  const handleSchedule = (id: string) => {
    console.log('Schedule notification:', id);
    // Implement schedule functionality
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'points': return <Star className="w-5 h-5" />;
      case 'discount': return <Percent className="w-5 h-5" />;
      case 'access': return <Crown className="w-5 h-5" />;
      case 'reward': return <Gift className="w-5 h-5" />;
      case 'loyalty': return <Award className="w-5 h-5" />;
      case 'promotion': return <TrendingUp className="w-5 h-5" />;
      case 'welcome': return <Heart className="w-5 h-5" />;
      case 'transaction': return <ShoppingCart className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      case 'push': return <BellRing className="w-4 h-4" />;
      case 'in_app': return <Globe className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const filteredRewards = mockRewardsData.rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || reward.status === filterStatus;
    const matchesType = filterType === 'all' || reward.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredNotifications = mockRewardsData.notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesType = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredTemplates = mockRewardsData.templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || template.status === filterStatus;
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rewards & Notifications</h2>
          <p className="text-gray-600">Manage customer rewards and notification campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => handleCreate(activeTab as any)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create {activeTab === 'rewards' ? 'Reward' : activeTab === 'notifications' ? 'Notification' : 'Template'}</span>
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rewards</p>
              <p className="text-2xl font-bold text-gray-900">{mockRewardsData.analytics.totalRewards}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Gift className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">{mockRewardsData.analytics.activeRewards} active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Notifications Sent</p>
              <p className="text-2xl font-bold text-gray-900">{mockRewardsData.analytics.sentNotifications.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">{mockRewardsData.analytics.scheduledNotifications} scheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">{mockRewardsData.analytics.averageOpenRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">{mockRewardsData.analytics.averageClickRate}% click rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">{mockRewardsData.analytics.engagementRate}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Top: {mockRewardsData.analytics.topChannel}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rewards'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4" />
                <span>Rewards</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {mockRewardsData.rewards.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {mockRewardsData.notifications.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Templates</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {mockRewardsData.templates.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="points">Points</option>
                <option value="discount">Discount</option>
                <option value="access">Access</option>
                <option value="reward">Reward</option>
                <option value="loyalty">Loyalty</option>
                <option value="promotion">Promotion</option>
                <option value="welcome">Welcome</option>
                <option value="transaction">Transaction</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-4">
              {filteredRewards.map((reward) => (
                <div key={reward.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg bg-${reward.color}-100`}>
                        {getTypeIcon(reward.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reward.status)}`}>
                            {reward.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reward.priority)}`}>
                            {reward.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{reward.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>Value: {reward.type === 'points' ? `${reward.value} points` : reward.type === 'discount' ? `${reward.value}%` : 'Access'}</span>
                          <span>Usage: {reward.usageCount}/{reward.maxUsage}</span>
                          <span>Valid: {formatDate(reward.startDate)} - {formatDate(reward.endDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(reward)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-blue-100">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                            {notification.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{notification.message}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            {getChannelIcon(notification.channel)}
                            <span>{notification.channel}</span>
                          </div>
                          <span>Target: {notification.target}</span>
                          <span>Scheduled: {formatDate(notification.scheduledAt)}</span>
                          {notification.sentAt && (
                            <span>Sent: {formatDate(notification.sentAt)}</span>
                          )}
                        </div>
                        {notification.status === 'sent' && (
                          <div className="mt-3 flex items-center space-x-4 text-sm">
                            <span className="text-green-600">Open Rate: {notification.openRate}%</span>
                            <span className="text-blue-600">Click Rate: {notification.clickRate}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {notification.status === 'scheduled' && (
                        <button
                          onClick={() => handleSend(notification.id)}
                          className="p-2 text-green-600 hover:text-green-700"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(notification)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-purple-100">
                        <Settings className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                            {template.status}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {template.type}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2 font-medium">{template.subject}</p>
                        <p className="text-gray-500 mb-3 text-sm">{template.content}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>Category: {template.category}</span>
                          <span>Usage: {template.usageCount} times</span>
                          <span>Last used: {formatDate(template.lastUsed)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsNotifications;
