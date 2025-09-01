import React, { useState } from 'react';
import { 
  Users, Clock, Calendar, FileText, Shield, TrendingUp, 
  UserPlus, Award, BookOpen, Settings, BarChart3, Bell,
  CheckCircle, AlertCircle, Clock as ClockIcon, UserCheck,
  ListTodo, Target, GraduationCap, Zap, DollarSign
} from 'lucide-react';
import EnhancedEmployeeProfiles from './EnhancedEmployeeProfiles';
import PerformanceManagement from './PerformanceManagement';
import PayrollCompensation from './PayrollCompensation';

interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  pendingApprovals: number;
  averageAttendance: number;
  leaveRequests: number;
}

const HRDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with actual data from your database
  const hrMetrics: HRMetrics = {
    totalEmployees: 24,
    activeEmployees: 22,
    newHires: 3,
    pendingApprovals: 8,
    averageAttendance: 94.2,
    leaveRequests: 5
  };

  const quickActions = [
    {
      title: 'Add New Employee',
      description: 'Onboard new staff member',
      icon: UserPlus,
      color: 'bg-blue-500',
      action: () => console.log('Add employee')
    },
    {
      title: 'Leave Requests',
      description: 'Review pending leave applications',
      icon: Calendar,
      color: 'bg-green-500',
      action: () => console.log('Leave requests')
    },
    {
      title: 'Attendance Report',
      description: 'View attendance analytics',
      icon: ClockIcon,
      color: 'bg-purple-500',
      action: () => console.log('Attendance report')
    },
    {
      title: 'Performance Review',
      description: 'Schedule performance evaluations',
      icon: Award,
      color: 'bg-orange-500',
      action: () => console.log('Performance review')
    }
  ];

  const recentActivities = [
    {
      type: 'new_hire',
      message: 'John Doe completed onboarding',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      type: 'leave_request',
      message: 'Jane Smith requested annual leave',
      time: '4 hours ago',
      status: 'pending'
    },
    {
      type: 'attendance',
      message: 'Mike Johnson marked late arrival',
      time: '6 hours ago',
      status: 'warning'
    },
    {
      type: 'performance',
      message: 'Sarah Wilson performance review due',
      time: '1 day ago',
      status: 'overdue'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{hrMetrics.totalEmployees}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span>{hrMetrics.activeEmployees} active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Attendance</p>
              <p className="text-3xl font-bold text-gray-900">{hrMetrics.averageAttendance}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ClockIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
            <span>+2.1% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900">{hrMetrics.pendingApprovals}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Bell className="w-4 h-4 text-orange-500 mr-2" />
            <span>Requires attention</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  activity.status === 'warning' ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
                <span className="text-sm text-gray-700">{activity.message}</span>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'employees':
        return <EnhancedEmployeeProfiles />;
      case 'documents':
        return <DocumentManagement />;
      case 'recruitment':
        return <RecruitmentModule />;
      case 'attendance':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Attendance & Time</h2>
            <p className="text-gray-600">Integrated with existing Attendance system</p>
            <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Go to Attendance
            </button>
          </div>
        );
      case 'leave':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Leave Management</h2>
            <p className="text-gray-600">Integrated with existing Leave Request system</p>
            <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Go to Leave Requests
            </button>
          </div>
        );
      case 'performance':
        return <PerformanceManagement />;
      case 'training':
        return <TrainingDevelopment />;
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'workflows':
        return <WorkflowAutomation />;
      case 'payroll':
        return <PayrollCompensation />;
      case 'reports':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">HR Reports</h2>
            <p className="text-gray-600">Integrated with existing Reports system</p>
            <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Go to Reports
            </button>
          </div>
        );
      case 'development':
        return <HRTodoList />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
            <p className="text-gray-600">Comprehensive Human Resources Management</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {hrMetrics.activeEmployees} Active
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              HR System
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'recruitment', label: 'Recruitment', icon: UserPlus },
              { id: 'attendance', label: 'Attendance', icon: ClockIcon },
              { id: 'leave', label: 'Leave', icon: Calendar },
              { id: 'performance', label: 'Performance', icon: Award },
              { id: 'training', label: 'Training', icon: BookOpen },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'workflows', label: 'Workflows', icon: Zap },
              { id: 'payroll', label: 'Payroll', icon: DollarSign },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'development', label: 'Development', icon: ListTodo }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default HRDashboard;
