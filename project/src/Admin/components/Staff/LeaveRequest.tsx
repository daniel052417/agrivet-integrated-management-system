import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, Eye, Filter, Download } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const LeaveRequest: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const defaultMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [staffById, setStaffById] = useState<Map<string, { name: string; position: string }>>(new Map());
  const [staffOptions, setStaffOptions] = useState<{ id: string; name: string }[]>([]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newReq, setNewReq] = useState({
    staff_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    emergency_contact: ''
  });

  const msPerDay = 24 * 60 * 60 * 1000;
  const computeDays = (startISO: string, endISO: string) => {
    if (!startISO || !endISO) return 0;
    const s = new Date(startISO);
    const e = new Date(endISO);
    const diff = Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1;
    return Math.max(diff, 0);
  };

  const statusLabel = (s: string) => {
    if (!s) return 'Pending';
    const k = s.toLowerCase();
    return k === 'approved' ? 'Approved' : k === 'rejected' ? 'Rejected' : 'Pending';
  };

  const leaveTypeLabel = (t: string) => {
    switch ((t || '').toLowerCase()) {
      case 'annual': return 'Annual Leave';
      case 'sick': return 'Sick Leave';
      case 'personal': return 'Personal Leave';
      case 'emergency': return 'Emergency Leave';
      case 'maternity': return 'Maternity Leave';
      case 'paternity': return 'Paternity Leave';
      default: return t || 'Leave';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = new Date(`${selectedMonth}-01T00:00:00.000Z`);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const { data: rows, error: err } = await supabase
          .from('leave_requests')
          .select('id, staff_id, leave_type, start_date, end_date, days_requested, reason, status, emergency_contact, created_at, approved_date')
          .gte('start_date', start.toISOString())
          .lt('start_date', end.toISOString())
          .order('created_at', { ascending: false }) as any;
        if (err) throw err;

        const list = (rows as any[]) || [];
        setLeaveRequests(list);

        const staffIds = Array.from(new Set(list.map(r => r.staff_id).filter(Boolean)));
        if (staffIds.length) {
          const { data: staffRows, error: staffErr } = await supabase
            .from('staff')
            .select('id, first_name, last_name, position')
            .in('id', staffIds as string[]);
          if (staffErr) throw staffErr;
          const map = new Map<string, { name: string; position: string }>();
          (staffRows || []).forEach(s => map.set(s.id, { name: `${s.first_name || ''} ${s.last_name || ''}`.trim(), position: s.position || '' }));
          setStaffById(map);
        } else {
          setStaffById(new Map());
        }

        // Staff options for new request form
        const { data: staffAll, error: staffAllErr } = await supabase
          .from('staff')
          .select('id, first_name, last_name')
          .order('first_name', { ascending: true });
        if (staffAllErr) throw staffAllErr;
        setStaffOptions((staffAll || []).map(s => ({ id: s.id, name: `${s.first_name || ''} ${s.last_name || ''}`.trim() })));
      } catch (e: any) {
        console.error('Failed to load leave requests', e);
        setError('Failed to load leave requests');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'Annual Leave': return 'bg-blue-100 text-blue-800';
      case 'Sick Leave': return 'bg-red-100 text-red-800';
      case 'Personal Leave': return 'bg-purple-100 text-purple-800';
      case 'Emergency Leave': return 'bg-orange-100 text-orange-800';
      case 'Maternity Leave': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uiRows = useMemo(() => {
    return (leaveRequests || []).map(r => ({
      id: r.id,
      employeeName: staffById.get(r.staff_id)?.name || '—',
      position: staffById.get(r.staff_id)?.position || '—',
      leaveType: leaveTypeLabel(r.leave_type),
      startDate: r.start_date,
      endDate: r.end_date,
      days: Number(r.days_requested || computeDays(r.start_date, r.end_date)),
      reason: r.reason,
      status: statusLabel(r.status),
      appliedDate: (r.created_at || '').slice(0, 10),
      emergencyContact: r.emergency_contact || ''
    }));
  }, [leaveRequests, staffById]);

  const filteredRequests = uiRows.filter(request => {
    if (selectedTab === 'all') return true;
    return request.status.toLowerCase() === selectedTab;
  });

  const onApprove = async (id: string) => {
    try {
      const { error: err } = await supabase.from('leave_requests').update({ status: 'approved', approved_date: new Date().toISOString() }).eq('id', id);
      if (err) throw err;
      setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', approved_date: new Date().toISOString() } : r));
    } catch (e) {
      console.error('Approve failed', e);
      alert('Failed to approve request');
    }
  };

  const onReject = async (id: string) => {
    try {
      const { error: err } = await supabase.from('leave_requests').update({ status: 'rejected', approved_date: null }).eq('id', id);
      if (err) throw err;
      setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', approved_date: null } : r));
    } catch (e) {
      console.error('Reject failed', e);
      alert('Failed to reject request');
    }
  };

  const onApproveAll = async () => {
    try {
      const pendingIds = leaveRequests.filter(r => (r.status || 'pending') === 'pending').map(r => r.id);
      if (!pendingIds.length) return;
      const { error: err } = await supabase.from('leave_requests').update({ status: 'approved', approved_date: new Date().toISOString() }).in('id', pendingIds as string[]);
      if (err) throw err;
      setLeaveRequests(prev => prev.map(r => pendingIds.includes(r.id) ? { ...r, status: 'approved', approved_date: new Date().toISOString() } : r));
    } catch (e) {
      console.error('Bulk approve failed', e);
      alert('Failed to approve all');
    }
  };

  const onCreate = async () => {
    try {
      if (!newReq.staff_id || !newReq.start_date || !newReq.end_date || !newReq.reason) {
        alert('Please complete all required fields');
        return;
      }
      const days_requested = computeDays(newReq.start_date, newReq.end_date);
      const payload = { ...newReq, days_requested, status: 'pending' } as any;
      const { error: err } = await supabase.from('leave_requests').insert(payload);
      if (err) throw err;
      setShowNewModal(false);
      setNewReq({ staff_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '', emergency_contact: '' });
      // refresh
      const { data } = await supabase
        .from('leave_requests')
        .select('id, staff_id, leave_type, start_date, end_date, days_requested, reason, status, emergency_contact, created_at, approved_date')
        .gte('start_date', new Date(`${selectedMonth}-01T00:00:00.000Z`).toISOString())
        .lt('start_date', new Date(new Date(`${selectedMonth}-01T00:00:00.000Z`).setMonth(new Date(`${selectedMonth}-01T00:00:00.000Z`).getMonth() + 1)).toISOString()) as any;
      setLeaveRequests((data as any[]) || []);
    } catch (e) {
      console.error('Create failed', e);
      alert('Failed to create leave request');
    }
  };

  const onExport = () => {
    const headers = ['Employee', 'Position', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Applied Date', 'Emergency Contact'];
    const rows = filteredRequests.map(r => [r.employeeName, r.position, r.leaveType, r.startDate, r.endDate, r.days, (r.reason || '').replace(/\n/g, ' '), r.status, r.appliedDate, r.emergencyContact]);
    const csv = [headers, ...rows].map(cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_requests_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const leaveTypeStats = useMemo(() => {
    const map = new Map<string, { total: number; approved: number }>();
    (leaveRequests || []).forEach(r => {
      const key = leaveTypeLabel(r.leave_type);
      const prev = map.get(key) || { total: 0, approved: 0 };
      const days = Number(r.days_requested || computeDays(r.start_date, r.end_date));
      prev.total += days;
      if ((r.status || 'pending') === 'approved') prev.approved += days;
      map.set(key, prev);
    });
    const COLORS: Record<string, string> = {
      'Annual Leave': 'bg-blue-500',
      'Sick Leave': 'bg-red-500',
      'Personal Leave': 'bg-purple-500',
      'Emergency Leave': 'bg-orange-500',
      'Maternity Leave': 'bg-green-500',
      'Paternity Leave': 'bg-teal-500'
    };
    return Array.from(map.entries()).map(([type, v]) => ({ type, count: v.total || 0, used: v.approved || 0, color: COLORS[type] || 'bg-gray-500' }));
  }, [leaveRequests]);

  const summaryStats = useMemo(() => {
    const pending = (leaveRequests || []).filter(r => statusLabel(r.status) === 'Pending').length;
    const approvedThisMonth = (leaveRequests || []).filter(r => statusLabel(r.status) === 'Approved').length;
    const totalLeaveDays = (leaveRequests || []).reduce((s, r) => s + Number(r.days_requested || computeDays(r.start_date, r.end_date)), 0);
    const today = new Date();
    const onLeaveToday = (leaveRequests || []).filter(r => statusLabel(r.status) === 'Approved' && new Date(r.start_date) <= today && today <= new Date(r.end_date)).length;
    return [
      { title: 'Pending Requests', value: String(pending), color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle },
      { title: 'Approved This Month', value: String(approvedThisMonth), color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
      { title: 'Total Leave Days', value: String(totalLeaveDays), color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Calendar },
      { title: 'Staff on Leave Today', value: String(onLeaveToday), color: 'text-purple-600', bgColor: 'bg-purple-100', icon: User }
    ];
  }, [leaveRequests]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Request Management</h2>
          <p className="text-gray-600 mt-1">Manage staff leave requests and track leave balances</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onExport} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button onClick={() => setShowNewModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Leave Request</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Leave Types Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Leave Balance Overview</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {leaveTypeStats.map((leave, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-3 h-3 rounded-full ${leave.color}`}></div>
                <span className="text-sm font-medium text-gray-900">{leave.used}</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">{leave.type}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Approved days: {leave.used}</span>
                  <span>Total days: {leave.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${leave.color}`}
                    style={{ width: `${leave.count > 0 ? (leave.used / leave.count) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['all', 'pending', 'approved', 'rejected'].map((tab) => (
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
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Leave Requests ({filteredRequests.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td className="px-6 py-4" colSpan={8}>
                    <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                </tr>
              )}
              {!loading && filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                        <div className="text-sm text-gray-500">{request.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(request.leaveType)}`}>
                      {request.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{request.startDate}</div>
                      <div className="text-gray-500">to {request.endDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{request.days}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.appliedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'Pending' && (
                        <>
                          <button onClick={() => onApprove(request.id)} className="text-green-600 hover:text-green-900 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => onReject(request.id)} className="text-red-600 hover:text-red-900 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
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
          <button onClick={onApproveAll} className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Approve All Pending</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Leave Calendar</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Staff Leave Balance</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Export Leave Report</span>
          </button>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">New Leave Request</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                <select
                  value={newReq.staff_id}
                  onChange={(e) => setNewReq(v => ({ ...v, staff_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select staff</option>
                  {staffOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={newReq.leave_type}
                  onChange={(e) => setNewReq(v => ({ ...v, leave_type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                  <option value="emergency">Emergency</option>
                  <option value="maternity">Maternity</option>
                  <option value="paternity">Paternity</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={newReq.start_date} onChange={(e) => setNewReq(v => ({ ...v, start_date: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={newReq.end_date} onChange={(e) => setNewReq(v => ({ ...v, end_date: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={newReq.reason} onChange={(e) => setNewReq(v => ({ ...v, reason: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input type="text" value={newReq.emergency_contact} onChange={(e) => setNewReq(v => ({ ...v, emergency_contact: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="+63 xxx xxx xxxx" />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button onClick={() => setShowNewModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={onCreate} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequest;