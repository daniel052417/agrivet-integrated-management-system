import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, Users, Clock, Calendar, 
  AlertCircle, CheckCircle, Download, Filter, RefreshCw, Eye, FileText,
  Activity, Zap, Target, Award, DollarSign, MapPin, Building
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AttendanceAnalytics {
  totalStaff: number;
  averageAttendance: number;
  lateArrivals: number;
  earlyDepartures: number;
  overtimeHours: number;
  absentDays: number;
  presentDays: number;
}

interface LeaveAnalytics {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  averageProcessingTime: number;
  mostCommonLeaveType: string;
  peakLeavePeriod: string;
}

interface DepartmentStats {
  department: string;
  staffCount: number;
  averageAttendance: number;
  totalOvertime: number;
  leaveRequests: number;
}

interface TimeSeriesData {
  date: string;
  attendance: number;
  lateArrivals: number;
  overtime: number;
}

const HRAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<AttendanceAnalytics>({
    totalStaff: 0,
    averageAttendance: 0,
    lateArrivals: 0,
    earlyDepartures: 0,
    overtimeHours: 0,
    absentDays: 0,
    presentDays: 0
  });
  
  const [leaveAnalytics, setLeaveAnalytics] = useState<LeaveAnalytics>({
    totalRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    pendingRequests: 0,
    averageProcessingTime: 0,
    mostCommonLeaveType: '',
    peakLeavePeriod: ''
  });
  
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedDepartment]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, department, is_active')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Load attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          staff:staff_id (
            department
          )
        `)
        .gte('attendance_date', startDate.toISOString().slice(0, 10))
        .lte('attendance_date', endDate.toISOString().slice(0, 10));

      if (attendanceError) throw attendanceError;

      // Load leave data
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          staff:staff_id (
            department
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (leaveError) throw leaveError;

      // Calculate attendance analytics
      const totalStaff = staffData?.length || 0;
      const attendanceRecords = attendanceData || [];
      const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
      const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateArrivals = attendanceRecords.filter(r => r.status === 'late').length;
      const averageAttendance = totalStaff > 0 ? (presentDays / (presentDays + absentDays)) * 100 : 0;
      const overtimeHours = attendanceRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);

      setAttendanceAnalytics({
        totalStaff,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        lateArrivals,
        earlyDepartures: 0, // This would need additional logic
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        absentDays,
        presentDays
      });

      // Calculate leave analytics
      const leaveRequests = leaveData || [];
      const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
      const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;
      const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
      
      // Calculate average processing time
      const processedRequests = leaveRequests.filter(r => r.approved_date);
      const averageProcessingTime = processedRequests.length > 0 
        ? processedRequests.reduce((sum, r) => {
            const created = new Date(r.created_at);
            const approved = new Date(r.approved_date!);
            return sum + (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / processedRequests.length
        : 0;

      // Find most common leave type
      const leaveTypeCounts = leaveRequests.reduce((acc, r) => {
        acc[r.leave_type] = (acc[r.leave_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostCommonLeaveType = Object.entries(leaveTypeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      setLeaveAnalytics({
        totalRequests: leaveRequests.length,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
        mostCommonLeaveType,
        peakLeavePeriod: 'Q1' // This would need more complex logic
      });

      // Calculate department stats
      const departmentMap = new Map<string, DepartmentStats>();
      
      (staffData || []).forEach(staff => {
        if (!departmentMap.has(staff.department)) {
          departmentMap.set(staff.department, {
            department: staff.department,
            staffCount: 0,
            averageAttendance: 0,
            totalOvertime: 0,
            leaveRequests: 0
          });
        }
        const dept = departmentMap.get(staff.department)!;
        dept.staffCount++;
      });

      attendanceRecords.forEach(record => {
        const dept = departmentMap.get(record.staff.department);
        if (dept) {
          dept.totalOvertime += record.overtime_hours || 0;
        }
      });

      leaveRequests.forEach(leave => {
        const dept = departmentMap.get(leave.staff.department);
        if (dept) {
          dept.leaveRequests++;
        }
      });

      // Calculate average attendance per department
      departmentMap.forEach(dept => {
        const deptAttendance = attendanceRecords.filter(r => r.staff.department === dept.department);
        const deptPresent = deptAttendance.filter(r => r.status === 'present').length;
        const deptTotal = deptAttendance.length;
        dept.averageAttendance = deptTotal > 0 ? (deptPresent / deptTotal) * 100 : 0;
      });

      setDepartmentStats(Array.from(departmentMap.values()));

      // Generate time series data (simplified)
      const timeSeries: TimeSeriesData[] = [];
      for (let i = 0; i < parseInt(dateRange); i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        
        const dayAttendance = attendanceRecords.filter(r => r.attendance_date === dateStr);
        const attendance = dayAttendance.filter(r => r.status === 'present').length;
        const lateArrivals = dayAttendance.filter(r => r.status === 'late').length;
        const overtime = dayAttendance.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
        
        timeSeries.unshift({
          date: dateStr,
          attendance,
          lateArrivals,
          overtime
        });
      }
      setTimeSeriesData(timeSeries);

      // Set departments
      const uniqueDepartments = [...new Set((staffData || []).map(s => s.department).filter(Boolean))];
      setDepartments(uniqueDepartments);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: string) => {
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'attendance':
        csvContent = [
          ['Metric', 'Value'],
          ['Total Staff', attendanceAnalytics.totalStaff],
          ['Average Attendance %', attendanceAnalytics.averageAttendance],
          ['Late Arrivals', attendanceAnalytics.lateArrivals],
          ['Overtime Hours', attendanceAnalytics.overtimeHours],
          ['Present Days', attendanceAnalytics.presentDays],
          ['Absent Days', attendanceAnalytics.absentDays]
        ].map(row => row.join(',')).join('\n');
        filename = 'attendance-analytics.csv';
        break;
      
      case 'leave':
        csvContent = [
          ['Metric', 'Value'],
          ['Total Requests', leaveAnalytics.totalRequests],
          ['Approved Requests', leaveAnalytics.approvedRequests],
          ['Rejected Requests', leaveAnalytics.rejectedRequests],
          ['Pending Requests', leaveAnalytics.pendingRequests],
          ['Average Processing Time (days)', leaveAnalytics.averageProcessingTime],
          ['Most Common Leave Type', leaveAnalytics.mostCommonLeaveType]
        ].map(row => row.join(',')).join('\n');
        filename = 'leave-analytics.csv';
        break;
      
      case 'departments':
        csvContent = [
          ['Department', 'Staff Count', 'Average Attendance %', 'Total Overtime', 'Leave Requests'],
          ...departmentStats.map(dept => [
            dept.department,
            dept.staffCount,
            dept.averageAttendance.toFixed(2),
            dept.totalOvertime.toFixed(2),
            dept.leaveRequests
          ])
        ].map(row => row.join(',')).join('\n');
        filename = 'department-stats.csv';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            HR Analytics & Reports
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into attendance, leave, and workforce analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalyticsData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'attendance', label: 'Attendance', icon: Clock },
              { id: 'leave', label: 'Leave Analytics', icon: Calendar },
              { id: 'departments', label: 'Departments', icon: Building },
              { id: 'trends', label: 'Trends', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Staff</p>
                      <p className="text-3xl font-bold">{attendanceAnalytics.totalStaff}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Avg Attendance</p>
                      <p className="text-3xl font-bold">{attendanceAnalytics.averageAttendance}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Overtime Hours</p>
                      <p className="text-3xl font-bold">{attendanceAnalytics.overtimeHours}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Leave Requests</p>
                      <p className="text-3xl font-bold">{leaveAnalytics.totalRequests}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Present Days</span>
                      <span className="font-medium text-green-600">{attendanceAnalytics.presentDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Absent Days</span>
                      <span className="font-medium text-red-600">{attendanceAnalytics.absentDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Late Arrivals</span>
                      <span className="font-medium text-yellow-600">{attendanceAnalytics.lateArrivals}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Approved</span>
                      <span className="font-medium text-green-600">{leaveAnalytics.approvedRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending</span>
                      <span className="font-medium text-yellow-600">{leaveAnalytics.pendingRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rejected</span>
                      <span className="font-medium text-red-600">{leaveAnalytics.rejectedRequests}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Attendance Analytics</h3>
                <button
                  onClick={() => exportReport('attendance')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Attendance Rate</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {attendanceAnalytics.averageAttendance}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Average attendance rate over {dateRange} days
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Overtime Analysis</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {attendanceAnalytics.overtimeHours}h
                    </div>
                    <div className="text-sm text-gray-600">
                      Total overtime hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Leave Analytics</h3>
                <button
                  onClick={() => exportReport('leave')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Processing Time</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {leaveAnalytics.averageProcessingTime}
                    </div>
                    <div className="text-sm text-gray-600">
                      Average days to process
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Most Common</h4>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {leaveAnalytics.mostCommonLeaveType}
                    </div>
                    <div className="text-sm text-gray-600">
                      Leave type
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Approval Rate</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {leaveAnalytics.totalRequests > 0 
                        ? Math.round((leaveAnalytics.approvedRequests / leaveAnalytics.totalRequests) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Request approval rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Department Statistics</h3>
                <button
                  onClick={() => exportReport('departments')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Requests</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departmentStats.map((dept) => (
                      <tr key={dept.department} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {dept.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept.staffCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(dept.averageAttendance, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {dept.averageAttendance.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept.totalOvertime.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept.leaveRequests}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Trends Over Time</h3>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-4">Daily Attendance Trend</h4>
                <div className="h-64 flex items-end justify-between gap-2">
                  {timeSeriesData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="bg-blue-500 rounded-t w-full mb-2 transition-all duration-300"
                        style={{ height: `${(data.attendance / Math.max(...timeSeriesData.map(d => d.attendance))) * 200}px` }}
                      ></div>
                      <div className="text-xs text-gray-500 transform -rotate-45 origin-left">
                        {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRAnalytics;
