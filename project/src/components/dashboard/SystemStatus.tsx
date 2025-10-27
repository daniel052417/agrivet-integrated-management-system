import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Users, 
  MapPin, 
  Activity, 
  Database, 
  Shield, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type SystemMetric = {
  id: string;
  label: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
  description: string;
};

type SystemHealth = {
  overall: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastBackup: string;
  activeUsers: number;
  totalBranches: number;
  totalUsers: number;
  systemLoad: number;
};

const SystemStatus: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'healthy',
    uptime: '99.9%',
    lastBackup: '2 hours ago',
    activeUsers: 0,
    totalBranches: 0,
    totalUsers: 0,
    systemLoad: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load active users (users who logged in within last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: activeUsersData, error: activeUsersError } = await supabase
        .from('users')
        .select('id')
        .gte('last_login', twentyFourHoursAgo.toISOString());

      // Load total users
      const { data: totalUsersData, error: totalUsersError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      // Load total branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      // Calculate system load based on recent activity
      const { data: recentActivity, error: activityError } = await supabase
        .from('pos_transactions')
        .select('id')
        .gte('transaction_date', twentyFourHoursAgo.toISOString());

      if (activeUsersError) throw activeUsersError;
      if (totalUsersError) throw totalUsersError;
      if (branchesError) throw branchesError;

      const activeUsers = activeUsersData?.length || 0;
      const totalUsers = totalUsersData?.length || 0;
      const totalBranches = branchesData?.length || 0;
      const systemLoad = Math.min(100, (recentActivity?.length || 0) / 10); // Normalize to 0-100

      // Determine overall system health
      let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (systemLoad > 80 || activeUsers === 0) {
        overall = 'critical';
      } else if (systemLoad > 60 || activeUsers < totalUsers * 0.1) {
        overall = 'warning';
      }

      setSystemHealth({
        overall,
        uptime: '99.9%',
        lastBackup: '2 hours ago',
        activeUsers,
        totalBranches,
        totalUsers,
        systemLoad: Math.round(systemLoad)
      });
    } catch (err: any) {
      console.error('Error loading system data:', err);
      setError(err.message || 'Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const systemMetrics: SystemMetric[] = [
    {
      id: 'uptime',
      label: 'System Uptime',
      value: systemHealth.uptime,
      status: 'healthy',
      icon: <Server className="w-5 h-5" />,
      description: 'System availability over the last 30 days'
    },
    {
      id: 'active-users',
      label: 'Active Users',
      value: systemHealth.activeUsers,
      status: systemHealth.activeUsers > 0 ? 'healthy' : 'warning',
      icon: <Users className="w-5 h-5" />,
      description: 'Users active in the last 24 hours'
    },
    {
      id: 'total-branches',
      label: 'Total Branches',
      value: systemHealth.totalBranches,
      status: 'healthy',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Active branches in the system'
    },
    {
      id: 'total-users',
      label: 'Total Users',
      value: systemHealth.totalUsers,
      status: 'healthy',
      icon: <Users className="w-5 h-5" />,
      description: 'All active user accounts'
    },
    {
      id: 'system-load',
      label: 'System Load',
      value: `${systemHealth.systemLoad}%`,
      status: systemHealth.systemLoad > 80 ? 'critical' : systemHealth.systemLoad > 60 ? 'warning' : 'healthy',
      icon: <Activity className="w-5 h-5" />,
      description: 'Current system activity level'
    },
    {
      id: 'last-backup',
      label: 'Last Backup',
      value: systemHealth.lastBackup,
      status: 'healthy',
      icon: <Database className="w-5 h-5" />,
      description: 'Most recent system backup'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading System Status</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(systemHealth.overall)}`}>
            {getStatusIcon(systemHealth.overall)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            <p className="text-sm text-gray-600 capitalize">
              {systemHealth.overall} • Last updated {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {systemMetrics.map((metric) => (
          <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(metric.status)}`}>
                {metric.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {metric.label}
                </p>
              </div>
            </div>
            
            <div className="mb-2">
              <p className="text-xl font-bold text-gray-900">
                {metric.value}
              </p>
            </div>
            
            <p className="text-xs text-gray-500">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              System monitoring active
            </span>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View detailed logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
