import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, Eye, Filter, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
    return Math.ceil((e.getTime() - s.getTime()) / msPerDay) + 1;
  };

  useEffect(() => {
    loadLeaveRequests();
  }, [selectedMonth]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, position')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Create staff lookup map
      const staffMap = new Map();
      const staffList: { id: string; name: string }[] = [];

      staffData?.forEach(staff => {
        const name = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
        staffMap.set(staff.id, {
          name,
          position: staff.position || 'Unknown'
        });
        staffList.push({ id: staff.id, name });
      });

      setStaffById(staffMap);
      setStaffOptions(staffList);

      // Load leave requests for selected month
      const startOfMonth = new Date(selectedMonth + '-01');
      const endOfMonth = new Date(selectedMonth + '-01');
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);

      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .gte('start_date', startOfMonth.toISOString().split('T')[0])
        .lte('end_date', endOfMonth.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (leaveError) throw leaveError;

      setLeaveRequests(leaveData || []);

    } catch (err: any) {
      console.error('Error loading leave requests:', err);
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!newReq.staff_id || !newReq.start_date || !newReq.end_date) {
        alert('Please fill in all required fields');
        return;
      }

      const daysRequested = computeDays(newReq.start_date, newReq.end_date);
      
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          staff_id: newReq.staff_id,
          leave_type: newReq.leave_type,
          start_date: newReq.start_date,
          end_date: newReq.end_date,
          days_requested: daysRequested,
          reason: newReq.reason,
          emergency_contact: newReq.emergency_contact,
          status: 'pending'
        });

      if (error) throw error;

      // Reset form and reload data
      setNewReq({
        staff_id: '',
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
        emergency_contact: ''
      });
      setShowNewModal(false);
      loadLeaveRequests();

    } catch (err: any) {
      console.error('Error creating leave request:', err);
      alert(err.message || 'Failed to create leave request');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;
      loadLeaveRequests();

    } catch (err: any) {
      console.error('Error approving leave request:', err);
      alert(err.message || 'Failed to approve leave request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      loadLeaveRequests();

    } catch (err: any) {
      console.error('Error rejecting leave request:', err);
      alert(err.message || 'Failed to reject leave request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredRequests = useMemo(() => {
    if (selectedTab === 'all') return leaveRequests;
    return leaveRequests.filter(request => request.status === selectedTab);
  }, [leaveRequests, selectedTab]);

  const getSummaryStats = () => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;

    return { total, pending, approved, rejected };
  };

  const stats = getSummaryStats();

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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Leave Requests</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadLeaveRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="leave-request">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Request Management</h1>
          <p className="text-gray-600">Manage staff leave requests and approvals</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {['all', 'pending', 'approved', 'rejected'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedTab === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
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
                    Staff Member
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
                    Reason
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
                {filteredRequests.map((request) => {
                  const staff = staffById.get(request.staff_id);
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {staff?.name || 'Unknown Staff'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {staff?.position || 'Unknown Position'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(request.leave_type)}`}>
                          {request.leave_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.days_requested} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.reason || 'No reason provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(request.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
            <p className="text-gray-500">
              {selectedTab === 'all' 
                ? 'No leave requests found for the selected month.'
                : `No ${selectedTab} leave requests found.`
              }
            </p>
          </div>
        )}

        {/* New Request Modal */}
        {showNewModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Leave Request</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                    <select
                      value={newReq.staff_id}
                      onChange={(e) => setNewReq({ ...newReq, staff_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Staff Member</option>
                      {staffOptions.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                    <select
                      value={newReq.leave_type}
                      onChange={(e) => setNewReq({ ...newReq, leave_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="annual">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="personal">Personal Leave</option>
                      <option value="emergency">Emergency Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newReq.start_date}
                        onChange={(e) => setNewReq({ ...newReq, start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={newReq.end_date}
                        onChange={(e) => setNewReq({ ...newReq, end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea
                      value={newReq.reason}
                      onChange={(e) => setNewReq({ ...newReq, reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reason for leave..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={newReq.emergency_contact}
                      onChange={(e) => setNewReq({ ...newReq, emergency_contact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Emergency contact information"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRequest}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default LeaveRequest;






























