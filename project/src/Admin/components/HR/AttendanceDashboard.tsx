import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, 
  MapPin, Camera, QrCode, Download, Filter, Search, Eye, Edit,
  BarChart3, PieChart, Activity, Zap, Bell, Settings, RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  notes: string | null;
  location: string | null;
  created_at: string;
}

interface AttendanceStats {
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageHours: number;
  overtimeHours: number;
}

const AttendanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageHours: 0,
    overtimeHours: 0
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [staffOptions, setStaffOptions] = useState<Array<{id: string, name: string}>>([]);

  // Load attendance data
  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate, selectedDepartment, selectedStaff]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, position, department, is_active')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Load attendance records for selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('attendance_date', selectedDate);

      if (attendanceError) throw attendanceError;

      // Combine staff and attendance data
      const combinedData: AttendanceRecord[] = (staffData || []).map(staff => {
        const attendance = (attendanceData || []).find(att => att.staff_id === staff.id);
        return {
          id: attendance?.id || `temp-${staff.id}`,
          staff_id: staff.id,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          position: staff.position || '',
          department: staff.department || '',
          attendance_date: selectedDate,
          time_in: attendance?.time_in || null,
          time_out: attendance?.time_out || null,
          break_start: attendance?.break_start || null,
          break_end: attendance?.break_end || null,
          total_hours: attendance?.total_hours || null,
          overtime_hours: attendance?.overtime_hours || null,
          status: attendance?.status || 'absent',
          notes: attendance?.notes || null,
          location: attendance?.location || null,
          created_at: attendance?.created_at || new Date().toISOString()
        };
      });

      // Filter data based on selections
      let filteredData = combinedData;
      if (selectedDepartment !== 'all') {
        filteredData = filteredData.filter(record => record.department === selectedDepartment);
      }
      if (selectedStaff !== 'all') {
        filteredData = filteredData.filter(record => record.staff_id === selectedStaff);
      }

      setAttendanceRecords(filteredData);

      // Calculate statistics
      const totalStaff = filteredData.length;
      const presentToday = filteredData.filter(r => r.status === 'present').length;
      const absentToday = filteredData.filter(r => r.status === 'absent').length;
      const lateToday = filteredData.filter(r => r.status === 'late').length;
      const averageHours = filteredData
        .filter(r => r.total_hours)
        .reduce((sum, r) => sum + (r.total_hours || 0), 0) / 
        Math.max(presentToday, 1);
      const overtimeHours = filteredData
        .reduce((sum, r) => sum + (r.overtime_hours || 0), 0);

      setStats({
        totalStaff,
        presentToday,
        absentToday,
        lateToday,
        averageHours: Math.round(averageHours * 100) / 100,
        overtimeHours
      });

      // Set departments and staff options
      const uniqueDepartments = [...new Set((staffData || []).map(s => s.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
      setStaffOptions((staffData || []).map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`
      })));

    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Present' },
      absent: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Absent' },
      late: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Late' },
      half_day: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Half Day' },
      on_leave: { color: 'bg-purple-100 text-purple-800', icon: Calendar, label: 'On Leave' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.absent;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleClockIn = async (staffId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          staff_id: staffId,
          attendance_date: selectedDate,
          time_in: now,
          status: 'present',
          location: 'Office' // This could be enhanced with GPS
        });

      if (error) throw error;
      await loadAttendanceData();
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async (staffId: string) => {
    try {
      const now = new Date().toISOString();
      const record = attendanceRecords.find(r => r.staff_id === staffId);
      
      if (!record || !record.time_in) return;

      // Calculate total hours
      const timeIn = new Date(record.time_in);
      const timeOut = new Date(now);
      const totalMs = timeOut.getTime() - timeIn.getTime();
      const totalHours = totalMs / (1000 * 60 * 60);
      const overtimeHours = Math.max(0, totalHours - 8); // Assuming 8-hour work day

      const { error } = await supabase
        .from('attendance_records')
        .update({
          time_out: now,
          total_hours: Math.round(totalHours * 100) / 100,
          overtime_hours: Math.round(overtimeHours * 100) / 100
        })
        .eq('staff_id', staffId)
        .eq('attendance_date', selectedDate);

      if (error) throw error;
      await loadAttendanceData();
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const exportAttendance = () => {
    const csvContent = [
      ['Staff Name', 'Department', 'Position', 'Time In', 'Time Out', 'Total Hours', 'Status', 'Notes'],
      ...attendanceRecords.map(record => [
        record.staff_name,
        record.department,
        record.position,
        formatTime(record.time_in),
        formatTime(record.time_out),
        record.total_hours || '-',
        record.status,
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            Attendance Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor staff attendance, track hours, and manage time records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAttendanceData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportAttendance}
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
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent Today</p>
              <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Hours</p>
              <p className="text-2xl font-bold text-blue-600">{stats.averageHours}h</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Staff</option>
                {staffOptions.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'daily' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'weekly' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'monthly' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading attendance data...
                    </div>
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No attendance records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.staff_name}</div>
                        <div className="text-sm text-gray-500">{record.position}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.time_in)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.time_out)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_hours ? `${record.total_hours}h` : '-'}
                      {record.overtime_hours && record.overtime_hours > 0 && (
                        <span className="ml-1 text-xs text-orange-600">
                          (+{record.overtime_hours}h OT)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {!record.time_in ? (
                          <button
                            onClick={() => handleClockIn(record.staff_id)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            Clock In
                          </button>
                        ) : !record.time_out ? (
                          <button
                            onClick={() => handleClockOut(record.staff_id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            Clock Out
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
