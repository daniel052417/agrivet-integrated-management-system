import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter, Download, Eye, Edit, RefreshCw } from 'lucide-react';
import { useAttendanceTimesheetData } from '../../hooks/useAttendanceTimesheetData';

const AttendanceTimesheet: React.FC = () => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('daily');

  // Data fetching with RBAC filtering - uses hook
  const {
    staffById: hookStaffById,
    staffOptions: hookStaffOptions,
    departmentOptions: hookDepartmentOptions,
    records: hookRecords,
    loading: hookLoading,
    error: hookError,
    refreshData
  } = useAttendanceTimesheetData();

  // Use hook data directly
  const staffById = hookStaffById;
  const staffOptions = hookStaffOptions;
  const departmentOptions = hookDepartmentOptions;
  const records = hookRecords;
  const loading = hookLoading;
  const error = hookError;

  const formatTime = (t?: string | null) => {
    if (!t) return '-';
    const [hh, mm] = t.split(':');
    let h = Number(hh);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h)}:${mm} ${ampm}`;
  };

  useEffect(() => {
    refreshData(selectedDate);
  }, [selectedDate, refreshData]);

  const matchesFilters = (staffId: string) => {
    if (selectedStaff !== 'all' && staffId !== selectedStaff) return false;
    if (selectedDepartment !== 'all') {
      const dep = staffById.get(staffId)?.department || '';
      if (dep !== selectedDepartment) return false;
    }
    return true;
  };

  const dailyRecords = useMemo(() => {
    const dayStr = selectedDate;
    return (records || []).filter(r => r.attendance_date?.slice(0, 10) === dayStr && matchesFilters(r.staff_id));
  }, [records, selectedDate, selectedStaff, selectedDepartment, staffById]);

  const totalActiveStaff = useMemo(() => {
    const all = Array.from(staffById.entries()).filter(([, v]) => v.active);
    if (selectedDepartment !== 'all') {
      return all.filter(([, v]) => v.department === selectedDepartment).length;
    }
    return all.length;
  }, [staffById, selectedDepartment]);

  const presentCount = useMemo(() => dailyRecords.filter(r => (r.status || 'present') === 'present').length, [dailyRecords]);
  const lateCount = useMemo(() => dailyRecords.filter(r => (r.status || '') === 'late').length, [dailyRecords]);
  const absentCount = useMemo(() => dailyRecords.filter(r => (r.status || '') === 'absent').length, [dailyRecords]);
  const totalHours = useMemo(() => dailyRecords.reduce((s, r) => s + Number(r.total_hours || 0), 0), [dailyRecords]);

  const summaryMetrics = [
    { title: 'Present Today', value: String(presentCount), total: String(totalActiveStaff), percentage: totalActiveStaff > 0 ? Math.round((presentCount / totalActiveStaff) * 100) : 0, color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
    { title: 'Late Arrivals', value: String(lateCount), total: String(totalActiveStaff), percentage: totalActiveStaff > 0 ? Math.round((lateCount / totalActiveStaff) * 100) : 0, color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle },
    { title: 'Absent', value: String(absentCount), total: String(totalActiveStaff), percentage: totalActiveStaff > 0 ? Math.round((absentCount / totalActiveStaff) * 100) : 0, color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
    { title: 'Total Hours', value: `${totalHours.toFixed(1)}h`, total: `${(totalActiveStaff * 8).toFixed(0)}h`, percentage: totalActiveStaff > 0 ? Math.min(100, Math.round((totalHours / (totalActiveStaff * 8)) * 100)) : 0, color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock }
  ];

  const weeklyStats = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00.000Z`);
    const s = startOfWeek(d);
    const days: { day: string; present: number; late: number; absent: number; total: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const cur = new Date(s);
      cur.setUTCDate(cur.getUTCDate() + i);
      const curStr = cur.toISOString().slice(0, 10);
      const rows = (records || []).filter(r => r.attendance_date?.slice(0, 10) === curStr && matchesFilters(r.staff_id));
      const present = rows.filter(r => (r.status || 'present') === 'present').length;
      const late = rows.filter(r => (r.status || '') === 'late').length;
      const absent = rows.filter(r => (r.status || '') === 'absent').length;
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][cur.getUTCDay()];
      days.push({ day: dayName, present, late, absent, total: totalActiveStaff });
    }
    return days;
  }, [records, selectedDate, selectedStaff, selectedDepartment, staffById, totalActiveStaff]);

  const tableRows = useMemo(() => {
    return dailyRecords.map(r => {
      const staff = staffById.get(r.staff_id);
      const breakMinutes = (() => {
        if (!r.break_start || !r.break_end) return null;
        const [bsH, bsM] = r.break_start.split(':').map((x: string) => Number(x));
        const [beH, beM] = r.break_end.split(':').map((x: string) => Number(x));
        const minutes = (beH * 60 + beM) - (bsH * 60 + bsM);
        return minutes;
      })();
      const breakStr = breakMinutes == null ? '-' : (breakMinutes >= 60 ? `${Math.floor(breakMinutes / 60)}h ${breakMinutes % 60}m` : `${breakMinutes}m`);
      const totalStr = `${Number(r.total_hours || 0).toFixed(1)}h`;
      const overtimeStr = `${Number(r.overtime_hours || 0).toFixed(1)}h`;
      const statusLabel = ((r.status || 'present') === 'present' ? 'Present' : (r.status || '') === 'late' ? 'Late' : (r.status || '') === 'absent' ? 'Absent' : (r.status || '').replace('_', ' '));
      return {
        id: r.id,
        name: staff?.name || '—',
        position: staff?.position || '—',
        timeIn: formatTime(r.time_in),
        timeOut: formatTime(r.time_out),
        breakTime: breakStr,
        totalHours: totalStr,
        status: statusLabel,
        overtime: overtimeStr,
        location: staff?.department || '—'
      };
    });
  }, [dailyRecords, staffById]);

  const onExport = () => {
    const headers = ['Staff Member', 'Position', 'Time In', 'Time Out', 'Break', 'Total Hours', 'Overtime', 'Status', 'Department'];
    const rows = tableRows.map(r => [r.name, r.position, r.timeIn, r.timeOut, r.breakTime, r.totalHours, r.overtime, r.status, r.location]);
    const csv = [headers, ...rows].map(cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Late': return 'bg-orange-100 text-orange-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance & Timesheet</h2>
          <p className="text-gray-600 mt-1">Track staff attendance, working hours, and time management</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
          </select>
          <button onClick={onExport} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-sm text-gray-500">of {metric.total}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{metric.title}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${metric.color.replace('text-', 'bg-')}`}
                    style={{ width: `${metric.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Staff</option>
              {staffOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              {departmentOptions.map(dep => (
                <option key={dep} value={dep}>{dep === 'all' ? 'All Departments' : dep}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Weekly Attendance Overview</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {weeklyStats.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium text-gray-700">{day.day}</div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">{day.present} Present</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-700">{day.late} Late</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-700">{day.absent} Absent</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{day.total ? `${day.present}/${day.total}` : `${day.present}`}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${day.total ? (day.present / day.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Today's Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
              {!loading && tableRows.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-sm text-gray-500">{record.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.timeIn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.timeOut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.breakTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.totalHours}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.overtime}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 transition-colors">
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
    </div>
  );
};

export default AttendanceTimesheet;