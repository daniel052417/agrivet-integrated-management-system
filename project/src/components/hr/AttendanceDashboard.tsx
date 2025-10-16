import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, 
  MapPin, Camera, QrCode, Download, Filter, Search, Eye, Edit,
  BarChart3, PieChart, Activity, Zap, Bell, Settings, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  totalOvertime: number;
}

const AttendanceDashboard: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageHours: 0,
    totalOvertime: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data for demonstration
  const mockAttendanceRecords: AttendanceRecord[] = [
    {
      id: '1',
      staff_id: 'staff_001',
      staff_name: 'John Smith',
      position: 'Sales Manager',
      department: 'Sales',
      attendance_date: selectedDate,
      time_in: '2025-01-15T08:00:00Z',
      time_out: '2025-01-15T17:00:00Z',
      break_start: '2025-01-15T12:00:00Z',
      break_end: '2025-01-15T13:00:00Z',
      total_hours: 8,
      overtime_hours: 0,
      status: 'present',
      notes: 'On time',
      location: 'Main Office',
      created_at: '2025-01-15T08:05:00Z'
    },
    {
      id: '2',
      staff_id: 'staff_002',
      staff_name: 'Maria Garcia',
      position: 'HR Specialist',
      department: 'Human Resources',
      attendance_date: selectedDate,
      time_in: '2025-01-15T08:15:00Z',
      time_out: '2025-01-15T17:30:00Z',
      break_start: '2025-01-15T12:00:00Z',
      break_end: '2025-01-15T13:00:00Z',
      total_hours: 8.25,
      overtime_hours: 0.25,
      status: 'late',
      notes: 'Traffic delay',
      location: 'Main Office',
      created_at: '2025-01-15T08:20:00Z'
    },
    {
      id: '3',
      staff_id: 'staff_003',
      staff_name: 'Robert Johnson',
      position: 'Accountant',
      department: 'Finance',
      attendance_date: selectedDate,
      time_in: '2025-01-15T07:45:00Z',
      time_out: '2025-01-15T16:45:00Z',
      break_start: '2025-01-15T12:00:00Z',
      break_end: '2025-01-15T13:00:00Z',
      total_hours: 8,
      overtime_hours: 0,
      status: 'present',
      notes: 'Early arrival',
      location: 'Main Office',
      created_at: '2025-01-15T07:50:00Z'
    },
    {
      id: '4',
      staff_id: 'staff_004',
      staff_name: 'Sarah Wilson',
      position: 'Marketing Coordinator',
      department: 'Marketing',
      attendance_date: selectedDate,
      time_in: null,
      time_out: null,
      break_start: null,
      break_end: null,
      total_hours: 0,
      overtime_hours: 0,
      status: 'absent',
      notes: 'Sick leave',
      location: null,
      created_at: '2025-01-15T09:00:00Z'
    },
    {
      id: '5',
      staff_id: 'staff_005',
      staff_name: 'Michael Brown',
      position: 'IT Support',
      department: 'IT',
      attendance_date: selectedDate,
      time_in: '2025-01-15T08:30:00Z',
      time_out: '2025-01-15T17:00:00Z',
      break_start: '2025-01-15T12:00:00Z',
      break_end: '2025-01-15T13:00:00Z',
      total_hours: 7.5,
      overtime_hours: 0,
      status: 'late',
      notes: 'System maintenance',
      location: 'Main Office',
      created_at: '2025-01-15T08:35:00Z'
    },
    {
      id: '6',
      staff_id: 'staff_006',
      staff_name: 'Lisa Davis',
      position: 'Customer Service Rep',
      department: 'Customer Service',
      attendance_date: selectedDate,
      time_in: '2025-01-15T08:00:00Z',
      time_out: '2025-01-15T16:00:00Z',
      break_start: '2025-01-15T12:00:00Z',
      break_end: '2025-01-15T13:00:00Z',
      total_hours: 7,
      overtime_hours: 0,
      status: 'half_day',
      notes: 'Personal appointment',
      location: 'Main Office',
      created_at: '2025-01-15T08:05:00Z'
    },
    {
      id: '7',
      staff_id: 'staff_007',
      staff_name: 'David Lee',
      position: 'Operations Manager',
      department: 'Operations',
      attendance_date: selectedDate,
      time_in: '2025-01-15T08:00:00Z',
      time_out: '2025-01-15T18:00:00Z',
      break_start: '2025-01-15T12:00:00Z',
      break_end: '2025-01-15T13:00:00Z',
      total_hours: 9,
      overtime_hours: 1,
      status: 'present',
      notes: 'Project deadline',
      location: 'Main Office',
      created_at: '2025-01-15T08:05:00Z'
    },
    {
      id: '8',
      staff_id: 'staff_008',
      staff_name: 'Jennifer Taylor',
      position: 'Administrative Assistant',
      department: 'Administration',
      attendance_date: selectedDate,
      time_in: null,
      time_out: null,
      break_start: null,
      break_end: null,
      total_hours: 0,
      overtime_hours: 0,
      status: 'on_leave',
      notes: 'Vacation leave',
      location: null,
      created_at: '2025-01-15T09:00:00Z'
    }
  ];

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data for demonstration
      setAttendanceRecords(mockAttendanceRecords);

      // Calculate stats from mock data
      const totalStaff = mockAttendanceRecords.length;
      const presentToday = mockAttendanceRecords.filter(r => r.status === 'present').length;
      const absentToday = mockAttendanceRecords.filter(r => r.status === 'absent').length;
      const lateToday = mockAttendanceRecords.filter(r => r.status === 'late').length;
      const averageHours = mockAttendanceRecords
        .filter(r => r.total_hours)
        .reduce((sum, r) => sum + (r.total_hours || 0), 0) / Math.max(presentToday, 1);
      const totalOvertime = mockAttendanceRecords
        .reduce((sum, r) => sum + (r.overtime_hours || 0), 0);

      setStats({
        totalStaff,
        presentToday,
        absentToday,
        lateToday,
        averageHours,
        totalOvertime
      });
    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchesSearch = record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceRecords, searchTerm, statusFilter]);

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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Attendance Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadAttendanceData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="attendance-dashboard">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Dashboard</h1>
          <p className="text-gray-600">Track and manage staff attendance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.presentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Late Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lateToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
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
                    Total Hours
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.time_in ? new Date(record.time_in).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.time_out ? new Date(record.time_out).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_hours ? `${record.total_hours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
            <p className="text-gray-500">No attendance records found for the selected date and filters.</p>
          </div>
        )}
      </div>
  );
};

export default AttendanceDashboard;

























