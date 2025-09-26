import React, { useEffect, useMemo, useState } from 'react';
import { Activity as ActivityIcon, BarChart3, Download, Search, Calendar as CalendarIcon, Eye, LogOut, XCircle, Shield, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ActivityEvent = {
  id: string;
  timestamp: string; // ISO
  user: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  branch: string;
  module: 'Dashboard' | 'Inventory' | 'Sales' | 'Reports' | 'Staff' | 'Marketing' | 'Settings';
  action: 'login_success' | 'login_failed' | 'view' | 'create' | 'update' | 'delete' | 'export';
  details?: string;
  ip?: string;
  device?: string;
};

type SessionItem = {
  id: string;
  email: string;
  device: string;
  ip: string;
  location?: string;
  startedAt: string; // ISO
  lastActiveAt: string; // ISO
  isCurrent?: boolean;
};

const MOCK_EVENTS: ActivityEvent[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    user: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    branch: 'Main Branch',
    module: 'Dashboard',
    action: 'login_success',
    details: 'Successful login',
    ip: '192.168.1.100',
    device: 'Chrome on Windows'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    user: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Manager',
    branch: 'Branch 2',
    module: 'Inventory',
    action: 'create',
    details: 'Created new product: Widget A',
    ip: '192.168.1.101',
    device: 'Safari on Mac'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    user: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Staff',
    branch: 'Main Branch',
    module: 'Sales',
    action: 'update',
    details: 'Updated customer information',
    ip: '192.168.1.102',
    device: 'Firefox on Linux'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    user: 'Alice Brown',
    email: 'alice@example.com',
    role: 'Staff',
    branch: 'Branch 3',
    module: 'Reports',
    action: 'export',
    details: 'Exported sales report',
    ip: '192.168.1.103',
    device: 'Edge on Windows'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    user: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'Manager',
    branch: 'Main Branch',
    module: 'Staff',
    action: 'delete',
    details: 'Deleted staff member',
    ip: '192.168.1.104',
    device: 'Chrome on Android'
  }
];

const MOCK_SESSIONS: SessionItem[] = [
  {
    id: '1',
    email: 'john@example.com',
    device: 'Chrome on Windows',
    ip: '192.168.1.100',
    location: 'New York, NY',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    isCurrent: true
  },
  {
    id: '2',
    email: 'jane@example.com',
    device: 'Safari on Mac',
    ip: '192.168.1.101',
    location: 'Los Angeles, CA',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    lastActiveAt: new Date(Date.now() - 300000).toISOString(),
    isCurrent: false
  },
  {
    id: '3',
    email: 'bob@example.com',
    device: 'Firefox on Linux',
    ip: '192.168.1.102',
    location: 'Chicago, IL',
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    lastActiveAt: new Date(Date.now() - 600000).toISOString(),
    isCurrent: false
  }
];

const UserActivity: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'sessions'>('activity');

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data
      // In a real implementation, this would load from an audit_logs table
      setEvents(MOCK_EVENTS);
      setSessions(MOCK_SESSIONS);

      // Example of how to load real data:
      // const { data: eventsData, error: eventsError } = await supabase
      //   .from('audit_logs')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      // if (eventsError) throw eventsError;
      // setEvents(eventsData || []);

    } catch (err: any) {
      console.error('Error loading activity data:', err);
      setError(err.message || 'Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.details?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = moduleFilter === 'all' || event.module === moduleFilter;
      const matchesAction = actionFilter === 'all' || event.action === actionFilter;
      
      const matchesDateRange = (!dateRange.start || event.timestamp >= dateRange.start) &&
                              (!dateRange.end || event.timestamp <= dateRange.end);
      
      return matchesSearch && matchesModule && matchesAction && matchesDateRange;
    });
  }, [events, searchTerm, moduleFilter, actionFilter, dateRange]);

  const handleSessionAction = async (sessionId: string, action: string) => {
    try {
      switch (action) {
        case 'terminate':
          // This would typically call an API to terminate the session
          alert('Session terminated');
          break;
        case 'view':
          // This would show session details
          alert('Session details');
          break;
      }
    } catch (err: any) {
      console.error('Error performing session action:', err);
      alert(err.message || 'Failed to perform action');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login_success':
        return <Shield className="w-4 h-4 text-green-600" />;
      case 'login_failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'view':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'create':
        return <ActivityIcon className="w-4 h-4 text-green-600" />;
      case 'update':
        return <ActivityIcon className="w-4 h-4 text-yellow-600" />;
      case 'delete':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'export':
        return <Download className="w-4 h-4 text-purple-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login_success':
        return 'bg-green-100 text-green-800';
      case 'login_failed':
        return 'bg-red-100 text-red-800';
      case 'view':
        return 'bg-blue-100 text-blue-800';
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'export':
        return 'bg-purple-100 text-purple-800';
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

  const formatSessionDuration = (startedAt: string, lastActiveAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(lastActiveAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
  };

  const getStats = () => {
    const totalEvents = events.length;
    const loginEvents = events.filter(e => e.action === 'login_success').length;
    const failedLogins = events.filter(e => e.action === 'login_failed').length;
    const activeSessions = sessions.filter(s => s.isCurrent).length;
    
    return { totalEvents, loginEvents, failedLogins, activeSessions };
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Activity Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadActivityData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="user-activity">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Activity</h1>
          <p className="text-gray-600">Monitor user activity and active sessions</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ActivityIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful Logins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.loginEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedLogins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { id: 'activity', label: 'Activity Log', icon: ActivityIcon },
              { id: 'sessions', label: 'Active Sessions', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search activity..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                    />
                  </div>
                  
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Modules</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Sales">Sales</option>
                    <option value="Reports">Reports</option>
                    <option value="Staff">Staff</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Settings">Settings</option>
                  </select>
                  
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Actions</option>
                    <option value="login_success">Login Success</option>
                    <option value="login_failed">Login Failed</option>
                    <option value="view">View</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="export">Export</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
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

            {/* Activity Events */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Module
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP/Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTimestamp(event.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{event.user}</div>
                            <div className="text-sm text-gray-500">{event.email}</div>
                            <div className="text-xs text-gray-400">{event.role} • {event.branch}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getActionIcon(event.action)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(event.action)}`}>
                              {event.action.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.details || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>{event.ip}</div>
                            <div className="text-xs">{event.device}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEventModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
                <p className="text-gray-500">
                  {searchTerm || moduleFilter !== 'all' || actionFilter !== 'all' || dateRange.start || dateRange.end
                    ? 'No activity matches your filter criteria.'
                    : 'No activity recorded yet.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
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
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{session.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.device}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.ip}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.location || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTimestamp(session.startedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatSessionDuration(session.startedAt, session.lastActiveAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.isCurrent 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.isCurrent ? 'Active' : 'Inactive'}
                          </span>
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
                            {session.isCurrent && (
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

            {sessions.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
                <p className="text-gray-500">No active sessions found.</p>
              </div>
            )}
          </div>
        )}

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-sm text-gray-900">{selectedEvent.user} ({selectedEvent.email})</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <p className="text-sm text-gray-900">{selectedEvent.action.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                    <p className="text-sm text-gray-900">{selectedEvent.module}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                    <p className="text-sm text-gray-900">{selectedEvent.details || 'No details available'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedEvent.ip || 'Unknown'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                    <p className="text-sm text-gray-900">{selectedEvent.device || 'Unknown'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-900">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowEventModal(false)}
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

export default UserActivity;

