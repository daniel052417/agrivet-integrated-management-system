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
      description: 'Stock levels, movement analysis, and inventory optimization insights',
      reports: [
        { name: 'Stock Level Report', description: 'Current inventory levels by category', lastGenerated: '2024-01-15', size: '1.9 MB' },
        { name: 'Low Stock Alert Report', description: 'Products below reorder point', lastGenerated: '2024-01-14', size: '0.8 MB' },
        { name: 'Inventory Movement Report', description: 'Stock in/out movement analysis', lastGenerated: '2024-01-13', size: '2.7 MB' },
        { name: 'Product Turnover Report', description: 'Product velocity and turnover rates', lastGenerated: '2024-01-12', size: '1.6 MB' },
        { name: 'Supplier Performance Report', description: 'Supplier delivery and quality metrics', lastGenerated: '2024-01-11', size: '2.3 MB' }
      ],
      metrics: {
        totalReports: 32,
        lastGenerated: 'Today',
        avgSize: '1.9 MB',
        frequency: 'Daily'
      }
    },
    {
      title: 'HR Reports',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      description: 'Employee performance, attendance, and payroll analysis',
      reports: [
        { name: 'Employee Attendance Report', description: 'Daily attendance tracking and analysis', lastGenerated: '2024-01-15', size: '1.2 MB' },
        { name: 'Payroll Summary Report', description: 'Monthly payroll breakdown and costs', lastGenerated: '2024-01-14', size: '2.8 MB' },
        { name: 'Leave Management Report', description: 'Employee leave patterns and trends', lastGenerated: '2024-01-13', size: '1.4 MB' },
        { name: 'Performance Review Report', description: 'Employee performance evaluation summary', lastGenerated: '2024-01-12', size: '3.1 MB' },
        { name: 'Staff Productivity Report', description: 'Productivity metrics and KPIs', lastGenerated: '2024-01-11', size: '2.0 MB' }
      ],
      metrics: {
        totalReports: 28,
        lastGenerated: 'Today',
        avgSize: '2.1 MB',
        frequency: 'Weekly'
      }
    },
    {
      title: 'Financial Reports',
      icon: DollarSign,
      color: 'bg-yellow-50 text-yellow-600',
      borderColor: 'border-yellow-200',
      hoverColor: 'hover:bg-yellow-100',
      description: 'Financial performance, profit & loss, and budget analysis',
      reports: [
        { name: 'Profit & Loss Statement', description: 'Monthly P&L analysis and trends', lastGenerated: '2024-01-15', size: '4.2 MB' },
        { name: 'Cash Flow Report', description: 'Cash flow analysis and projections', lastGenerated: '2024-01-14', size: '3.5 MB' },
        { name: 'Budget vs Actual Report', description: 'Budget performance and variance analysis', lastGenerated: '2024-01-13', size: '2.9 MB' },
        { name: 'Revenue Analysis Report', description: 'Revenue streams and growth analysis', lastGenerated: '2024-01-12', size: '3.7 MB' },
        { name: 'Expense Breakdown Report', description: 'Detailed expense categorization and trends', lastGenerated: '2024-01-11', size: '2.4 MB' }
      ],
      metrics: {
        totalReports: 35,
        lastGenerated: 'Today',
        avgSize: '3.3 MB',
        frequency: 'Monthly'
      }
    },
    {
      title: 'Marketing Reports',
      icon: Target,
      color: 'bg-pink-50 text-pink-600',
      borderColor: 'border-pink-200',
      hoverColor: 'hover:bg-pink-100',
      description: 'Campaign performance, customer engagement, and marketing ROI',
      reports: [
        { name: 'Campaign Performance Report', description: 'Marketing campaign effectiveness analysis', lastGenerated: '2024-01-15', size: '2.6 MB' },
        { name: 'Customer Engagement Report', description: 'Customer interaction and engagement metrics', lastGenerated: '2024-01-14', size: '1.9 MB' },
        { name: 'Lead Generation Report', description: 'Lead sources and conversion analysis', lastGenerated: '2024-01-13', size: '1.7 MB' },
        { name: 'Social Media Analytics', description: 'Social media performance and reach', lastGenerated: '2024-01-12', size: '2.2 MB' },
        { name: 'Email Marketing Report', description: 'Email campaign performance and metrics', lastGenerated: '2024-01-11', size: '1.5 MB' }
      ],
      metrics: {
        totalReports: 22,
        lastGenerated: 'Today',
        avgSize: '2.0 MB',
        frequency: 'Weekly'
      }
    },
    {
      title: 'Operational Reports',
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-600',
      borderColor: 'border-indigo-200',
      hoverColor: 'hover:bg-indigo-100',
      description: 'System performance, operational efficiency, and process optimization',
      reports: [
        { name: 'System Performance Report', description: 'System uptime and performance metrics', lastGenerated: '2024-01-15', size: '1.8 MB' },
        { name: 'Process Efficiency Report', description: 'Operational process analysis and optimization', lastGenerated: '2024-01-14', size: '2.5 MB' },
        { name: 'Error Log Report', description: 'System errors and troubleshooting analysis', lastGenerated: '2024-01-13', size: '1.3 MB' },
        { name: 'User Activity Report', description: 'User behavior and system usage patterns', lastGenerated: '2024-01-12', size: '2.1 MB' },
        { name: 'Security Audit Report', description: 'Security events and compliance monitoring', lastGenerated: '2024-01-11', size: '1.6 MB' }
      ],
      metrics: {
        totalReports: 18,
        lastGenerated: 'Today',
        avgSize: '1.9 MB',
        frequency: 'Daily'
      }
    }
  ];

  const totalReports = reportCategories.reduce((sum, category) => sum + category.metrics.totalReports, 0);
  const totalSize = reportCategories.reduce((sum, category) => {
    const avgSize = parseFloat(category.metrics.avgSize);
    return sum + (avgSize * category.metrics.totalReports);
  }, 0);

  return (
    <div className="reports-analytics">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports Analytics</h1>
          <p className="text-gray-600">Comprehensive reporting and analytics dashboard</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Generated Today</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Download className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">{totalSize.toFixed(1)} MB</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Generation</p>
                <p className="text-2xl font-bold text-gray-900">2.3 min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="space-y-6">
          {reportCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${category.color} ${category.borderColor} border`}>
                      <category.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Reports</p>
                      <p className="text-lg font-semibold text-gray-900">{category.metrics.totalReports}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Last Generated</p>
                      <p className="text-lg font-semibold text-gray-900">{category.metrics.lastGenerated}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Avg Size</p>
                      <p className="text-lg font-semibold text-gray-900">{category.metrics.avgSize}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Frequency</p>
                      <p className="text-lg font-semibold text-gray-900">{category.metrics.frequency}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.reports.map((report, reportIndex) => (
                    <div key={reportIndex} className={`p-4 border border-gray-200 rounded-lg ${category.hoverColor} transition-colors cursor-pointer`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last: {report.lastGenerated}</span>
                        <span>{report.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">Generate All Reports</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Download className="w-5 h-5 text-green-600" />
              <span className="text-green-900 font-medium">Export Report Data</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-purple-900 font-medium">Schedule Reports</span>
            </button>
          </div>
        </div>
      </div>
  );
};

export default ReportsAnalytics;

