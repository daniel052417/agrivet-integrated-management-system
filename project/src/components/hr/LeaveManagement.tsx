import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Plus, Eye, 
  Filter, Download, Search, Edit, Trash2, Bell, FileText, TrendingUp,
  BarChart3, PieChart, Activity, Zap, Settings, RefreshCw, UserCheck,
  Upload, Paperclip, X, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLeaveManagementData } from '../../hooks/useLeaveManagementData';

interface Staff {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  branch: string;
}

interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  employee_id: string;
  position: string;
  department: string;
  branch: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity' | 'study' | 'bereavement';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_date: string;
  applied_by: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  created_at: string;
}

const LeaveManagement: React.FC = () => {
  // Data fetching with RBAC filtering - uses hook
  const {
    leaveRequests: hookLeaveRequests,
    staffList: hookStaffList,
    loading: hookLoading,
    error: hookError,
    refreshData
  } = useLeaveManagementData();

  // Sync hook data to local state for compatibility
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLeaveRequests(hookLeaveRequests);
    setStaffList(hookStaffList);
    setLoading(hookLoading);
    if (hookError) setError(hookError);
  }, [hookLeaveRequests, hookStaffList, hookLoading, hookError]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  
  // Modal States
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    staff_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    notes: '',
    attachment: null as File | null
  });
  const [rejectionReason, setRejectionReason] = useState('');

  // Data is loaded by the hook automatically

  // Calculate days between dates
  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate days when dates change
      if (name === 'start_date' || name === 'end_date') {
        const days = calculateDays(
          name === 'start_date' ? value : prev.start_date,
          name === 'end_date' ? value : prev.end_date
        );
      }
      
      return newData;
    });
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, attachment: e.target.files![0] }));
    }
  };

  // Submit new leave request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let attachmentUrl = null;
      let attachmentName = null;

      // Upload attachment if exists
      if (formData.attachment) {
        const filePath = `${Date.now()}_${formData.attachment.name}`;
        const { data, error } = await supabase.storage
          .from('leave-attachments')
          .upload(filePath, formData.attachment);

        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('leave-attachments')
          .getPublicUrl(filePath);
        
        attachmentUrl = urlData.publicUrl;
        attachmentName = formData.attachment.name;
      }

      const days = calculateDays(formData.start_date, formData.end_date);

      const newRequest = {
        staff_id: formData.staff_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_requested: days,
        reason: formData.reason,
        notes: formData.notes,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        applied_by: 'current_user_id' // Replace with actual user ID
      };

      const { error } = await supabase
        .from('leave_requests')
        .insert([newRequest]);

      if (error) throw error;

      alert('Leave request submitted successfully!');
      setShowNewRequestModal(false);
      setFormData({
        staff_id: '',
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
        notes: '',
        attachment: null
      });
      await refreshData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Approve leave request
  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this leave request?')) return;

    try {
      const { data, error } = await supabase.rpc('approve_leave_request', {
        p_request_id: requestId,
        p_approved_by: 'current_user_id' // Replace with actual user ID
      });

      if (error) throw error;

      alert('Leave request approved! Attendance has been automatically marked.');
      await refreshData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Reject leave request
  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          approved_by: 'current_user_id',
          approved_date: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      alert('Leave request rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      await refreshData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Cancel leave request
  const handleCancel = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      alert('Leave request cancelled');
      await refreshData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Download attachment
  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (err: any) {
      alert(`Error downloading file: ${err.message}`);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(request => {
      const matchesSearch = 
        request.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.leave_type === typeFilter;
      const matchesBranch = branchFilter === 'all' || request.branch === branchFilter;
      return matchesSearch && matchesStatus && matchesType && matchesBranch;
    });
  }, [leaveRequests, searchTerm, statusFilter, typeFilter, branchFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: leaveRequests.length,
      pending: leaveRequests.filter(r => r.status === 'pending').length,
      approved: leaveRequests.filter(r => r.status === 'approved').length,
      rejected: leaveRequests.filter(r => r.status === 'rejected').length,
      totalDays: leaveRequests.reduce((sum, r) => sum + r.days_requested, 0)
    };
  }, [leaveRequests]);

  // Get unique branches
  const branches = useMemo(() => {
    return Array.from(new Set(mockStaff.map(s => s.branch)));
  }, []);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800',
      emergency: 'bg-orange-100 text-orange-800',
      maternity: 'bg-pink-100 text-pink-800',
      paternity: 'bg-blue-100 text-blue-800',
      study: 'bg-green-100 text-green-800',
      bereavement: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Leave Management</h1>
        <p className="text-sm text-gray-600">Manage staff leave requests and approvals</p>
      </div>

      {/* Leave Policy Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Leave Policy Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Leave does not affect base salary</li>
              <li>• Leave days stop daily allowance calculation</li>
              <li>• Approved leave automatically marks attendance as "on_leave"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attachment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.staff_name}</div>
                      <div className="text-sm text-gray-500">{request.employee_id}</div>
                      <div className="text-xs text-gray-400">{request.position} • {request.branch}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(request.leave_type)}`}>
                      {request.leave_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{new Date(request.start_date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">to {new Date(request.end_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {request.days_requested} days
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {request.attachment_name ? (
                      <button
                        onClick={() => handleDownloadAttachment(request.attachment_url!, request.attachment_name!)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span className="max-w-[100px] truncate">{request.attachment_name}</span>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No attachment</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleCancel(request.id)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Cancel"
                          >
                            <Trash2 className="w-5 h-5" />
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
        
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
            <p className="text-gray-500">No leave requests found matching your filters.</p>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">New Leave Request</h2>
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest}>
                <div className="space-y-4">
                  {/* Employee Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="staff_id"
                      value={formData.staff_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Employee</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.employee_id} - {staff.first_name} {staff.last_name} ({staff.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="leave_type"
                      value={formData.leave_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        min={formData.start_date}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Days Calculation Display */}
                  {formData.start_date && formData.end_date && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        <strong>Total Days:</strong> {calculateDays(formData.start_date, formData.end_date)} days
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      placeholder="Please provide a reason for this leave request..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Any additional information..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* File Attachment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachment (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formData.attachment ? formData.attachment.name : 'Upload medical certificate or document'}
                        </span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden"
                        />
                      </label>
                      {formData.attachment && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, attachment: null }))}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Leave Request Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedRequest.status)}
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getLeaveTypeColor(selectedRequest.leave_type)}`}>
                    {selectedRequest.leave_type.toUpperCase()}
                  </span>
                </div>

                {/* Employee Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Employee Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium text-gray-900">{selectedRequest.staff_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Employee ID:</span>
                      <p className="font-medium text-gray-900">{selectedRequest.employee_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Position:</span>
                      <p className="font-medium text-gray-900">{selectedRequest.position}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Department:</span>
                      <p className="font-medium text-gray-900">{selectedRequest.department}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Branch:</span>
                      <p className="font-medium text-gray-900">{selectedRequest.branch}</p>
                    </div>
                  </div>
                </div>

                {/* Leave Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Leave Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium text-gray-900">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">End Date:</span>
                      <p className="font-medium text-gray-900">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Days:</span>
                      <p className="font-medium text-gray-900">{selectedRequest.days_requested} days</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Applied Date:</span>
                      <p className="font-medium text-gray-900">{new Date(selectedRequest.applied_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reason</h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedRequest.reason}</p>
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedRequest.notes}</p>
                  </div>
                )}

                {/* Attachment */}
                {selectedRequest.attachment_name && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Attachment</h3>
                    <button
                      onClick={() => handleDownloadAttachment(selectedRequest.attachment_url!, selectedRequest.attachment_name!)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>{selectedRequest.attachment_name}</span>
                      <Download className="w-4 h-4 ml-auto" />
                    </button>
                  </div>
                )}

                {/* Approval Information */}
                {selectedRequest.status !== 'pending' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {selectedRequest.status === 'approved' ? 'Approval' : 'Rejection'} Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Processed By:</span>
                        <p className="font-medium text-gray-900">{selectedRequest.approved_by || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <p className="font-medium text-gray-900">
                          {selectedRequest.approved_date ? new Date(selectedRequest.approved_date).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      {selectedRequest.rejection_reason && (
                        <div>
                          <span className="text-gray-600">Rejection Reason:</span>
                          <p className="font-medium text-red-700 mt-1">{selectedRequest.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowRejectModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Reject Leave Request</h2>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                You are about to reject the leave request from <strong>{selectedRequest.staff_name}</strong>.
                Please provide a reason for rejection.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;