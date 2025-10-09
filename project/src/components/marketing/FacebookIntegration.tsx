import React, { useState, useEffect } from 'react';
import { 
  Facebook, 
  Settings, 
  Link, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Save,
  TestTube,
  BarChart3,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  Share2,
  Users,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Lock,
  Unlock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  MoreVertical,
  Play,
  Pause,
  Stop,
  RotateCcw,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Home,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  Share,
  Bookmark,
  Flag,
  MoreHorizontal,
  Target,
  Megaphone,
  Tag,
  Gift,
  Bell,
  Award,
  Crown,
  Sparkles,
  Zap as Lightning,
  Rocket,
  Compass,
  Map,
  Navigation,
  Layers,
  Grid,
  List,
  Maximize,
  Minimize,
  Move,
  RotateCw,
  Scissors,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  List as ListIcon,
  Hash,
  Quote,
  Code,
  Terminal,
  Database,
  Server,
  Cloud,
  HardDrive,
  Cpu,
  MemoryStick,
  HardDrive as Storage,
  Wifi as Network,
  Bluetooth,
  Radio,
  Signal,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Video,
  VideoOff,
  Headphones,
  Speaker,
  Music,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume1,
  Volume2 as VolumeHigh,
  VolumeX as VolumeMute,
  Mic as Microphone,
  MicOff as MicrophoneOff,
  Camera as CameraIcon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Headphones as HeadphonesIcon,
  Speaker as SpeakerIcon,
  Music as MusicIcon,
  PlayCircle as PlayCircleIcon,
  PauseCircle as PauseCircleIcon,
  StopCircle as StopCircleIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Repeat as RepeatIcon,
  Shuffle as ShuffleIcon
} from 'lucide-react';

// Mock data for Facebook integration
const mockFacebookData = {
  connectionStatus: {
    connected: true,
    pageId: '123456789012345',
    pageName: 'Tiongson Agrivet Official',
    accessToken: 'EAABwzLixnjYBO...',
    permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    lastSync: '2024-01-15T10:30:00Z',
    expiresAt: '2024-02-15T10:30:00Z'
  },
  settings: {
    autoPost: true,
    postFrequency: 'daily',
    postTime: '09:00',
    timezone: 'Asia/Manila',
    includeImages: true,
    includeHashtags: true,
    hashtagStrategy: 'trending',
    postFormat: 'detailed',
    includeCallToAction: true,
    callToActionText: 'Visit our store today!',
    targetAudience: 'all',
    excludeWeekends: false,
    maxPostsPerDay: 3,
    minIntervalHours: 4
  },
  templates: [
    {
      id: '1',
      name: 'Product Promotion',
      content: '🌱 New arrivals at Tiongson Agrivet! Check out our latest agricultural products and get the best deals. #Agriculture #Farming #TiongsonAgrivet',
      type: 'product',
      status: 'active',
      usageCount: 45,
      lastUsed: '2024-01-15T09:00:00Z',
      variables: ['product_name', 'price', 'discount']
    },
    {
      id: '2',
      name: 'Seasonal Offer',
      content: '🌾 Seasonal farming supplies now available! Don\'t miss out on our special offers for this planting season. #SeasonalOffer #FarmingSupplies',
      type: 'seasonal',
      status: 'active',
      usageCount: 23,
      lastUsed: '2024-01-14T14:30:00Z',
      variables: ['season', 'offer_percentage', 'valid_until']
    },
    {
      id: '3',
      name: 'Store Update',
      content: '📍 Tiongson Agrivet is now open! Visit us for all your agricultural needs. We\'re here to help you grow! #StoreUpdate #OpenNow',
      type: 'announcement',
      status: 'active',
      usageCount: 12,
      lastUsed: '2024-01-13T08:00:00Z',
      variables: ['store_location', 'opening_hours']
    }
  ],
  analytics: {
    totalPosts: 156,
    totalReach: 12500,
    totalEngagement: 890,
    averageReach: 80.1,
    averageEngagement: 5.7,
    topPost: {
      content: '🌱 New arrivals at Tiongson Agrivet!',
      reach: 450,
      engagement: 32,
      date: '2024-01-15T09:00:00Z'
    },
    engagementRate: 7.1,
    reachGrowth: 12.5,
    engagementGrowth: 8.3
  },
  recentPosts: [
    {
      id: '1',
      content: '🌱 New arrivals at Tiongson Agrivet! Check out our latest agricultural products.',
      status: 'published',
      reach: 450,
      engagement: 32,
      publishedAt: '2024-01-15T09:00:00Z',
      scheduledFor: null
    },
    {
      id: '2',
      content: '🌾 Seasonal farming supplies now available! Don\'t miss out on our special offers.',
      status: 'scheduled',
      reach: 0,
      engagement: 0,
      publishedAt: null,
      scheduledFor: '2024-01-16T09:00:00Z'
    },
    {
      id: '3',
      content: '📍 Tiongson Agrivet is now open! Visit us for all your agricultural needs.',
      status: 'published',
      reach: 320,
      engagement: 18,
      publishedAt: '2024-01-14T14:30:00Z',
      scheduledFor: null
    }
  ],
  insights: {
    bestPostingTimes: ['09:00', '14:00', '18:00'],
    bestDays: ['Monday', 'Wednesday', 'Friday'],
    audienceDemographics: {
      ageGroups: {
        '18-24': 15,
        '25-34': 35,
        '35-44': 28,
        '45-54': 15,
        '55+': 7
      },
      genders: {
        male: 65,
        female: 35
      },
      locations: {
        'Metro Manila': 40,
        'Luzon': 35,
        'Visayas': 15,
        'Mindanao': 10
      }
    },
    topHashtags: ['#Agriculture', '#Farming', '#TiongsonAgrivet', '#Philippines', '#FarmLife'],
    competitorAnalysis: {
      averageReach: 75.2,
      averageEngagement: 4.8,
      ourPerformance: 'above_average'
    }
  }
};

const FacebookIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [settings, setSettings] = useState(mockFacebookData.settings);
  const [connectionStatus, setConnectionStatus] = useState(mockFacebookData.connectionStatus);
  const [promotionStats, setPromotionStats] = useState<any>(null);
  const [autoPostingConfig, setAutoPostingConfig] = useState({
    enabled: true,
    frequency: 'daily',
    postTime: '09:00',
    timezone: 'Asia/Manila',
    includeImages: true,
    includeHashtags: true,
    hashtagStrategy: 'mixed',
    postFormat: 'detailed',
    includeCallToAction: true,
    callToActionText: 'Visit our store today!',
    reminderDays: [3, 1],
    endingReminderDays: [1],
    maxPostsPerPromotion: 5,
    excludeWeekends: false
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleConnect = () => {
    setShowConnectModal(true);
  };

  const handleDisconnect = () => {
    setConnectionStatus(prev => ({ ...prev, connected: false }));
  };

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    // Implement save functionality
  };

  const handleTestConnection = () => {
    console.log('Testing Facebook connection...');
    // Implement test functionality
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate({ isNew: true });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = (id: string) => {
    console.log('Delete template:', id);
    // Implement delete functionality
  };

  const handlePublishPost = (postId: string) => {
    console.log('Publish post:', postId);
    // Implement publish functionality
  };

  const handleSchedulePost = (postId: string) => {
    console.log('Schedule post:', postId);
    // Implement schedule functionality
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      case 'published': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'disconnected': return <XCircle className="w-4 h-4" />;
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facebook Integration</h2>
          <p className="text-gray-600">Manage your Facebook page integration and automated posting</p>
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
          {connectionStatus.connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <XCircle className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Facebook className="w-4 h-4" />
              <span>Connect Facebook</span>
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(connectionStatus.connected ? 'connected' : 'disconnected')}`}>
            {getStatusIcon(connectionStatus.connected ? 'connected' : 'disconnected')}
            <span>{connectionStatus.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {connectionStatus.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Page Name</label>
                <p className="text-lg font-semibold text-gray-900">{connectionStatus.pageName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Page ID</label>
                <p className="text-sm text-gray-900 font-mono">{connectionStatus.pageId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Sync</label>
                <p className="text-sm text-gray-900">{formatDate(connectionStatus.lastSync)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Expires At</label>
                <p className="text-sm text-gray-900">{formatDate(connectionStatus.expiresAt)}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Access Token</label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={connectionStatus.accessToken}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Permissions</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {connectionStatus.permissions.map((permission, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Facebook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your Facebook Page</h4>
            <p className="text-gray-600 mb-4">Connect your Facebook page to start automated posting and analytics.</p>
            <button
              onClick={handleConnect}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Facebook className="w-5 h-5" />
              <span>Connect Facebook Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Templates</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>Posts</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'promotions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4" />
                <span>Promotions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Content based on active tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Posts</p>
                      <p className="text-2xl font-bold">{mockFacebookData.analytics.totalPosts}</p>
                    </div>
                    <Share2 className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Reach</p>
                      <p className="text-2xl font-bold">{formatNumber(mockFacebookData.analytics.totalReach)}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Engagement</p>
                      <p className="text-2xl font-bold">{formatNumber(mockFacebookData.analytics.totalEngagement)}</p>
                    </div>
                    <Heart className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Engagement Rate</p>
                      <p className="text-2xl font-bold">{mockFacebookData.analytics.engagementRate}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {mockFacebookData.recentPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>Reach: {formatNumber(post.reach)}</span>
                          <span>Engagement: {post.engagement}</span>
                          <span>{formatDate(post.publishedAt || post.scheduledFor || '')}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                        {post.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Posting Settings</h3>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auto Posting</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.autoPost}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoPost: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Enable automatic posting</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Post Frequency</label>
                    <select
                      value={settings.postFrequency}
                      onChange={(e) => setSettings(prev => ({ ...prev, postFrequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Post Time</label>
                    <input
                      type="time"
                      value={settings.postTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, postTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Asia/Manila">Asia/Manila</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Settings</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.includeImages}
                          onChange={(e) => setSettings(prev => ({ ...prev, includeImages: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Include images</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.includeHashtags}
                          onChange={(e) => setSettings(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Include hashtags</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.includeCallToAction}
                          onChange={(e) => setSettings(prev => ({ ...prev, includeCallToAction: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Include call to action</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Call to Action Text</label>
                    <input
                      type="text"
                      value={settings.callToActionText}
                      onChange={(e) => setSettings(prev => ({ ...prev, callToActionText: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Visit our store today!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Posts Per Day</label>
                    <input
                      type="number"
                      value={settings.maxPostsPerDay}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxPostsPerDay: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Post Templates</h3>
                <button
                  onClick={handleCreateTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Template</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockFacebookData.templates.map((template) => (
                  <div key={template.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                          {getStatusIcon(template.status)}
                          <span className="ml-1">{template.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.content}</p>
                    
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">{template.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage:</span>
                        <span className="font-medium">{template.usageCount} times</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last used:</span>
                        <span className="font-medium">{formatDate(template.lastUsed)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  <span>Create Post</span>
                </button>
              </div>

              <div className="space-y-4">
                {mockFacebookData.recentPosts.map((post) => (
                  <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Reach: {formatNumber(post.reach)}</span>
                          <span>Engagement: {post.engagement}</span>
                          <span>{formatDate(post.publishedAt || post.scheduledFor || '')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                        {post.status === 'scheduled' && (
                          <button
                            onClick={() => handlePublishPost(post.id)}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                <button
                  onClick={() => setShowAnalyticsModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Detailed Analytics</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Audience Demographics</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Age Groups</label>
                      <div className="mt-1 space-y-1">
                        {Object.entries(mockFacebookData.insights.audienceDemographics.ageGroups).map(([age, percentage]) => (
                          <div key={age} className="flex justify-between text-sm">
                            <span>{age}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockFacebookData.insights.topHashtags.map((hashtag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'promotions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Promotions Integration</h3>
                <button
                  onClick={() => {/* Handle refresh */}}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Stats</span>
                </button>
              </div>

              {/* Auto-posting Configuration */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Auto-posting Configuration</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      autoPostingConfig.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {autoPostingConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => setAutoPostingConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        autoPostingConfig.enabled
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {autoPostingConfig.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post Frequency</label>
                    <select
                      value={autoPostingConfig.frequency}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post Time</label>
                    <input
                      type="time"
                      value={autoPostingConfig.postTime}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, postTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select
                      value={autoPostingConfig.timezone}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Manila">Asia/Manila</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post Format</label>
                    <select
                      value={autoPostingConfig.postFormat}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, postFormat: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simple">Simple</option>
                      <option value="detailed">Detailed</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hashtag Strategy</label>
                    <select
                      value={autoPostingConfig.hashtagStrategy}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, hashtagStrategy: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="trending">Trending</option>
                      <option value="custom">Custom</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Posts per Promotion</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={autoPostingConfig.maxPostsPerPromotion}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, maxPostsPerPromotion: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoPostingConfig.includeImages}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, includeImages: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Images</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoPostingConfig.includeHashtags}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Hashtags</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoPostingConfig.includeCallToAction}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, includeCallToAction: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Call to Action</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoPostingConfig.excludeWeekends}
                      onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, excludeWeekends: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Exclude Weekends</span>
                  </label>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action Text</label>
                  <input
                    type="text"
                    value={autoPostingConfig.callToActionText}
                    onChange={(e) => setAutoPostingConfig(prev => ({ ...prev, callToActionText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Visit our store today!"
                  />
                </div>
              </div>

              {/* Promotion Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Active Promotions</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <Megaphone className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Promotion Posts</p>
                      <p className="text-2xl font-bold">48</p>
                    </div>
                    <Share2 className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Reach</p>
                      <p className="text-2xl font-bold">15.2K</p>
                    </div>
                    <Eye className="w-8 h-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Engagement</p>
                      <p className="text-2xl font-bold">2.8K</p>
                    </div>
                    <Heart className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Recent Promotion Posts */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Recent Promotion Posts</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {[
                    {
                      id: 1,
                      promotion: 'Summer Sale 2024',
                      content: '🌞 SUMMER SALE ALERT! 🌞\n\nGet 20% OFF on all agricultural supplies!\n\nValid until July 31, 2024\n\nVisit our store today!',
                      status: 'published',
                      publishedAt: '2024-01-15T09:00:00Z',
                      reach: 1250,
                      engagement: 89,
                      likes: 45,
                      comments: 12,
                      shares: 8
                    },
                    {
                      id: 2,
                      promotion: 'Fertilizer Special',
                      content: '🌱 FERTILIZER SPECIAL! 🌱\n\nPremium fertilizers at discounted prices!\n\nSave up to ₱500 on selected items\n\nLimited time offer!',
                      status: 'scheduled',
                      scheduledFor: '2024-01-16T10:00:00Z',
                      reach: 0,
                      engagement: 0,
                      likes: 0,
                      comments: 0,
                      shares: 0
                    }
                  ].map((post) => (
                    <div key={post.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-gray-900">{post.promotion}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">{post.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{post.status === 'published' ? 'Published' : 'Scheduled'}: {new Date(post.publishedAt || post.scheduledFor).toLocaleString()}</span>
                            {post.status === 'published' && (
                              <>
                                <span className="flex items-center">
                                  <Eye className="w-4 h-4 mr-1" />
                                  {post.reach}
                                </span>
                                <span className="flex items-center">
                                  <Heart className="w-4 h-4 mr-1" />
                                  {post.likes}
                                </span>
                                <span className="flex items-center">
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  {post.comments}
                                </span>
                                <span className="flex items-center">
                                  <Share2 className="w-4 h-4 mr-1" />
                                  {post.shares}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookIntegration;
