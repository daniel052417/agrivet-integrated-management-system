import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, 
  MapPin, Camera, QrCode, Download, Filter, Search, Eye, Edit,
  BarChart3, PieChart, Activity, Zap, Bell, Settings, RefreshCw,
  LogIn, LogOut, X, Check, XCircle, Edit3, Save, UserCheck, FileText,
  TrendingDown, Hash, PlayCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAttendanceDashboardData } from '../../hooks/useAttendanceDashboardData';
interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  branch_id: string;
  branch_name: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  is_late: boolean;
  late_minutes: number | null;
  notes: string | null;
  location: string | null;
  check_in_method: 'manual' | 'pin' | 'qr' | 'biometric';
  corrected_by: string | null;
  correction_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffSummary {
  staff_id: string;
  staff_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  total_hours: number;
  overtime_hours: number;
  allowance_eligible_days: number;
}

interface AttendanceStats {
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  averageHours: number;
  totalOvertime: number;
  attendanceRate: number;
}

const AttendanceDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'summary'>('daily');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [checkInPin, setCheckInPin] = useState('');
  const [checkInMethod, setCheckInMethod] = useState<'manual' | 'pin'>('manual');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [correctionData, setCorrectionData] = useState({
    time_in: '',
    time_out: '',
    status: 'present' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    reason: ''
  });

  // Data fetching with RBAC filtering - uses hook
  const {
    attendanceRecords,
    staffSummaries,
    stats,
    branches,
    staffList,
    hrSettings,
    loading,
    error: dataError,
    refreshData,
    refreshSummary,
    loadHRSettings,
    loadInitialData
  } = useAttendanceDashboardData();

  // Combine data error and local error
  const error = dataError || localError;

  // Calculate stats from summary data when in summary view
  const computedStats = useMemo(() => {
    if (viewMode === 'summary' && staffSummaries.length > 0) {
      const totalStaff = staffSummaries.length;
      const presentDays = staffSummaries.reduce((sum, s) => sum + s.present_days, 0);
      const absentDays = staffSummaries.reduce((sum, s) => sum + s.absent_days, 0);
      const lateDays = staffSummaries.reduce((sum, s) => sum + s.late_days, 0);
      const leaveDays = staffSummaries.reduce((sum, s) => sum + s.leave_days, 0);
      const totalHours = staffSummaries.reduce((sum, s) => sum + s.total_hours, 0);
      const totalOvertime = staffSummaries.reduce((sum, s) => sum + s.overtime_hours, 0);
      const totalWorkingDays = staffSummaries.reduce((sum, s) => sum + s.total_days, 0);
      const attendanceRate = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

      return {
        totalStaff,
        presentToday: presentDays,
        absentToday: absentDays,
        lateToday: lateDays,
        onLeaveToday: leaveDays,
        averageHours: totalStaff > 0 ? totalHours / totalStaff : 0,
        totalOvertime,
        attendanceRate
      };
    }
    // Use hook stats for daily view
    return stats;
  }, [viewMode, staffSummaries, stats]);

  useEffect(() => {
    loadInitialData();
    loadHRSettings();
  }, [loadInitialData, loadHRSettings]);

  useEffect(() => {
    if (viewMode === 'daily') {
      refreshData(selectedDate);
    } else {
      refreshSummary(dateRange.start, dateRange.end);
    }
  }, [selectedDate, dateRange, viewMode, refreshData, refreshSummary]);

  const handleCheckIn = async () => {
  try {
    setLocalError(null);
    let staffId = selectedStaffId;

    // ... existing PIN validation code ...

    const now = new Date();
    const timeIn = now.toISOString();
    
    // Use HR settings for late threshold
    let isLate = false;
    let lateMinutes = 0;
    
    if (hrSettings?.auto_mark_late_employees) {
      const standardTime = new Date(now);
      standardTime.setHours(8, 0, 0, 0);
      
      // Use the threshold from settings
      const thresholdMinutes = hrSettings.late_threshold_minutes || 15;
      const minutesDiff = Math.floor((now.getTime() - standardTime.getTime()) / 60000);
      
      if (minutesDiff > thresholdMinutes) {
        isLate = true;
        lateMinutes = minutesDiff;
      }
    }

    const { error: insertError } = await supabase
      .from('attendance')
      .insert({
        staff_id: staffId,
        attendance_date: selectedDate,
        time_in: timeIn,
        status: isLate ? 'late' : 'present',
        is_late: isLate,
        late_minutes: lateMinutes,
        check_in_method: checkInMethod,
        location: 'Main Office'
      });

    if (insertError) throw insertError;

    setSuccess('Checked in successfully!');
    setShowCheckInModal(false);
    setCheckInPin('');
    setSelectedStaffId('');
    await refreshData(selectedDate);
    setTimeout(() => setSuccess(null), 3000);
  } catch (err: any) {
    console.error('Error checking in:', err);
    setLocalError(err.message || 'Failed to check in');
  }
};

  const handleCheckOut = async (recordId: string) => {
  try {
    setLocalError(null);
    const now = new Date().toISOString();

    const record = attendanceRecords.find(r => r.id === recordId);
    if (!record || !record.time_in) {
      setLocalError('No check-in time found');
      return;
    }

    const timeIn = new Date(record.time_in);
    const timeOut = new Date(now);
    const totalMinutes = Math.floor((timeOut.getTime() - timeIn.getTime()) / 60000);
    const totalHours = totalMinutes / 60;
    
    // Only calculate overtime if enabled in settings
    let overtimeHours = 0;
    if (hrSettings?.enable_overtime_tracking) {
      overtimeHours = Math.max(0, totalHours - 8);
    }

    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        time_out: now,
        total_hours: totalHours,
        overtime_hours: overtimeHours,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (updateError) throw updateError;

    setSuccess('Checked out successfully!');
    await refreshData(selectedDate);
    setTimeout(() => setSuccess(null), 3000);
  } catch (err: any) {
    console.error('Error checking out:', err);
    setLocalError(err.message || 'Failed to check out');
  }
};  

  const handleCorrectAttendance = async () => {
    try {
      setLocalError(null);
      
      if (!selectedRecord) {
        setLocalError('No record selected');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate total hours if both times provided
      let totalHours = null;
      let overtimeHours = 0;
      
      if (correctionData.time_in && correctionData.time_out) {
        const timeIn = new Date(correctionData.time_in);
        const timeOut = new Date(correctionData.time_out);
        const totalMinutes = Math.floor((timeOut.getTime() - timeIn.getTime()) / 60000);
        totalHours = totalMinutes / 60;
        overtimeHours = Math.max(0, totalHours - 8);
      }

      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          time_in: correctionData.time_in || null,
          time_out: correctionData.time_out || null,
          status: correctionData.status,
          total_hours: totalHours,
          overtime_hours: overtimeHours,
          corrected_by: user.id,
          correction_reason: correctionData.reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRecord.id);

      if (updateError) throw updateError;

      setSuccess('Attendance corrected successfully!');
      setShowCorrectionModal(false);
      setSelectedRecord(null);
      setCorrectionData({
        time_in: '',
        time_out: '',
        status: 'present',
        reason: ''
      });
      await refreshData(selectedDate);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error correcting attendance:', err);
      setLocalError(err.message || 'Failed to correct attendance');
    }
  };

  const handleExportReport = async () => {
    try {
      // Generate CSV export
      const headers = ['Date', 'Staff Name', 'Position', 'Department', 'Branch', 'Time In', 'Time Out', 'Total Hours', 'Status', 'Notes'];
      const rows = filteredRecords.map(record => [
        record.attendance_date,
        record.staff_name,
        record.position,
        record.department,
        record.branch_name,
        record.time_in ? new Date(record.time_in).toLocaleTimeString() : '-',
        record.time_out ? new Date(record.time_out).toLocaleTimeString() : '-',
        record.total_hours ? `${record.total_hours.toFixed(2)}` : '-',
        record.status,
        record.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${selectedDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setSuccess('Report exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error exporting report:', err);
      setLocalError('Failed to export report');
    }
  };

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchesSearch = record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesBranch = branchFilter === 'all' || record.branch_id === branchFilter;
      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [attendanceRecords, searchTerm, statusFilter, branchFilter]);

  const filteredSummaries = useMemo(() => {
    return staffSummaries.filter(summary => {
      const matchesSearch = summary.staff_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [staffSummaries, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'half_day':
        return 'bg-orange-100 text-orange-800';
      case 'on_leave':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'half_day':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'on_leave':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="attendance-dashboard space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track employee attendance and compute daily allowances</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCheckInModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Check In
          </button>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900">{computedStats.presentToday}</p>
              <p className="text-xs text-gray-500 mt-1">{computedStats.attendanceRate.toFixed(1)}% attendance rate</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900">{computedStats.absentToday}</p>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
              <p className="text-2xl font-bold text-gray-900">{computedStats.lateToday}</p>
              <p className="text-xs text-gray-500 mt-1">Monitor punctuality</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Overtime</p>
              <p className="text-2xl font-bold text-gray-900">{computedStats.totalOvertime.toFixed(1)}h</p>
              <p className="text-xs text-gray-500 mt-1">Extra compensation</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Summary View
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {viewMode === 'daily' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {viewMode === 'daily' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily View Table */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.staff_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.position} • {record.department}
                        </div>
                        {record.is_late && record.late_minutes && (
                          <div className="text-xs text-yellow-600 mt-1">
                            Late by {record.late_minutes} minutes
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.time_in ? new Date(record.time_in).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.time_out ? new Date(record.time_out).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : (
                          <button
                            onClick={() => handleCheckOut(record.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <LogOut className="w-4 h-4 mr-1" />
                            Check Out
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.total_hours ? `${record.total_hours.toFixed(2)}h` : '-'}
                      </div>
                      {record.overtime_hours && record.overtime_hours > 0 && (
                        <div className="text-xs text-purple-600">
                          +{record.overtime_hours.toFixed(2)}h OT
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      {record.corrected_by && (
                        <div className="text-xs text-orange-600 mt-1 flex items-center">
                          <Edit3 className="w-3 h-3 mr-1" />
                          Corrected
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500 uppercase">
                        {record.check_in_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedRecord(record);
                            setCorrectionData({
                              time_in: record.time_in || '',
                              time_out: record.time_out || '',
                              status: record.status,
                              reason: ''
                            });
                            setShowCorrectionModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="Correct Attendance"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
              <p className="text-gray-500">No attendance records found for the selected date and filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Summary View Table */}
      {viewMode === 'summary' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Attendance Summary ({dateRange.start} to {dateRange.end})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Summary used for payroll allowance computation
              {!hrSettings?.include_allowance_in_pay && (
                <span className="ml-2 text-orange-600 italic">(Allowances disabled in HR settings)</span>
              )}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowance Days
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSummaries.map((summary) => (
                  <tr key={summary.staff_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {summary.staff_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {summary.total_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {summary.present_days}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        {summary.absent_days}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {summary.late_days}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {summary.leave_days}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {summary.total_hours.toFixed(2)}h
                      {summary.overtime_hours > 0 && (
                        <div className="text-xs text-purple-600">
                          +{summary.overtime_hours.toFixed(2)}h OT
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hrSettings?.include_allowance_in_pay ? (
                        <>
                          <div className="text-sm font-bold text-green-600">
                            {summary.allowance_eligible_days} days
                          </div>
                          <div className="text-xs text-gray-500">
                            ₱{(summary.allowance_eligible_days * 100).toLocaleString()} allowance
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          Allowances disabled
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSummaries.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Summary Data</h3>
              <p className="text-gray-500">No attendance summary available for the selected date range.</p>
            </div>
          )}
        </div>
      )}

      {/* Check In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Check In</h3>
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  setCheckInPin('');
                  setSelectedStaffId('');
                  setLocalError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setCheckInMethod('manual')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                    checkInMethod === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Manual Selection
                </button>
                <button
                  onClick={() => setCheckInMethod('pin')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                    checkInMethod === 'pin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  PIN Entry
                </button>
              </div>

              {checkInMethod === 'manual' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Staff Member
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Staff --</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter PIN
                  </label>
                  <input
                    type="password"
                    value={checkInPin}
                    onChange={(e) => setCheckInPin(e.target.value)}
                    placeholder="Enter your PIN"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your 4-6 digit PIN
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  setCheckInPin('');
                  setSelectedStaffId('');
                  setLocalError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckIn}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {showCorrectionModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Correct Attendance</h3>
              <button
                onClick={() => {
                  setShowCorrectionModal(false);
                  setSelectedRecord(null);
                  setLocalError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Correcting attendance for: <strong>{selectedRecord.staff_name}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time In
                  </label>
                  <input
                    type="datetime-local"
                    value={correctionData.time_in}
                    onChange={(e) => setCorrectionData({ ...correctionData, time_in: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Out
                  </label>
                  <input
                    type="datetime-local"
                    value={correctionData.time_out}
                    onChange={(e) => setCorrectionData({ ...correctionData, time_out: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={correctionData.status}
                    onChange={(e) => setCorrectionData({ ...correctionData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correction Reason (Required)
                  </label>
                  <textarea
                    value={correctionData.reason}
                    onChange={(e) => setCorrectionData({ ...correctionData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this correction is needed..."
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCorrectionModal(false);
                  setSelectedRecord(null);
                  setLocalError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCorrectAttendance}
                disabled={!correctionData.reason.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;