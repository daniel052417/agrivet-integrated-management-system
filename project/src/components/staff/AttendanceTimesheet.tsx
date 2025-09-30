import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter, Download, Eye, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AttendanceTimesheet: React.FC = () => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('daily');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [staffById, setStaffById] = useState<Map<string, { name: string; position: string; department: string; active: boolean }>>(new Map());
  const [staffOptions, setStaffOptions] = useState<{ id: string; name: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const startOfWeek = (d: Date) => {
    const day = d.getUTCDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as start
    const res = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    res.setUTCDate(res.getUTCDate() + diff);
    return res;
  };
  const endOfWeek = (d: Date) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setUTCDate(e.getUTCDate() + 7);
    return e;
  };

  const startOfMonth = (d: Date) => {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), 1);
  };
  const endOfMonth = (d: Date) => {
    return new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate, selectedStaff, selectedDepartment, viewMode]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, position, department, is_active')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Create staff lookup map
      const staffMap = new Map();
      const staffList: { id: string; name: string }[] = [];
      const departments = new Set<string>();

      staffData?.forEach(staff => {
        const name = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
        staffMap.set(staff.id, {
          name,
          position: staff.position || 'Unknown',
          department: staff.department || 'Unknown',
          active: staff.is_active
        });
        staffList.push({ id: staff.id, name });
        departments.add(staff.department || 'Unknown');
      });

      setStaffById(staffMap);
      setStaffOptions(staffList);
      setDepartmentOptions(Array.from(departments));

      // Calculate date range based on view mode
      let startDate: Date;
      let endDate: Date;
      const baseDate = new Date(selectedDate);

      switch (viewMode) {
        case 'daily':
          startDate = new Date(baseDate);
          endDate = new Date(baseDate);
          break;
        case 'weekly':
          startDate = startOfWeek(baseDate);
          endDate = endOfWeek(baseDate);
          break;
        case 'monthly':
          startDate = startOfMonth(baseDate);
          endDate = endOfMonth(baseDate);
          break;
        default:
          startDate = new Date(baseDate);
          endDate = new Date(baseDate);
      }

      // Load attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('attendance_date', startDate.toISOString().split('T')[0])
        .lte('attendance_date', endDate.toISOString().split('T')[0])
        .order('attendance_date', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Filter records based on selected staff and department
      let filteredRecords = attendanceData || [];

      if (selectedStaff !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.staff_id === selectedStaff);
      }

      if (selectedDepartment !== 'all') {
        filteredRecords = filteredRecords.filter(record => {
          const staff = staffMap.get(record.staff_id);
          return staff && staff.department === selectedDepartment;
        });
      }

      setRecords(filteredRecords);

    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '—';
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTotalHours = (record: any) => {
    if (!record.time_in || !record.time_out) return '—';
    
    const timeIn = new Date(record.time_in);
    const timeOut = new Date(record.time_out);
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return `${diffHours.toFixed(1)}h`;
  };

  const getSummaryStats = () => {
    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate
    };
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
    <div className="attendance-timesheet">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Timesheet</h1>
          <p className="text-gray-600">Track and manage staff attendance records</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.presentCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absentCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Staff</option>
                {staffOptions.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
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
                    Date
                  </th>
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
                {records.map((record) => {
                  const staff = staffById.get(record.staff_id);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatDate(record.attendance_date)}</span>
                        </div>
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(record.time_in)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(record.time_out)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calculateTotalHours(record)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(record.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {records.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
            <p className="text-gray-500">
              No attendance records found for the selected criteria.
            </p>
          </div>
        )}
      </div>
  );
};

export default AttendanceTimesheet;










