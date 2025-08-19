import React, { useState } from 'react';
import { Users, Clock, TrendingUp, TrendingDown, Activity, BarChart3, PieChart, Download, Calendar, Filter, Eye, FileText, UserCheck, Award } from 'lucide-react';

const StaffActivityReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const reportTypes = [
    {
      title: 'Staff Performance Report',
      description: 'Individual and team performance metrics',
      icon: Award,
      color: 'bg-blue-600',
      lastGenerated: '2024-01-15',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'Attendance Summary',
      description: 'Attendance patterns and punctuality analysis',
      icon: UserCheck,
      color: 'bg-green-600',
      lastGenerated: '2024-01-15',
      frequency: 'Weekly',
      status: 'Available'
    },
    {
      title: 'Productivity Analysis',
      description: 'Work output and efficiency measurements',
      icon: TrendingUp,
      color: 'bg-purple-600',
      lastGenerated: '2024-01-14',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'Working Hours Report',
      description: 'Regular hours, overtime, and time tracking',
      icon: Clock,
      color: 'bg-orange-600',
      lastGenerated: '2024-01-13',
      frequency: 'Bi-weekly',
      status: 'Available'
    },
    {
      title: 'Department Activity',
      description: 'Department-wise performance comparison',
      icon: Users,
      color: 'bg-indigo-600',
      lastGenerated: '2024-01-12',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'Task Completion Report',
      description: 'Task assignments and completion rates',
      icon: Activity,
      color: 'bg-red-600',
      lastGenerated: '2024-01-11',
      frequency: 'Weekly',
      status: 'Available'
    }
  ];

  const staffMetrics = [
    {
      title: 'Total Staff',
      value: '21',
      change: '+2',
      isPositive: true,
      period: 'Active Employees'
    },
    {
      title: 'Average Attendance',
      value: '94.2%',
      change: '+2.1%',
      isPositive: true,
      period: 'Monthly Rate'
    },
    {
      title: 'Productivity Score',
      value: '87.5%',
      change: '+5.3%',
      isPositive: true,
      period: 'Team Average'
    },
    {
      title: 'Overtime Hours',
      value: '156h',
      change: '-12h',
      isPositive: true,
      period: 'This Month'
    }
  ];

  const departmentPerformance = [
    {
      department: 'Operations',
      staff: 8,
      attendance: 96.5,
      productivity: 92.1,
      avgHours: 42.5,
      trend: '+3.2%',
      color: 'bg-blue-500'
    },
    {
      department: 'Sales',
      staff: 6,
      attendance: 94.8,
      productivity: 89.7,
      avgHours: 41.2,
      trend: '+5.1%',
      color: 'bg-green-500'
    },
    {
      department: 'Veterinary',
      staff: 4,
      attendance: 91.2,
      productivity: 85.3,
      avgHours: 44.8,
      trend: '+1.8%',
      color: 'bg-red-500'
    },
    {
      department: 'Warehouse',
      staff: 3,
      attendance: 97.1,
      productivity: 88.9,
      avgHours: 40.5,
      trend: '+2.7%',
      color: 'bg-orange-500'
    }
  ];

  const topPerformers = [
    {
      name: 'Maria Santos',
      department: 'Operations',
      role: 'Store Manager',
      productivity: 98.5,
      attendance: 100,
      tasksCompleted: 45,
      rating: 'Excellent'
    },
    {
      name: 'Juan Dela Cruz',
      department: 'Veterinary',
      role: 'Veterinarian',
      productivity: 95.2,
      attendance: 96.8,
      tasksCompleted: 38,
      rating: 'Excellent'
    },
    {
      name: 'Ana Rodriguez',
      department: 'Sales',
      role: 'Sales Associate',
      productivity: 92.8,
      attendance: 98.4,
      tasksCompleted: 42,
      rating: 'Very Good'
    },
    {
      name: 'Carlos Martinez',
      department: 'Warehouse',
      role: 'Inventory Clerk',
      productivity: 90.1,
      attendance: 94.2,
      tasksCompleted: 35,
      rating: 'Very Good'
    },
    {
      name: 'Lisa Chen',
      department: 'Sales',
      role: 'Cashier',
      productivity: 88.7,
      attendance: 97.6,
      tasksCompleted: 40,
      rating: 'Good'
    }
  ];

  const weeklyActivity = [
    { day: 'Monday', attendance: 95.2, productivity: 88.5, avgHours: 8.2 },
    { day: 'Tuesday', attendance: 96.8, productivity: 91.2, avgHours: 8.5 },
    { day: 'Wednesday', attendance: 94.1, productivity: 89.7, avgHours: 8.1 },
    { day: 'Thursday', attendance: 97.3, productivity: 92.8, avgHours: 8.7 },
    { day: 'Friday', attendance: 93.5, productivity: 87.3, avgHours: 8.0 },
    { day: 'Saturday', attendance: 89.7, productivity: 85.1, avgHours: 7.5 }
  ];

  const recentReports = [
    {
      name: 'Monthly Staff Performance - January 2024',
      type: 'Performance',
      generatedDate: '2024-01-15',
      size: '2.1 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Weekly Attendance Summary',
      type: 'Attendance',
      generatedDate: '2024-01-14',
      size: '1.3 MB',
      format: 'Excel',
      status: 'Completed'
    },
    {
      name: 'Department Productivity Analysis',
      type: 'Productivity',
      generatedDate: '2024-01-13',
      size: '1.8 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Overtime Hours Report',
      type: 'Hours',
      generatedDate: '2024-01-12',
      size: '956 KB',
      format: 'Excel',
      status: 'Completed'
    }
  ];

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Very Good': return 'bg-blue-100 text-blue-800';
      case 'Good': return 'bg-orange-100 text-orange-800';
      case 'Needs Improvement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff Activity Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive staff performance and activity analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Schedule Report</span>
          </button>
        </div>
      </div>

      {/* Staff Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {staffMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="flex items-center space-x-1">
                {metric.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</h3>
              <p className="text-gray-500 text-xs mt-1">{metric.period}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Available Reports</h3>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${report.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {report.status}
                  </span>
                </div>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h4>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium">{report.frequency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Generated:</span>
                    <span className="font-medium">{report.lastGenerated}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Generate</span>
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Performance and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Department Performance</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {departmentPerformance.map((dept, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{dept.department}</h4>
                      <p className="text-xs text-gray-500">{dept.staff} staff members</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">{dept.trend}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Attendance</p>
                    <p className="font-medium">{dept.attendance}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Productivity</p>
                    <p className="font-medium">{dept.productivity}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Hours</p>
                    <p className="font-medium">{dept.avgHours}h</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                    <p className="text-xs text-gray-500">{performer.role} • {performer.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(performer.rating)}`}>
                    {performer.rating}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {performer.productivity}% • {performer.tasksCompleted} tasks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Activity Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Weekly Activity Trends</h3>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productivity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {weeklyActivity.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{day.day}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{day.attendance}%</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{day.productivity}%</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{day.avgHours}h</td>
                  <td className="px-4 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${day.productivity}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent Reports</h3>
          <FileText className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentReports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.generatedDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.size}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.format}</td>
                  <td className="px-4 py-3">
                    <button className="text-green-600 hover:text-green-700 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
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

export default StaffActivityReports;