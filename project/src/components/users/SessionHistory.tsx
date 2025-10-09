import React, { useEffect, useMemo, useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  LogOut, 
  MapPin, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Activity
} from 'lucide-react';

interface SessionHistoryItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  sessionId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  location: string;
  country: string;
  loginTime: string;
  lastActivity: string;
  logoutTime?: string;
  sessionDuration: number; // in minutes
  status: 'active' | 'expired' | 'terminated' | 'logout';
  isCurrentSession: boolean;
  userAgent: string;
  loginMethod: 'password' | 'mfa' | 'sso';
  mfaUsed: boolean;
  riskScore: 'low' | 'medium' | 'high';
}

const SessionHistory: React.FC = () => {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedSession, setSelectedSession] = useState<SessionHistoryItem | null>(null);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);

  // Mock data
  const mockSessions: SessionHistoryItem[] = [
    {
      id: '1',
      userId: 'user-1',
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      userRole: 'Admin',
      sessionId: 'sess_abc123',
      deviceType: 'desktop',
      deviceName: 'MacBook Pro',
      browser: 'Chrome 120.0',
      operatingSystem: 'macOS 14.2',
      ipAddress: '192.168.1.100',
      location: 'New York, NY',
      country: 'United States',
      loginTime: new Date(Date.now() - 3600000).toISOString(),
      lastActivity: new Date(Date.now() - 300000).toISOString(),
      sessionDuration: 60,
      status: 'active',
      isCurrentSession: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      loginMethod: 'mfa',
      mfaUsed: true,
      riskScore: 'low'
    },
    {
      id: '2',
      userId: 'user-2',
      userName: 'Jane Smith',
      userEmail: 'jane.smith@example.com',
      userRole: 'Manager',
      sessionId: 'sess_def456',
      deviceType: 'mobile',
      deviceName: 'iPhone 15 Pro',
      browser: 'Safari 17.2',
      operatingSystem: 'iOS 17.2',
      ipAddress: '192.168.1.101',
      location: 'Los Angeles, CA',
      country: 'United States',
      loginTime: new Date(Date.now() - 7200000).toISOString(),
      lastActivity: new Date(Date.now() - 1800000).toISOString(),
      logoutTime: new Date(Date.now() - 1800000).toISOString(),
      sessionDuration: 90,
      status: 'logout',
      isCurrentSession: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
      loginMethod: 'password',
      mfaUsed: false,
      riskScore: 'low'
    },
    {
      id: '3',
      userId: 'user-3',
      userName: 'Mike Johnson',
      userEmail: 'mike.johnson@example.com',
      userRole: 'Staff',
      sessionId: 'sess_ghi789',
      deviceType: 'desktop',
      deviceName: 'Dell Inspiron',
      browser: 'Firefox 121.0',
      operatingSystem: 'Windows 11',
      ipAddress: '192.168.1.102',
      location: 'Chicago, IL',
      country: 'United States',
      loginTime: new Date(Date.now() - 14400000).toISOString(),
      lastActivity: new Date(Date.now() - 3600000).toISOString(),
      sessionDuration: 180,
      status: 'expired',
      isCurrentSession: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      loginMethod: 'password',
      mfaUsed: false,
      riskScore: 'medium'
    },
    {
      id: '4',
      userId: 'user-4',
      userName: 'Sarah Wilson',
      userEmail: 'sarah.wilson@example.com',
      userRole: 'Staff',
      sessionId: 'sess_jkl012',
      deviceType: 'tablet',
      deviceName: 'iPad Air',
      browser: 'Safari 17.2',
      operatingSystem: 'iPadOS 17.2',
      ipAddress: '10.0.0.50',
      location: 'Miami, FL',
      country: 'United States',
      loginTime: new Date(Date.now() - 21600000).toISOString(),
      lastActivity: new Date(Date.now() - 7200000).toISOString(),
      sessionDuration: 240,
      status: 'terminated',
      isCurrentSession: false,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
      loginMethod: 'mfa',
      mfaUsed: true,
      riskScore: 'high'
    },
    {
      id: '5',
      userId: 'user-5',
      userName: 'David Brown',
      userEmail: 'david.brown@example.com',
      userRole: 'Manager',
      sessionId: 'sess_mno345',
      deviceType: 'mobile',
      deviceName: 'Samsung Galaxy S24',
      browser: 'Chrome Mobile 120.0',
      operatingSystem: 'Android 14',
      ipAddress: '172.16.0.25',
      location: 'Seattle, WA',
      country: 'United States',
      loginTime: new Date(Date.now() - 28800000).toISOString(),
      lastActivity: new Date(Date.now() - 14400000).toISOString(),
      logoutTime: new Date(Date.now() - 14400000).toISOString(),
      sessionDuration: 240,
      status: 'logout',
      isCurrentSession: false,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36',
      loginMethod: 'sso',
      mfaUsed: true,
      riskScore: 'low'
    },
    {
      id: '6',
      userId: 'user-6',
      userName: 'Lisa Davis',
      userEmail: 'lisa.davis@example.com',
      userRole: 'Admin',
      sessionId: 'sess_pqr678',
      deviceType: 'desktop',
      deviceName: 'HP Pavilion',
      browser: 'Edge 120.0',
      operatingSystem: 'Windows 10',
      ipAddress: '203.0.113.45',
      location: 'Toronto, ON',
      country: 'Canada',
      loginTime: new Date(Date.now() - 36000000).toISOString(),
      lastActivity: new Date(Date.now() - 28800000).toISOString(),
      sessionDuration: 120,
      status: 'expired',
      isCurrentSession: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      loginMethod: 'password',
      mfaUsed: false,
      riskScore: 'medium'
    }
  ];

  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data
      // In a real implementation, this would load from a sessions table
      setSessions(mockSessions);

      // Example of how to load real data:
      // const { data: sessionsData, error: sessionsError } = await supabase
      //   .from('user_sessions')
      //   .select(`
      //     *,
      //     users (
      //       first_name,
      //       last_name,
      //       email,
      //       role
      //     )
      //   `)
      //   .order('login_time', { ascending: false });
      // if (sessionsError) throw sessionsError;
      // setSessions(sessionsData || []);

    } catch (err: any) {
      console.error('Error loading session history:', err);
      setError(err.message || 'Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch = session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.ipAddress.includes(searchTerm) ||
                           session.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      const matchesDevice = deviceFilter === 'all' || session.deviceType === deviceFilter;
      const matchesRisk = riskFilter === 'all' || session.riskScore === riskFilter;
      
      const matchesDateRange = (!dateRange.start || session.loginTime >= dateRange.start) &&
                              (!dateRange.end || session.loginTime <= dateRange.end);
      
      return matchesSearch && matchesStatus && matchesDevice && matchesRisk && matchesDateRange;
    });
  }, [sessions, searchTerm, statusFilter, deviceFilter, riskFilter, dateRange]);

  const handleSessionAction = async (sessionId: string, action: string) => {
    try {
      switch (action) {
        case 'terminate':
          // This would typically call an API to terminate the session
          alert('Session terminated');
          break;
        case 'view':
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            setSelectedSession(session);
            setShowSessionModal(true);
          }
          break;
      }
    } catch (err: any) {
      console.error('Error performing session action:', err);
      alert(err.message || 'Failed to perform action');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-green-600" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-purple-600" />;
      default:
        return <Monitor className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'terminated':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'logout':
        return <LogOut className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskScore: string) => {
    switch (riskScore) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `${hours}h ${remainingMinutes}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getStats = () => {
    const total = sessions.length;
    const active = sessions.filter(s => s.status === 'active').length;
    const expired = sessions.filter(s => s.status === 'expired').length;
    const terminated = sessions.filter(s => s.status === 'terminated').length;
    const logout = sessions.filter(s => s.status === 'logout').length;
    const highRisk = sessions.filter(s => s.riskScore === 'high').length;
    const mfaUsed = sessions.filter(s => s.mfaUsed).length;
    
    return { total, active, expired, terminated, logout, highRisk, mfaUsed };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Session History</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadSessionHistory}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="session-history">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session History</h1>
        <p className="text-gray-600">Monitor user login history, active sessions, and security events</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Sessions</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Expired</p>
              <p className="text-xl font-bold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Terminated</p>
              <p className="text-xl font-bold text-gray-900">{stats.terminated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Logged Out</p>
              <p className="text-xl font-bold text-gray-900">{stats.logout}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">High Risk</p>
              <p className="text-xl font-bold text-gray-900">{stats.highRisk}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">MFA Used</p>
              <p className="text-xl font-bold text-gray-900">{stats.mfaUsed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="logout">Logged Out</option>
            </select>
            
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
            
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start Date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Security
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{session.userName}</div>
                        <div className="text-sm text-gray-500">{session.userEmail}</div>
                        <div className="text-xs text-gray-400">{session.userRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getDeviceIcon(session.deviceType)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{session.deviceName}</div>
                        <div className="text-xs text-gray-500">{session.browser}</div>
                        <div className="text-xs text-gray-400">{session.operatingSystem}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      <div>
                        <div className="text-sm text-gray-900">{session.location}</div>
                        <div className="text-xs text-gray-500">{session.country}</div>
                        <div className="text-xs text-gray-400">{session.ipAddress}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{formatTimestamp(session.loginTime)}</div>
                      {session.logoutTime && (
                        <div className="text-xs text-gray-500">
                          Logout: {formatTimestamp(session.logoutTime)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(session.sessionDuration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(session.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(session.riskScore)}`}>
                      {session.riskScore.charAt(0).toUpperCase() + session.riskScore.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {session.mfaUsed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3 mr-1" />
                          MFA
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {session.loginMethod.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSessionAction(session.id, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {session.status === 'active' && (
                        <button
                          onClick={() => handleSessionAction(session.id, 'terminate')}
                          className="text-red-600 hover:text-red-900"
                          title="Terminate Session"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || deviceFilter !== 'all' || riskFilter !== 'all' || dateRange.start || dateRange.end
              ? 'No sessions match your filter criteria.'
              : 'No session history found.'
            }
          </p>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-sm text-gray-900">{selectedSession.userName} ({selectedSession.userEmail})</p>
                    <p className="text-xs text-gray-500">{selectedSession.userRole}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                    <p className="text-sm text-gray-900">{selectedSession.deviceName}</p>
                    <p className="text-xs text-gray-500">{selectedSession.browser} on {selectedSession.operatingSystem}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-sm text-gray-900">{selectedSession.location}, {selectedSession.country}</p>
                    <p className="text-xs text-gray-500">IP: {selectedSession.ipAddress}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedSession.sessionId}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login Time</label>
                    <p className="text-sm text-gray-900">{new Date(selectedSession.loginTime).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Activity</label>
                    <p className="text-sm text-gray-900">{new Date(selectedSession.lastActivity).toLocaleString()}</p>
                  </div>
                  
                  {selectedSession.logoutTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logout Time</label>
                      <p className="text-sm text-gray-900">{new Date(selectedSession.logoutTime).toLocaleString()}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <p className="text-sm text-gray-900">{formatDuration(selectedSession.sessionDuration)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Security</label>
                    <div className="flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                        {selectedSession.status.charAt(0).toUpperCase() + selectedSession.status.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRiskColor(selectedSession.riskScore)}`}>
                        {selectedSession.riskScore.charAt(0).toUpperCase() + selectedSession.riskScore.slice(1)} Risk
                      </span>
                      {selectedSession.mfaUsed && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3 mr-1" />
                          MFA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded break-all">
                  {selectedSession.userAgent}
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionHistory;




















