import React, { useEffect, useMemo, useState } from 'react';
import { Activity as ActivityIcon, BarChart3, Download, Search, Calendar as CalendarIcon, Eye, LogOut, XCircle, Shield, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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
  { id: 'e1', timestamp: new Date().toISOString(), user: 'John Smith', email: 'john.smith@agrivet.com', role: 'Admin', branch: 'Main', module: 'Inventory', action: 'update', details: 'Updated product SKU-1001', ip: '203.0.113.10', device: 'Chrome · Windows' },
  { id: 'e2', timestamp: new Date(Date.now() - 5*60*1000).toISOString(), user: 'Sarah Johnson', email: 'sarah.johnson@agrivet.com', role: 'Manager', branch: 'West', module: 'Sales', action: 'export', details: 'Exported daily sales CSV', ip: '203.0.113.20', device: 'Edge · Windows' },
  { id: 'e3', timestamp: new Date(Date.now() - 20*60*1000).toISOString(), user: 'Mike Davis', email: 'mike.davis@agrivet.com', role: 'Staff', branch: 'East', module: 'Inventory', action: 'view', details: 'Viewed product list', ip: '198.51.100.9', device: 'Safari · iOS' },
  { id: 'e4', timestamp: new Date(Date.now() - 60*60*1000).toISOString(), user: 'Emily Wilson', email: 'emily.wilson@agrivet.com', role: 'Staff', branch: 'South', module: 'Dashboard', action: 'login_success', details: 'Successful login', ip: '192.0.2.5', device: 'Chrome · Android' },
  { id: 'e5', timestamp: new Date(Date.now() - 2*60*60*1000).toISOString(), user: 'David Brown', email: 'david.brown@agrivet.com', role: 'Manager', branch: 'North', module: 'Reports', action: 'view', details: 'Viewed inventory report', ip: '203.0.113.42', device: 'Firefox · Linux' },
];

const MOCK_SESSIONS: SessionItem[] = [
  { id: 's1', email: 'john.smith@agrivet.com', device: 'Chrome · Windows', ip: '203.0.113.10', location: 'Quezon City, PH', startedAt: new Date(Date.now() - 3*60*60*1000).toISOString(), lastActiveAt: new Date().toISOString(), isCurrent: true },
  { id: 's2', email: 'john.smith@agrivet.com', device: 'Safari · iOS', ip: '198.51.100.9', location: 'Makati, PH', startedAt: new Date(Date.now() - 26*60*60*1000).toISOString(), lastActiveAt: new Date(Date.now() - 2*60*60*1000).toISOString() },
  { id: 's3', email: 'sarah.johnson@agrivet.com', device: 'Edge · Windows', ip: '203.0.113.20', location: 'Cebu, PH', startedAt: new Date(Date.now() - 4*60*60*1000).toISOString(), lastActiveAt: new Date(Date.now() - 15*60*1000).toISOString() },
];

const formatDate = (iso: string) => new Date(iso).toLocaleString();

