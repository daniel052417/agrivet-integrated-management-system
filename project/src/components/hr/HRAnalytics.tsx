import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, Users, Clock, Calendar, 
  AlertCircle, CheckCircle, Download, Filter, RefreshCw, Eye, FileText,
  Activity, Zap, Target, Award, DollarSign, MapPin, Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  totalDaysRequested: number;
  averageDaysPerRequest: number;
}

interface PayrollAnalytics {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  averageSalary: number;
  totalOvertime: number;
}

interface PerformanceAnalytics {
  totalStaff: number;
  highPerformers: number;
  averagePerformance: number;
  lowPerformers: number;
  trainingCompleted: number;
  promotions: number;
}

const HRAnalytics: React.FC = () => {
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
    totalDaysRequested: 0,
    averageDaysPerRequest: 0
  });
  
  const [payrollAnalytics, setPayrollAnalytics] = useState<PayrollAnalytics>({
    totalEmployees: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    averageSalary: 0,
    totalOvertime: 0
  });
  
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics>({
    totalStaff: 0,
    highPerformers: 0,
    averagePerformance: 0,
    lowPerformers: 0,
    trainingCompleted: 0,
    promotions: 0
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'payroll' | 'performance'>('attendance');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load attendance analytics
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*');

      if (attendanceError) throw attendanceError;

      // Load leave analytics
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*');

      if (leaveError) throw leaveError;

      // Load payroll analytics
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_records')
        .select('*');

      if (payrollError) throw payrollError;

      // Load staff data
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Calculate attendance analytics
      const totalStaff = staffData?.length || 0;
      const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absentDays = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const lateArrivals = attendanceData?.filter(a => a.status === 'late').length || 0;
      const overtimeHours = attendanceData?.reduce((sum, a) => sum + (a.overtime_hours || 0), 0) || 0;
      const averageAttendance = totalStaff > 0 ? (presentDays / (presentDays + absentDays)) * 100 : 0;

      setAttendanceAnalytics({
        totalStaff,
        averageAttendance,
        lateArrivals,
        earlyDepartures: 0, // This would need to be calculated based on early departures
        overtimeHours,
        absentDays,
        presentDays
      });

      // Calculate leave analytics
      const totalRequests = leaveData?.length || 0;
      const approvedRequests = leaveData?.filter(l => l.status === 'approved').length || 0;
      const rejectedRequests = leaveData?.filter(l => l.status === 'rejected').length || 0;
      const pendingRequests = leaveData?.filter(l => l.status === 'pending').length || 0;
      const totalDaysRequested = leaveData?.reduce((sum, l) => sum + l.days_requested, 0) || 0;
      const averageDaysPerRequest = totalRequests > 0 ? totalDaysRequested / totalRequests : 0;

      setLeaveAnalytics({
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        totalDaysRequested,
        averageDaysPerRequest
      });

      // Calculate payroll analytics
      const totalEmployees = payrollData?.length || 0;
      const totalGrossPay = payrollData?.reduce((sum, p) => sum + (p.gross_pay || 0), 0) || 0;
      const totalDeductions = payrollData?.reduce((sum, p) => sum + (p.total_deductions || 0), 0) || 0;
      const totalNetPay = payrollData?.reduce((sum, p) => sum + (p.net_pay || 0), 0) || 0;
      const averageSalary = totalEmployees > 0 ? totalGrossPay / totalEmployees : 0;
      const totalOvertime = payrollData?.reduce((sum, p) => sum + (p.overtime_pay || 0), 0) || 0;

      setPayrollAnalytics({
        totalEmployees,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        averageSalary,
        totalOvertime
      });

      // Calculate performance analytics (mock data for now)
      setPerformanceAnalytics({
        totalStaff,
        highPerformers: Math.floor(totalStaff * 0.2),
        averagePerformance: 85,
        lowPerformers: Math.floor(totalStaff * 0.1),
        trainingCompleted: Math.floor(totalStaff * 0.6),
        promotions: Math.floor(totalStaff * 0.05)
      });

    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 0 
    }).format(amount);
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Analytics</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="hr-analytics">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Analytics</h1>
          <p className="text-gray-600">Comprehensive HR analytics and insights</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'attendance', label: 'Attendance', icon: Clock },
              { id: 'leave', label: 'Leave Management', icon: Calendar },
              { id: 'payroll', label: 'Payroll', icon: DollarSign },
              { id: 'performance', label: 'Performance', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceAnalytics.totalStaff}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceAnalytics.averageAttendance.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceAnalytics.lateArrivals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceAnalytics.overtimeHours}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>Attendance trend chart would go here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveAnalytics.totalRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveAnalytics.approvedRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveAnalytics.pendingRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Days</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveAnalytics.totalDaysRequested}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Distribution</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-4" />
                  <p>Leave distribution chart would go here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{payrollAnalytics.totalEmployees}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Gross Pay</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollAnalytics.totalGrossPay)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollAnalytics.totalDeductions)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Net Pay</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollAnalytics.totalNetPay)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Trends</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>Payroll trend chart would go here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-900">{performanceAnalytics.totalStaff}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">High Performers</p>
                    <p className="text-2xl font-bold text-gray-900">{performanceAnalytics.highPerformers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Performance</p>
                    <p className="text-2xl font-bold text-gray-900">{performanceAnalytics.averagePerformance}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Training Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{performanceAnalytics.trainingCompleted}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-4" />
                  <p>Performance distribution chart would go here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>
  );
};

export default HRAnalytics;






























