import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Plus, Eye, 
  Filter, Download, Search, Edit, Trash2, Bell, FileText, TrendingUp,
  BarChart3, PieChart, Activity, Zap, Settings, RefreshCw, UserCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  applied_date: string;
  approved_by: string | null;
  approved_date: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalDaysRequested: number;
  averageDaysPerRequest: number;
}

const LeaveManagement: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalDaysRequested: 0,
    averageDaysPerRequest: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Mock data for demonstration
  const mockLeaveRequests: LeaveRequest[] = [
    {
      id: '1',
      staff_id: 'staff_001',
      staff_name: 'John Smith',
      position: 'Sales Manager',
      department: 'Sales',
      leave_type: 'annual',
      start_date: '2025-02-01',
      end_date: '2025-02-05',
      days_requested: 5,
      reason: 'Family vacation',
      status: 'pending',
      applied_date: '2025-01-10',
      approved_by: null,
      approved_date: null,
      rejection_reason: null,
      created_at: '2025-01-10T09:00:00Z'
    },
    {
      id: '2',
      staff_id: 'staff_002',
      staff_name: 'Maria Garcia',
      position: 'HR Specialist',
      department: 'Human Resources',
      leave_type: 'sick',
      start_date: '2025-01-20',
      end_date: '2025-01-22',
      days_requested: 3,
      reason: 'Flu symptoms',
      status: 'approved',
      applied_date: '2025-01-19',
      approved_by: 'manager_001',
      approved_date: '2025-01-19',
      rejection_reason: null,
      created_at: '2025-01-19T14:30:00Z'
    },
    {
      id: '3',
      staff_id: 'staff_003',
      staff_name: 'Robert Johnson',
      position: 'Accountant',
      department: 'Finance',
      leave_type: 'personal',
      start_date: '2025-01-25',
      end_date: '2025-01-25',
      days_requested: 1,
      reason: 'Personal appointment',
      status: 'approved',
      applied_date: '2025-01-20',
      approved_by: 'manager_002',
      approved_date: '2025-01-20',
      rejection_reason: null,
      created_at: '2025-01-20T10:15:00Z'
    },
    {
      id: '4',
      staff_id: 'staff_004',
      staff_name: 'Sarah Wilson',
      position: 'Marketing Coordinator',
      department: 'Marketing',
      leave_type: 'maternity',
      start_date: '2025-03-01',
      end_date: '2025-06-01',
      days_requested: 90,
      reason: 'Maternity leave',
      status: 'approved',
      applied_date: '2025-01-15',
      approved_by: 'manager_003',
      approved_date: '2025-01-15',
      rejection_reason: null,
      created_at: '2025-01-15T11:00:00Z'
    },
    {
      id: '5',
      staff_id: 'staff_005',
      staff_name: 'Michael Brown',
      position: 'IT Support',
      department: 'IT',
      leave_type: 'emergency',
      start_date: '2025-01-18',
      end_date: '2025-01-18',
      days_requested: 1,
      reason: 'Family emergency',
      status: 'approved',
      applied_date: '2025-01-18',
      approved_by: 'manager_004',
      approved_date: '2025-01-18',
      rejection_reason: null,
      created_at: '2025-01-18T08:00:00Z'
    },
    {
      id: '6',
      staff_id: 'staff_006',
      staff_name: 'Lisa Davis',
      position: 'Customer Service Rep',
      department: 'Customer Service',
      leave_type: 'annual',
      start_date: '2025-02-15',
      end_date: '2025-02-19',
      days_requested: 5,
      reason: 'Holiday trip',
      status: 'pending',
      applied_date: '2025-01-12',
      approved_by: null,
      approved_date: null,
      rejection_reason: null,
      created_at: '2025-01-12T16:45:00Z'
    },
    {
      id: '7',
      staff_id: 'staff_007',
      staff_name: 'David Lee',
      position: 'Operations Manager',
      department: 'Operations',
      leave_type: 'study',
      start_date: '2025-02-10',
      end_date: '2025-02-12',
      days_requested: 3,
      reason: 'Professional development course',
      status: 'rejected',
      applied_date: '2025-01-08',
      approved_by: 'manager_005',
      approved_date: '2025-01-09',
      rejection_reason: 'Insufficient notice period',
      created_at: '2025-01-08T13:20:00Z'
    },
    {
      id: '8',
      staff_id: 'staff_008',
      staff_name: 'Jennifer Taylor',
      position: 'Administrative Assistant',
      department: 'Administration',
      leave_type: 'bereavement',
      start_date: '2025-01-22',
      end_date: '2025-01-24',
      days_requested: 3,
      reason: 'Family bereavement',
      status: 'approved',
      applied_date: '2025-01-21',
      approved_by: 'manager_006',
      approved_date: '2025-01-21',
      rejection_reason: null,
      created_at: '2025-01-21T09:30:00Z'
    },
    {
      id: '9',
      staff_id: 'staff_009',
      staff_name: 'James Wilson',
      position: 'Sales Representative',
      department: 'Sales',
      leave_type: 'annual',
      start_date: '2025-03-15',
      end_date: '2025-03-22',
      days_requested: 6,
      reason: 'Spring break vacation',
      status: 'pending',
      applied_date: '2025-01-14',
      approved_by: null,
      approved_date: null,
      rejection_reason: null,
      created_at: '2025-01-14T15:10:00Z'
    },
    {
      id: '10',
      staff_id: 'staff_010',
      staff_name: 'Emily Chen',
      position: 'Marketing Manager',
      department: 'Marketing',
      leave_type: 'paternity',
      start_date: '2025-02-28',
      end_date: '2025-03-14',
      days_requested: 14,
      reason: 'Paternity leave',
      status: 'approved',
      applied_date: '2025-01-05',
      approved_by: 'manager_007',
      approved_date: '2025-01-05',
      rejection_reason: null,
      created_at: '2025-01-05T12:00:00Z'
    }
  ];

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data for demonstration
      setLeaveRequests(mockLeaveRequests);

      // Calculate stats from mock data
      const totalRequests = mockLeaveRequests.length;
      const pendingRequests = mockLeaveRequests.filter(r => r.status === 'pending').length;
      const approvedRequests = mockLeaveRequests.filter(r => r.status === 'approved').length;
      const rejectedRequests = mockLeaveRequests.filter(r => r.status === 'rejected').length;
      const totalDaysRequested = mockLeaveRequests.reduce((sum, r) => sum + r.days_requested, 0);
      const averageDaysPerRequest = totalRequests > 0 ? totalDaysRequested / totalRequests : 0;

      setStats({
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalDaysRequested,
        averageDaysPerRequest
      });
    } catch (err: any) {
      console.error('Error loading leave data:', err);
      setError(err.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(request => {
      const matchesSearch = request.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.leave_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leaveRequests, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-100 text-blue-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      case 'personal':
        return 'bg-purple-100 text-purple-800';
      case 'emergency':
        return 'bg-orange-100 text-orange-800';
      case 'maternity':
        return 'bg-pink-100 text-pink-800';
      case 'paternity':
        return 'bg-blue-100 text-blue-800';
      case 'study':
        return 'bg-green-100 text-green-800';
      case 'bereavement':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'approved',
          approved_by: 'current_user_id', // This should be the actual user ID
          approved_date: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      await loadLeaveData();
    } catch (err: any) {
      console.error('Error approving leave request:', err);
      setError(err.message || 'Failed to approve leave request');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          approved_by: 'current_user_id', // This should be the actual user ID
          approved_date: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      await loadLeaveData();
    } catch (err: any) {
      console.error('Error rejecting leave request:', err);
      setError(err.message || 'Failed to reject leave request');
    }
  };

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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Leave Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadLeaveData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="leave-management">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Management</h1>
          <p className="text-gray-600">Manage staff leave requests and approvals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                  <option value="emergency">Emergency</option>
                  <option value="maternity">Maternity</option>
                  <option value="paternity">Paternity</option>
                  <option value="study">Study</option>
                  <option value="bereavement">Bereavement</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search leave requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.staff_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.position} • {request.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(request.leave_type)}`}>
                        {request.leave_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {new Date(request.start_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        to {new Date(request.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.days_requested} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.applied_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReject(request.id, 'Rejected by manager')}
                              className="text-red-600 hover:text-red-900"
                            >
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

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
            <p className="text-gray-500">No leave requests found matching your filters.</p>
          </div>
        )}
      </div>
  );
};

export default LeaveManagement;

























