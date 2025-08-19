import React, { useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter, Download, Eye, Edit } from 'lucide-react';

const AttendanceTimesheet: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [viewMode, setViewMode] = useState('daily');

  const attendanceData = [
    {
      id: 1,
      name: 'Maria Santos',
      position: 'Store Manager',
      timeIn: '08:00 AM',
      timeOut: '05:30 PM',
      breakTime: '1h 00m',
      totalHours: '8h 30m',
      status: 'Present',
      overtime: '0h 30m',
      location: 'Main Branch'
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      position: 'Veterinarian',
      timeIn: '09:15 AM',
      timeOut: '06:00 PM',
      breakTime: '45m',
      totalHours: '8h 00m',
      status: 'Late',
      overtime: '1h 00m',
      location: 'Main Branch'
    },
    {
      id: 3,
      name: 'Ana Rodriguez',
      position: 'Sales Associate',
      timeIn: '08:30 AM',
      timeOut: '05:00 PM',
      breakTime: '1h 15m',
      totalHours: '7h 15m',
      status: 'Present',
      overtime: '0h 00m',
      location: 'Branch 2'
    },
    {
      id: 4,
      name: 'Carlos Martinez',
      position: 'Inventory Clerk',
      timeIn: '-',
      timeOut: '-',
      breakTime: '-',
      totalHours: '0h 00m',
      status: 'Absent',
      overtime: '0h 00m',
      location: 'Warehouse'
    },
    {
      id: 5,
      name: 'Lisa Chen',
      position: 'Cashier',
      timeIn: '07:45 AM',
      timeOut: '04:45 PM',
      breakTime: '1h 00m',
      totalHours: '8h 00m',
      status: 'Present',
      overtime: '0h 00m',
      location: 'Branch 3'
    }
  ];

  const weeklyStats = [
    { day: 'Monday', present: 18, late: 2, absent: 1, total: 21 },
    { day: 'Tuesday', present: 19, late: 1, absent: 1, total: 21 },
    { day: 'Wednesday', present: 20, late: 0, absent: 1, total: 21 },
    { day: 'Thursday', present: 17, late: 3, absent: 1, total: 21 },
    { day: 'Friday', present: 19, late: 1, absent: 1, total: 21 }
  ];

  const summaryMetrics = [
    {
      title: 'Present Today',
      value: '17',
      total: '21',
      percentage: 81,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    {
      title: 'Late Arrivals',
      value: '3',
      total: '21',
      percentage: 14,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: AlertCircle
    },
    {
      title: 'Absent',
      value: '1',
      total: '21',
      percentage: 5,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: XCircle
    },
    {
      title: 'Total Hours',
      value: '136h',
      total: '168h',
      percentage: 81,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Clock
    }
  ];

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
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

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
              <option value="maria">Maria Santos</option>
              <option value="juan">Juan Dela Cruz</option>
              <option value="ana">Ana Rodriguez</option>
              <option value="carlos">Carlos Martinez</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="all">All Departments</option>
              <option value="operations">Operations</option>
              <option value="sales">Sales</option>
              <option value="veterinary">Veterinary</option>
              <option value="warehouse">Warehouse</option>
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
                <span className="text-sm font-medium text-gray-900">{day.present}/{day.total}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(day.present / day.total) * 100}%` }}
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
              {attendanceData.map((record) => (
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