const UserActivity: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | 'Admin' | 'Manager' | 'Staff'>('all');
  const [module, setModule] = useState<'all' | ActivityEvent['module']>('all');
  const [action, setAction] = useState<'all' | ActivityEvent['action']>('all');
  const [branch, setBranch] = useState<'all' | string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        // Load activity events from Supabase (table: user_activity or activity_events)
        const { data, error } = await supabase
          .from('user_activity')
          .select('id, created_at, user_email, user_name, role, branch, module, action, details, ip, device')
          .order('created_at', { ascending: false })
          .limit(500);
        if (error) throw error;
        if (!data) throw new Error('No activity');
        if (ignore) return;
        const mapped: ActivityEvent[] = (data as any[]).map(e => ({
          id: e.id,
          timestamp: e.created_at,
          user: e.user_name || e.user_email,
          email: e.user_email || '',
          role: (e.role === 'Admin' || e.role === 'Manager' || e.role === 'Staff') ? e.role : 'Staff',
          branch: e.branch || '',
          module: (['Dashboard','Inventory','Sales','Reports','Staff','Marketing','Settings'] as const).includes(e.module) ? e.module : 'Dashboard',
          action: (['login_success','login_failed','view','create','update','delete','export'] as const).includes(e.action) ? e.action : 'view',
          details: e.details || '',
          ip: e.ip || '',
          device: e.device || ''
        }));
        setEvents(mapped);
      } catch (e) {
        console.warn('Activity load failed, using mock:', e);
        if (!ignore) setEvents(MOCK_EVENTS);
      }

      try {
        // Load sessions from Supabase (table: user_sessions)
        const { data, error } = await supabase
          .from('user_sessions')
          .select('id, user_email, device, ip, location, started_at, last_active_at, is_current')
          .order('last_active_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        if (!data) throw new Error('No sessions');
        if (ignore) return;
        const mapped: SessionItem[] = (data as any[]).map(s => ({
          id: s.id,
          email: s.user_email,
          device: s.device || '',
          ip: s.ip || '',
          location: s.location || '',
          startedAt: s.started_at,
          lastActiveAt: s.last_active_at,
          isCurrent: !!s.is_current
        }));
        setSessions(mapped);
      } catch (e) {
        console.warn('Sessions load failed, using mock:', e);
        if (!ignore) setSessions(MOCK_SESSIONS);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    let r = [...events];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(e => e.user.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.details || '').toLowerCase().includes(q));
    }
    if (role !== 'all') r = r.filter(e => e.role === role);
    if (module !== 'all') r = r.filter(e => e.module === module);
    if (action !== 'all') r = r.filter(e => e.action === action);
    if (branch !== 'all') r = r.filter(e => e.branch === branch);
    if (dateFrom) r = r.filter(e => new Date(e.timestamp) >= new Date(dateFrom));
    if (dateTo) r = r.filter(e => new Date(e.timestamp) <= new Date(dateTo));
    r.sort((a,b) => (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * (sortDir === 'asc' ? 1 : -1));
    return r;
  }, [events, query, role, module, action, branch, dateFrom, dateTo, sortDir]);

  const downloadCsv = (rows: ActivityEvent[]) => {
    const header = ['Timestamp','User','Email','Role','Branch','Module','Action','Details','IP','Device'];
    const body = rows.map(e => [e.timestamp, e.user, e.email, e.role, e.branch, e.module, e.action, e.details || '', e.ip || '', e.device || '']);
    const csv = [header, ...body].map(line => line.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'activity.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const branches = Array.from(new Set(events.map(e => e.branch)));

  const counters = useMemo(() => ({
    total: filtered.length,
    logins: filtered.filter(e => e.action === 'login_success').length,
    failed: filtered.filter(e => e.action === 'login_failed').length,
    exports: filtered.filter(e => e.action === 'export').length,
  }), [filtered]);

  const charts = useMemo(() => {
    const byDay = new Map<string, Set<string>>();
    const byModule = new Map<ActivityEvent['module'], number>();
    filtered.forEach(e => {
      const d = new Date(e.timestamp); const key = d.toISOString().slice(0,10);
      if (!byDay.has(key)) byDay.set(key, new Set());
      byDay.get(key)!.add(e.email);
      byModule.set(e.module, (byModule.get(e.module) || 0) + 1);
    });
    const dayKeys = Array.from(byDay.keys()).sort();
    const dauSeries = dayKeys.map(k => ({ date: k, count: byDay.get(k)!.size }));
    const moduleSeries = Array.from(byModule.entries()).map(([mod, count]) => ({ mod, count }));
    const maxDau = dauSeries.reduce((m, p) => Math.max(m, p.count), 0) || 1;
    const maxMod = moduleSeries.reduce((m, p) => Math.max(m, p.count), 0) || 1;
    return { dauSeries, moduleSeries, maxDau, maxMod };
  }, [filtered]);

  const ChartLine: React.FC<{ data: { date: string; count: number }[]; max: number }> = ({ data, max }) => {
    const width = 400; const height = 120; const pad = 24;
    if (data.length === 0) return <div className="text-xs text-gray-400">No data</div>;
    const stepX = (width - pad*2) / Math.max(1, data.length - 1);
    const scaleY = (v: number) => height - pad - (v / max) * (height - pad*2);
    const points = data.map((d, i) => `${pad + i*stepX},${scaleY(d.count)}`).join(' ');
    return (
      <svg width={width} height={height} className="w-full h-32">
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points} />
        {data.map((d, i) => (
          <circle key={i} cx={pad + i*stepX} cy={scaleY(d.count)} r={3} fill="#10b981" />
        ))}
      </svg>
    );
  };

  const ChartBars: React.FC<{ data: { mod: ActivityEvent['module']; count: number }[]; max: number }> = ({ data, max }) => {
    const width = 400; const height = 140; const pad = 24; const barW = 24; const gap = 16;
    if (data.length === 0) return <div className="text-xs text-gray-400">No data</div>;
    const scaleY = (v: number) => (v / max) * (height - pad*2);
    return (
      <svg width={width} height={height} className="w-full h-36">
        {data.map((d, i) => {
          const h = scaleY(d.count); const x = pad + i*(barW + gap); const y = height - pad - h;
          return <rect key={d.mod} x={x} y={y} width={barW} height={h} fill="#60a5fa" rx={4} />;
        })}
      </svg>
    );
  };

  // Sessions actions with Supabase fallback
  const revokeSession = async (id: string) => {
    try {
      await supabase.from('user_sessions').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to revoke on server, removing locally:', e);
    } finally {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };
  const signOutAll = async (email: string) => {
    try {
      await supabase.from('user_sessions').delete().eq('user_email', email).neq('is_current', true);
    } catch (e) {
      console.warn('Failed to sign out others on server, applying locally:', e);
    } finally {
      setSessions(prev => prev.filter(s => !(s.email === email && !s.isCurrent)));
    }
  };

  const loginEvents = useMemo(() => filtered.filter(e => e.action === 'login_success' || e.action === 'login_failed'), [filtered]);
  const loginStats = useMemo(() => {
    const success = loginEvents.filter(e => e.action === 'login_success').length;
    const failed = loginEvents.filter(e => e.action === 'login_failed').length;
    const total = success + failed;
    const successRate = total ? Math.round((success / total) * 100) : 0;
    return { success, failed, total, successRate };
  }, [loginEvents]);

  const openEvent = (e: ActivityEvent) => {
    setSelectedEvent(e);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Activity</h1>
          <p className="text-gray-600 mt-1">Monitor user behavior, track usage, and analyze activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadCsv(filtered)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-sm text-gray-600">Total Events</p><p className="text-2xl font-bold text-gray-900">{counters.total}</p></div>
        <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-sm text-gray-600">Logins</p><p className="text-2xl font-bold text-gray-900">{counters.logins}</p></div>
        <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-sm text-gray-600">Failed Logins</p><p className="text-2xl font-bold text-gray-900">{counters.failed}</p></div>
        <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-sm text-gray-600">Exports</p><p className="text-2xl font-bold text-gray-900">{counters.exports}</p></div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search user, email, or details..." className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            <select value={role} onChange={e=>setRole(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg"><option value="all">All Roles</option><option value="Admin">Admin</option><option value="Manager">Manager</option><option value="Staff">Staff</option></select>
            <select value={module} onChange={e=>setModule(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Modules</option>
              <option>Dashboard</option><option>Inventory</option><option>Sales</option><option>Reports</option><option>Staff</option><option>Marketing</option><option>Settings</option>
            </select>
            <select value={action} onChange={e=>setAction(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Actions</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="view">View</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="export">Export</option>
            </select>
            <select value={branch} onChange={e=>setBranch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-gray-900">DAU (Unique users per day)</h3><span className="text-xs text-gray-500">Last {charts.dauSeries.length} days</span></div>
          <ChartLine data={charts.dauSeries} max={charts.maxDau} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-gray-900">Module usage</h3><span className="text-xs text-gray-500">Events by module</span></div>
          <ChartBars data={charts.moduleSeries} max={charts.maxMod} />
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Active Sessions</h3>
          <span className="text-xs text-gray-500">{sessions.length} sessions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP/Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.email}{s.isCurrent ? ' (current)' : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.device}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.ip}{s.location ? ` · ${s.location}` : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(s.startedAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(s.lastActiveAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="inline-flex items-center gap-2">
                      {!s.isCurrent && (
                        <button onClick={() => revokeSession(s.id)} className="text-red-600 hover:text-red-800" title="Revoke session"><XCircle className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => signOutAll(s.email)} className="text-gray-700 hover:text-gray-900" title="Sign out other sessions"><LogOut className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Login Tracking */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-900">Login Tracking</h3>
          </div>
          <span className="text-xs text-gray-500">{loginStats.total} attempts in range</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Successful</p>
            <p className="text-xl font-bold text-gray-900">{loginStats.success}</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Failed</p>
            <p className="text-xl font-bold text-gray-900">{loginStats.failed}</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Success Rate</p>
            <p className="text-xl font-bold text-gray-900">{loginStats.successRate}%</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Total Attempts</p>
            <p className="text-xl font-bold text-gray-900">{loginStats.total}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device/IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loginEvents.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(e.timestamp)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{e.user}</div>
                    <div className="text-xs text-gray-500">{e.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${e.action === 'login_success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {e.action === 'login_success' ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">{e.device || '—'}{e.ip ? ` · ${e.ip}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Device/IP</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEvent(e)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(e.timestamp)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{e.user}</div>
                    <div className="text-xs text-gray-500">{e.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.module}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.details || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-700">{e.device || '—'}{e.ip ? ` · ${e.ip}` : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onClick={(ev) => { ev.stopPropagation(); openEvent(e); }} className="text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1"><Eye className="w-4 h-4" /> View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <ActivityIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
            <p className="mt-1 text-sm text-gray-500">Try changing your filters or date range.</p>
          </div>
        )}
      </div>

      {/* Event Details Drawer */}
      {drawerOpen && selectedEvent && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
                <p className="text-xs text-gray-500">{formatDate(selectedEvent.timestamp)}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">User</p>
                  <p className="text-sm font-medium text-gray-900">{selectedEvent.user}</p>
                  <p className="text-xs text-gray-500">{selectedEvent.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium text-gray-900">{selectedEvent.role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Module</p>
                  <p className="text-sm font-medium text-gray-900">{selectedEvent.module}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Action</p>
                  <p className="text-sm font-medium text-gray-900">{selectedEvent.action}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="text-sm font-medium text-gray-900">{selectedEvent.branch || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Device/IP</p>
                  <p className="text-sm font-medium text-gray-900">{selectedEvent.device || '—'}{selectedEvent.ip ? ` · ${selectedEvent.ip}` : ''}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Details</p>
                <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                  {selectedEvent.details || '—'}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end">
              <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserActivity;
