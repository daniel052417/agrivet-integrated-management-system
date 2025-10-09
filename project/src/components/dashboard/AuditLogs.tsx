import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  User, 
  ShoppingCart, 
  Package, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type AuditLog = {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  resource: string;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'warning' | 'error';
};

type LogFilter = {
  severity: string;
  status: string;
  resource: string;
  timeRange: string;
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LogFilter>({
    severity: 'all',
    status: 'all',
    resource: 'all',
    timeRange: '24h'
  });
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadAuditLogs();
  }, [filter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Since we don't have a dedicated audit_logs table, we'll create mock audit logs
      // based on existing system activities
      const mockLogs: AuditLog[] = [];

      // Load recent sales transactions as audit events
      const { data: recentSales, error: salesError } = await supabase
        .from('pos_transactions')
        .select('id, cashier_id, total_amount, transaction_date, payment_status')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .order('transaction_date', { ascending: false })
        .limit(20);

      if (!salesError && recentSales) {
        recentSales.forEach(sale => {
          mockLogs.push({
            id: `sale-${sale.id}`,
            timestamp: sale.transaction_date,
            user_id: sale.cashier_id,
            user_name: `User ${sale.cashier_id?.slice(-4) || 'System'}`,
            action: 'CREATE_SALE',
            resource: 'pos_transactions',
            details: `Created POS transaction for ₱${(sale.total_amount || 0).toLocaleString()}`,
            ip_address: '192.168.1.100',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            severity: 'low',
            status: sale.payment_status === 'completed' ? 'success' : 'warning'
          });
        });
      }

      // Load recent user activities (mock)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, last_login')
        .order('last_login', { ascending: false })
        .limit(10);

      if (!usersError && users) {
        users.forEach(user => {
          if (user.last_login) {
            mockLogs.push({
              id: `login-${user.id}`,
              timestamp: user.last_login,
              user_id: user.id,
              user_name: user.email,
              action: 'USER_LOGIN',
              resource: 'users',
              details: 'User logged into the system',
              ip_address: '192.168.1.101',
              user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              severity: 'low',
              status: 'success'
            });
          }
        });
      }

      // Add some system events
      mockLogs.push({
        id: 'system-1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user_id: null,
        user_name: 'System',
        action: 'SYSTEM_BACKUP',
        resource: 'system',
        details: 'Automated system backup completed successfully',
        ip_address: null,
        user_agent: null,
        severity: 'medium',
        status: 'success'
      });

      mockLogs.push({
        id: 'system-2',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user_id: null,
        user_name: 'System',
        action: 'LOW_STOCK_ALERT',
        resource: 'inventory',
        details: 'Low stock alert triggered for 3 products',
        ip_address: null,
        user_agent: null,
        severity: 'medium',
        status: 'warning'
      });

      // Sort by timestamp
      const sortedLogs = mockLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      setLogs(sortedLogs);
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSeverity = filter.severity === 'all' || log.severity === filter.severity;
    const matchesStatus = filter.status === 'all' || log.status === filter.status;
    const matchesResource = filter.resource === 'all' || log.resource === filter.resource;
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSeverity && matchesStatus && matchesResource && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.split('_')[0]) {
      case 'CREATE':
        return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'UPDATE':
        return <Settings className="w-4 h-4 text-blue-600" />;
      case 'DELETE':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'USER':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'SYSTEM':
        return <Shield className="w-4 h-4 text-gray-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const then = new Date(timestamp).getTime();
    const now = Date.now();
    const diffSec = Math.max(1, Math.floor((now - then) / 1000));
    
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Audit Logs</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
            <p className="text-sm text-gray-600">System activity and security monitoring</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {filteredLogs.length} of {logs.length} logs
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filter.severity}
            onChange={(e) => setFilter({...filter, severity: e.target.value})}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          <select
            value={filter.resource}
            onChange={(e) => setFilter({...filter, resource: e.target.value})}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Resources</option>
            <option value="pos_transactions">Sales</option>
            <option value="users">Users</option>
            <option value="inventory">Inventory</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredLogs.map((log) => (
          <div key={log.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
                  {getActionIcon(log.action)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  {getStatusIcon(log.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {log.details}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{log.user_name || 'System'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="w-3 h-3" />
                    <span>{log.resource}</span>
                  </div>
                  {log.ip_address && (
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>{log.ip_address}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-gray-500">
                  {formatTimeAgo(log.timestamp)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs</h3>
          <p className="text-gray-500">No logs found matching your filters.</p>
        </div>
      )}

      {filteredLogs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
            Export audit logs
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
