import React from 'react';
import { BarChart3, TrendingUp, Package, Users, DollarSign, Calendar, Download, Eye, FileText, Activity, Target, Clock } from 'lucide-react';

const ReportsAnalytics: React.FC = () => {
  const reportCategories = [
    {
      title: 'Sales Reports',
      icon: BarChart3,
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
      description: 'Comprehensive sales performance analysis and revenue tracking',
      reports: [
        { name: 'Daily Sales Summary', description: 'Complete daily sales breakdown', lastGenerated: '2024-01-15', size: '2.4 MB' },
        { name: 'Monthly Sales Report', description: 'Monthly performance analysis', lastGenerated: '2024-01-14', size: '3.2 MB' },
        { name: 'Product Performance Report', description: 'Top selling products analysis', lastGenerated: '2024-01-13', size: '1.8 MB' },
        { name: 'Sales by Category Report', description: 'Category-wise sales breakdown', lastGenerated: '2024-01-12', size: '2.1 MB' },
        { name: 'Sales Target Achievement', description: 'Target vs actual performance', lastGenerated: '2024-01-11', size: '1.5 MB' }
      ],
      metrics: {
        totalReports: 45,
        lastGenerated: 'Today',
        avgSize: '2.2 MB',
        frequency: 'Daily'
      }
    },
    {
      title: 'Inventory Reports',
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      description: 'Stock levels, inventory valuation, and warehouse analytics',
      reports: [
        { name: 'Stock Levels Report', description: 'Current inventory across all categories', lastGenerated: '2024-01-15', size: '1.9 MB' },
        { name: 'Low Stock Alert Report', description: 'Items below minimum threshold', lastGenerated: '2024-01-15', size: '856 KB' },
        { name: 'Inventory Valuation Report', description: 'Total inventory value analysis', lastGenerated: '2024-01-14', size: '2.3 MB' },
        { name: 'Stock Movement Report', description: 'Inventory in/out tracking', lastGenerated: '2024-01-13', size: '3.1 MB' },
        { name: 'Supplier Performance Report', description: 'Delivery and quality metrics', lastGenerated: '2024-01-12', size: '1.7 MB' }
      ],
      metrics: {
        totalReports: 38,
        lastGenerated: 'Today',
        avgSize: '1.8 MB',
        frequency: 'Daily'
      }
    },
    {
      title: 'Transaction Reports',
      icon: Activity,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      description: 'Payment processing, transaction analysis, and financial data',
      reports: [
        { name: 'Daily Transaction Summary', description: 'Complete transaction breakdown', lastGenerated: '2024-01-15', size: '2.8 MB' },
        { name: 'Payment Method Analysis', description: 'Payment distribution report', lastGenerated: '2024-01-14', size: '1.4 MB' },
        { name: 'Failed Transaction Report', description: 'Transaction failure analysis', lastGenerated: '2024-01-13', size: '896 KB' },
        { name: 'Revenue Trend Report', description: 'Revenue patterns and growth', lastGenerated: '2024-01-12', size: '2.5 MB' },
        { name: 'Customer Transaction History', description: 'Individual customer patterns', lastGenerated: '2024-01-11', size: '3.4 MB' }
      ],
      metrics: {
        totalReports: 52,
        lastGenerated: 'Today',
        avgSize: '2.2 MB',
        frequency: 'Daily'
      }
    },
    {
      title: 'Staff Activity Reports',
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      description: 'Employee performance, attendance, and productivity metrics',
      reports: [
        { name: 'Staff Performance Report', description: 'Individual performance metrics', lastGenerated: '2024-01-15', size: '2.1 MB' },
        { name: 'Attendance Summary Report', description: 'Attendance patterns analysis', lastGenerated: '2024-01-14', size: '1.3 MB' },
        { name: 'Productivity Analysis Report', description: 'Work efficiency measurements', lastGenerated: '2024-01-13', size: '1.8 MB' },
        { name: 'Department Performance', description: 'Team comparison analysis', lastGenerated: '2024-01-12', size: '2.4 MB' },
        { name: 'Working Hours Report', description: 'Hours and overtime tracking', lastGenerated: '2024-01-11', size: '1.6 MB' }
      ],
      metrics: {
        totalReports: 29,
        lastGenerated: 'Yesterday',
        avgSize: '1.8 MB',
        frequency: 'Weekly'
      }
    },
    {
      title: 'Client Reports',
      icon: Users,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200',
      hoverColor: 'hover:bg-red-100',
      description: 'Customer analytics, behavior patterns, and satisfaction metrics',
      reports: [
        { name: 'Customer Demographics Report', description: 'Customer profile analysis', lastGenerated: '2024-01-15', size: '2.7 MB' },
        { name: 'Purchase Behavior Analysis', description: 'Buying patterns tracking', lastGenerated: '2024-01-14', size: '3.1 MB' },
        { name: 'Customer Satisfaction Report', description: 'Feedback and ratings analysis', lastGenerated: '2024-01-13', size: '1.5 MB' },
        { name: 'Customer Retention Analysis', description: 'Loyalty and churn metrics', lastGenerated: '2024-01-12', size: '2.2 MB' },
        { name: 'Geographic Distribution', description: 'Regional customer analysis', lastGenerated: '2024-01-11', size: '1.9 MB' }
      ],
      metrics: {
        totalReports: 34,
        lastGenerated: 'Today',
        avgSize: '2.3 MB',
        frequency: 'Weekly'
      }
    }
  ];

  const quickStats = [
    { label: 'Total Reports Generated', value: '1,247', change: '+12.5%', color: 'text-green-600' },
    { label: 'This Month', value: '89', change: '+8.7%', color: 'text-blue-600' },
    { label: 'Scheduled Reports', value: '12', change: '+2', color: 'text-purple-600' },
    { label: 'Auto-Generated', value: '156', change: '+15.2%', color: 'text-orange-600' }
  ];

  const recentReports = [
    {
      name: 'Monthly Sales Summary - January 2024',
      category: 'Sales',
      generatedDate: '2024-01-15',
      size: '3.2 MB',
      format: 'PDF',
      status: 'Completed',
      downloads: 23
    },
    {
      name: 'Inventory Valuation Report',
      category: 'Inventory',
      generatedDate: '2024-01-15',
      size: '2.1 MB',
      format: 'Excel',
      status: 'Completed',
      downloads: 15
    },
    {
      name: 'Staff Performance Analysis',
      category: 'Staff',
      generatedDate: '2024-01-14',
      size: '1.8 MB',
      format: 'PDF',
      status: 'Completed',
      downloads: 8
    },
    {
      name: 'Customer Demographics Report',
      category: 'Client',
      generatedDate: '2024-01-14',
      size: '2.7 MB',
      format: 'Excel',
      status: 'Completed',
      downloads: 12
    },
    {
      name: 'Transaction Analysis Q4 2023',
      category: 'Transaction',
      generatedDate: '2024-01-13',
      size: '4.1 MB',
      format: 'PDF',
      status: 'Completed',
      downloads: 31
    }
  ];

  const scheduledReports = [
    { name: 'Weekly Sales Summary', nextRun: '2024-01-22', frequency: 'Weekly', category: 'Sales' },
    { name: 'Monthly Inventory Report', nextRun: '2024-02-01', frequency: 'Monthly', category: 'Inventory' },
    { name: 'Staff Attendance Report', nextRun: '2024-01-21', frequency: 'Bi-weekly', category: 'Staff' },
    { name: 'Customer Satisfaction Survey', nextRun: '2024-02-15', frequency: 'Monthly', category: 'Client' }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sales': return 'bg-green-100 text-green-800';
      case 'Inventory': return 'bg-blue-100 text-blue-800';
      case 'Staff': return 'bg-orange-100 text-orange-800';
      case 'Client': return 'bg-red-100 text-red-800';
      case 'Transaction': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Report & Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive business intelligence and reporting dashboard</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Schedule Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${stat.color}`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={index} className={`bg-white rounded-xl shadow-sm border-2 ${category.borderColor} p-6 ${category.hoverColor} transition-all duration-200 cursor-pointer`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{category.metrics.totalReports}</p>
                  <p className="text-xs text-gray-500">reports</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{category.metrics.totalReports}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{category.metrics.lastGenerated}</p>
                  <p className="text-xs text-gray-600">Last Run</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{category.metrics.avgSize}</p>
                  <p className="text-xs text-gray-600">Avg Size</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{category.metrics.frequency}</p>
                  <p className="text-xs text-gray-600">Frequency</p>
                </div>
              </div>

              <div className="space-y-2">
                {category.reports.slice(0, 3).map((report, reportIndex) => (
                  <div key={reportIndex} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{report.name}</p>
                      <p className="text-xs text-gray-500">{report.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <span className="text-xs text-gray-500">{report.size}</span>
                      <button className="text-green-600 hover:text-green-700 transition-colors">
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {category.reports.length > 3 && (
                  <div className="text-center pt-2">
                    <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                      +{category.reports.length - 3} more reports
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">View All</span>
                </button>
                <button className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Generate New</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports and Scheduled Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Reports</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{report.name}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(report.category)}`}>
                        {report.category}
                      </span>
                      <span className="text-xs text-gray-500">{report.generatedDate}</span>
                      <span className="text-xs text-gray-500">{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <span className="text-xs text-gray-500">{report.downloads} downloads</span>
                  <button className="text-green-600 hover:text-green-700 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
            View All Recent Reports
          </button>
        </div>

        {/* Scheduled Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Scheduled Reports</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {scheduledReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(report.category)}`}>
                        {report.category}
                      </span>
                      <span className="text-xs text-gray-500">{report.frequency}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{report.nextRun}</p>
                  <p className="text-xs text-gray-500">Next run</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Manage Scheduled Reports
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Analytics Overview</h3>
          <Target className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">+18.5%</p>
            <p className="text-sm text-gray-600">Sales Growth</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">92.8%</p>
            <p className="text-sm text-gray-600">Stock Availability</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">94.2%</p>
            <p className="text-sm text-gray-600">Staff Attendance</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">4.8/5</p>
            <p className="text-sm text-gray-600">Customer Satisfaction</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Generate Sales Report</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Package className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Inventory Analysis</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Activity className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Transaction Report</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Staff Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;