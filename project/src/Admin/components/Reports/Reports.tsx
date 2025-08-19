import React from 'react';
import { BarChart3, TrendingUp, Package, Users, Calendar, Download } from 'lucide-react';

const Reports: React.FC = () => {
  const reportCategories = [
    {
      title: 'Sales Reports',
      icon: BarChart3,
      color: 'bg-green-50 text-green-600',
      reports: [
        'Daily Sales Summary',
        'Monthly Sales Report',
        'Product Performance',
        'Sales by Category',
        'Top Selling Items'
      ]
    },
    {
      title: 'Inventory Reports',
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      reports: [
        'Stock Levels Report',
        'Low Stock Alert',
        'Inventory Valuation',
        'Stock Movement History',
        'Supplier Performance'
      ]
    },
    {
      title: 'Staff Reports',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      reports: [
        'Staff Performance',
        'Attendance Report',
        'Leave Summary',
        'Working Hours',
        'Staff Activity Log'
      ]
    },
    {
      title: 'Financial Reports',
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
      reports: [
        'Profit & Loss',
        'Revenue Analysis',
        'Expense Report',
        'Tax Summary',
        'Financial Forecast'
      ]
    }
  ];

  const quickStats = [
    { label: 'Total Reports Generated', value: '1,247' },
    { label: 'This Month', value: '89' },
    { label: 'Scheduled Reports', value: '12' },
    { label: 'Auto-Generated', value: '156' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Calendar className="w-4 h-4" />
          <span>Schedule Report</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
              </div>

              <div className="space-y-3">
                {category.reports.map((report, reportIndex) => (
                  <div key={reportIndex} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{report}</span>
                    <button className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Generate</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'Monthly Sales Report - January 2024', type: 'Sales', date: '2024-01-15', size: '2.4 MB' },
                { name: 'Inventory Stock Report', type: 'Inventory', date: '2024-01-14', size: '1.8 MB' },
                { name: 'Staff Performance Report', type: 'HR', date: '2024-01-13', size: '896 KB' },
                { name: 'Financial Summary Q4 2023', type: 'Financial', date: '2024-01-12', size: '3.2 MB' }
              ].map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.size}</td>
                  <td className="px-4 py-3 text-sm">
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

export default Reports;