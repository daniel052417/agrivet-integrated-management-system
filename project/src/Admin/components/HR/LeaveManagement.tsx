import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Plus, Eye, 
  Filter, Download, Search, Edit, Trash2, Bell, FileText, TrendingUp,
  BarChart3, PieChart, Activity, Zap, Settings, RefreshCw, UserCheck
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity' | 'study' | 'bereavement';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  approved_date: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

interface LeaveBalance {
  staff_id: string;
  staff_name: string;
  annual_leave: number;
  sick_leave: number;
  personal_leave: number;
  used_annual: number;
  used_sick: number;
  used_personal: number;
}

interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingTime: number;
  upcomingLeaves: number;
}

const LeaveManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    averageProcessingTime: 0,
    upcomingLeaves: 0
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [staffOptions, setStaffOptions] = useState<Array<{id: string, name: string}>>([]);

  // Modal states
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNotes, setApprovalNotes] = useState('');

  // New request form
  const [newRequest, setNewRequest] = useState({
    staff_id: '',
    leave_type: 'annual' as LeaveRequest['leave_type'],
    start_date: '',
    end_date: '',
    reason: '',
    emergency_contact: ''
  });

  useEffect(() => {
    loadLeaveData();
  }, [selectedStatus, selectedDepartment, selectedMonth]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      
      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, position, department, is_active')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Load leave requests
      let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data: leaveData, error: leaveError } = await query;

      if (leaveError) throw leaveError;

      // Combine staff and leave data
      const combinedData: LeaveRequest[] = (leaveData || []).map(leave => {
        const staff = (staffData || []).find(s => s.id === leave.staff_id);
        return {
          ...leave,
          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown',
          position: staff?.position || '',
          department: staff?.department || ''
        };
      });

      // Filter by department
      let filteredData = combinedData;
      if (selectedDepartment !== 'all') {
        filteredData = filteredData.filter(record => record.department === selectedDepartment);
      }

      // Filter by search term
      if (searchTerm) {
        filteredData = filteredData.filter(record => 
          record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.leave_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.reason.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setLeaveRequests(filteredData);

      // Calculate statistics
      const totalRequests = filteredData.length;
      const pendingRequests = filteredData.filter(r => r.status === 'pending').length;
      const approvedRequests = filteredData.filter(r => r.status === 'approved').length;
      const rejectedRequests = filteredData.filter(r => r.status === 'rejected').length;
      
      // Calculate average processing time (simplified)
      const processedRequests = filteredData.filter(r => r.approved_date);
      const averageProcessingTime = processedRequests.length > 0 
        ? processedRequests.reduce((sum, r) => {
            const created = new Date(r.created_at);
            const approved = new Date(r.approved_date!);
            return sum + (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / processedRequests.length
        : 0;

      const upcomingLeaves = filteredData.filter(r => 
        r.status === 'approved' && 
        new Date(r.start_date) > new Date() &&
        new Date(r.start_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
        upcomingLeaves
      });

      // Set departments and staff options
      const uniqueDepartments = [...new Set((staffData || []).map(s => s.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
      setStaffOptions((staffData || []).map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`
      })));

      // Calculate leave balances (simplified)
      const balances: LeaveBalance[] = (staffData || []).map(staff => {
        const staffLeaves = filteredData.filter(l => l.staff_id === staff.id);
        const usedAnnual = staffLeaves
          .filter(l => l.leave_type === 'annual' && l.status === 'approved')
          .reduce((sum, l) => sum + l.days_requested, 0);
        const usedSick = staffLeaves
          .filter(l => l.leave_type === 'sick' && l.status === 'approved')
          .reduce((sum, l) => sum + l.days_requested, 0);
        const usedPersonal = staffLeaves
          .filter(l => l.leave_type === 'personal' && l.status === 'approved')
          .reduce((sum, l) => sum + l.days_requested, 0);

        return {
          staff_id: staff.id,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          annual_leave: 21, // Default annual leave entitlement
          sick_leave: 10,   // Default sick leave entitlement
          personal_leave: 5, // Default personal leave entitlement
          used_annual: usedAnnual,
          used_sick: usedSick,
          used_personal: usedPersonal
        };
      });

      setLeaveBalances(balances);

    } catch (error) {
      console.error('Error loading leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      personal: 'Personal Leave',
      emergency: 'Emergency Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      study: 'Study Leave',
      bereavement: 'Bereavement Leave'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleNewRequest = async () => {
    try {
      const daysRequested = calculateDays(newRequest.start_date, newRequest.end_date);
      
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          staff_id: newRequest.staff_id,
          leave_type: newRequest.leave_type,
          start_date: newRequest.start_date,
          end_date: newRequest.end_date,
          days_requested: daysRequested,
          reason: newRequest.reason,
          emergency_contact: newRequest.emergency_contact,
          status: 'pending'
        });

      if (error) throw error;

      setNewRequest({
        staff_id: '',
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
        emergency_contact: ''
      });
      setShowNewRequestModal(false);
      await loadLeaveData();
    } catch (error) {
      console.error('Error creating leave request:', error);
    }
  };

  const handleApproval = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: approvalAction,
          approved_by: 'current_user', // This should be the actual user ID
          approved_date: new Date().toISOString(),
          notes: approvalNotes
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      await loadLeaveData();
    } catch (error) {
      console.error('Error updating leave request:', error);
    }
  };

  const exportLeaveData = () => {
    const csvContent = [
      ['Staff Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'],
      ...leaveRequests.map(request => [
        request.staff_name,
        request.department,
        getLeaveTypeLabel(request.leave_type),
        request.start_date,
        request.end_date,
        request.days_requested,
        request.status,
        request.reason
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-requests-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            Leave Management
          </h1>
          <p className="text-gray-600 mt-1">Manage leave requests, approvals, and staff leave balances</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLeaveData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
          <button
            onClick={exportLeaveData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Leaves</p>
              <p className="text-2xl font-bold text-purple-600">{stats.upcomingLeaves}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'requests', label: 'Leave Requests', icon: FileText },
              { id: 'balances', label: 'Leave Balances', icon: BarChart3 },
              { id: 'calendar', label: 'Leave Calendar', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'requests' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Loading leave requests...
                        </div>
                      </td>
                    </tr>
                  ) : leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No leave requests found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.staff_name}</div>
                            <div className="text-sm text-gray-500">{request.department}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getLeaveTypeLabel(request.leave_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{new Date(request.start_date).toLocaleDateString()}</div>
                          <div className="text-gray-500">to {new Date(request.end_date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.days_requested} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApprovalModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setApprovalAction('approve');
                                    setShowApprovalModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setApprovalAction('reject');
                                    setShowApprovalModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'balances' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Leave</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sick Leave</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personal Leave</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Remaining</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveBalances.map((balance) => {
                    const totalRemaining = (balance.annual_leave - balance.used_annual) + 
                                         (balance.sick_leave - balance.used_sick) + 
                                         (balance.personal_leave - balance.used_personal);
                    
                    return (
                      <tr key={balance.staff_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {balance.staff_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${((balance.annual_leave - balance.used_annual) / balance.annual_leave) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {balance.annual_leave - balance.used_annual}/{balance.annual_leave}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${((balance.sick_leave - balance.used_sick) / balance.sick_leave) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {balance.sick_leave - balance.used_sick}/{balance.sick_leave}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${((balance.personal_leave - balance.used_personal) / balance.personal_leave) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {balance.personal_leave - balance.used_personal}/{balance.personal_leave}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {totalRemaining} days
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Leave Calendar</h3>
              <p className="text-gray-500">Calendar view coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New Leave Request</h3>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
                  <select
                    value={newRequest.staff_id}
                    onChange={(e) => setNewRequest({ ...newRequest, staff_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select staff member</option>
                    {staffOptions.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                  <select
                    value={newRequest.leave_type}
                    onChange={(e) => setNewRequest({ ...newRequest, leave_type: e.target.value as LeaveRequest['leave_type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="study">Study Leave</option>
                    <option value="bereavement">Bereavement Leave</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter reason for leave..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                <input
                  type="text"
                  value={newRequest.emergency_contact}
                  onChange={(e) => setNewRequest({ ...newRequest, emergency_contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Emergency contact information"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNewRequest}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
              </h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Staff:</strong> {selectedRequest.staff_name}</p>
                  <p><strong>Leave Type:</strong> {getLeaveTypeLabel(selectedRequest.leave_type)}</p>
                  <p><strong>Dates:</strong> {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                  <p><strong>Days:</strong> {selectedRequest.days_requested}</p>
                  <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {approvalAction === 'approve' ? 'Approval' : 'Rejection'} Notes
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={`Enter ${approvalAction === 'approve' ? 'approval' : 'rejection'} notes...`}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                className={`px-4 py-2 rounded-lg text-white ${
                  approvalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
