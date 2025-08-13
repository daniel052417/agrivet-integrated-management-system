import React, { useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, Eye, Edit, Filter, Download } from 'lucide-react';

const LeaveRequest: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedMonth, setSelectedMonth] = useState('2024-01');

  const leaveRequests = [
    {
      id: 1,
      employeeName: 'Maria Santos',
      position: 'Store Manager',
      leaveType: 'Annual Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      days: 3,
      reason: 'Family vacation',
      status: 'Pending',
      appliedDate: '2024-01-15',
      approver: 'Admin User',
      emergencyContact: '+63 912 345 6789'
    },
    {
      id: 2,
      employeeName: 'Juan Dela Cruz',
      position: 'Veterinarian',
      leaveType: 'Sick Leave',
      startDate: '2024-01-18',
      endDate: '2024-01-19',
      days: 2,
      reason: 'Medical appointment and recovery',
      status: 'Approved',
      appliedDate: '2024-01-16',
      approver: 'Maria Santos',
      emergencyContact: '+63 918 765 4321'
    },
    {
      id: 3,
      employeeName: 'Ana Rodriguez',
      position: 'Sales Associate',
      leaveType: 'Personal Leave',
      startDate: '2024-01-25',
      endDate: '2024-01-25',
      days: 1,
      reason: 'Personal matters',
      status: 'Rejected',
      appliedDate: '2024-01-14',
      approver: 'Maria Santos',
      emergencyContact: '+63 917 555 0123'
    },
    {
      id: 4,
      employeeName: 'Carlos Martinez',
      position: 'Inventory Clerk',
      leaveType: 'Emergency Leave',
      startDate: '2024-01-17',
      endDate: '2024-01-17',
      days: 1,
      reason: 'Family emergency',
      status: 'Approved',
      appliedDate: '2024-01-17',
      approver: 'Admin User',
      emergencyContact: '+63 915 444 7890'
    },
    {
      id: 5,
      employeeName: 'Lisa Chen',
      position: 'Cashier',
      leaveType: 'Maternity Leave',
      startDate: '2024-02-01',
      endDate: '2024-04-01',
      days: 60,
      reason: 'Maternity leave',
      status: 'Pending',
      appliedDate: '2024-01-10',
      approver: 'Admin User',
      emergencyContact: '+63 916 333 2222'
    }
  ];

  const leaveTypes = [
    { type: 'Annual Leave', count: 12, used: 5, color: 'bg-blue-500' },
    { type: 'Sick Leave', count: 8, used: 3, color: 'bg-red-500' },
    { type: 'Personal Leave', count: 5, used: 2, color: 'bg-purple-500' },
    { type: 'Emergency Leave', count: 3, used: 1, color: 'bg-orange-500' },
    { type: 'Maternity/Paternity', count: 60, used: 0, color: 'bg-green-500' }
  ];

  const summaryStats = [
    {
      title: 'Pending Requests',
      value: '8',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: AlertCircle
    },
    {
      title: 'Approved This Month',
      value: '15',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    {
      title: 'Total Leave Days',
      value: '127',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Calendar
    },
    {
      title: 'Staff on Leave Today',
      value: '3',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: User
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'Annual Leave': return 'bg-blue-100 text-blue-800';
      case 'Sick Leave': return 'bg-red-100 text-red-800';
      case 'Personal Leave': return 'bg-purple-100 text-purple-800';
      case 'Emergency Leave': return 'bg-orange-100 text-orange-800';
      case 'Maternity Leave': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (selectedTab === 'all') return true;
    return request.status.toLowerCase() === selectedTab;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Request Management</h2>
          <p className="text-gray-600 mt-1">Manage staff leave requests and track leave balances</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Leave Request</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Leave Types Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Leave Balance Overview</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {leaveTypes.map((leave, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-3 h-3 rounded-full ${leave.color}`}></div>
                <span className="text-sm font-medium text-gray-900">{leave.count - leave.used}</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">{leave.type}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Used: {leave.used}</span>
                  <span>Total: {leave.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${leave.color}`}
                    style={{ width: `${(leave.used / leave.count) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Leave Requests ({filteredRequests.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                        <div className="text-sm text-gray-500">{request.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(request.leaveType)}`}>
                      {request.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{request.startDate}</div>
                      <div className="text-gray-500">to {request.endDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{request.days}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.appliedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'Pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 transition-colors">
                            <XCircle className="w-4 h-4" />
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
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Approve All Pending</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Leave Calendar</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Staff Leave Balance</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Export Leave Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;