import React, { useState } from 'react';
import { 
  Users, Calendar, FileText, TrendingUp, 
  UserPlus, Award, BookOpen, BarChart3, Bell,
  CheckCircle, AlertCircle, Clock as ClockIcon,
  ListTodo, Zap, DollarSign, RefreshCw
} from 'lucide-react';
import { useHRDashboardData } from '../../hooks/useHRDashboardData';

// import PayrollCompensation from './PayrollCompensation';

const HRDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Data fetching with RBAC filtering - uses hook
  const {
    hrMetrics,
    loading,
    error,
    refreshData
  } = useHRDashboardData();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Key Metrics */}
      {!loading && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{hrMetrics.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">{hrMetrics.activeEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Hires</p>
              <p className="text-2xl font-bold text-gray-900">{hrMetrics.newHires}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{hrMetrics.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Quick Actions */}
      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-blue-900 font-medium">Manage Staff</span>
              </button>

            <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <ClockIcon className="w-5 h-5 text-green-600" />
                <span className="text-green-900 font-medium">Attendance</span>
              </button>

            <button className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-900 font-medium">Leave Requests</span>
              </button>

            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span className="text-purple-900 font-medium">Payroll</span>
              </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">John Doe completed attendance for today</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New leave request from Jane Smith</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Payroll processed for current period</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Performance review due for Mike Johnson</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );

  // const renderPayroll = () => (
  //   <PayrollCompensation />
  // );

  return (
    <div className="hr-dashboard">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Dashboard</h1>
            <p className="text-gray-600">Human resources management and analytics</p>
          </div>
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          {/* <button
              onClick={() => setActiveTab('payroll')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payroll'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payroll & Compensation
            </button> */}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && renderOverview()}
        {/* {activeTab === 'payroll' && renderPayroll()} */}
      </div>
    </div>
  );
};

export default HRDashboard;






























