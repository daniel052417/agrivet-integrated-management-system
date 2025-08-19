import React, { useState } from 'react';
import { CreditCard, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Download, Calendar, Filter, Eye, FileText, Activity, Users } from 'lucide-react';

const TransactionReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedType, setSelectedType] = useState('all');

  const reportTypes = [
    {
      title: 'Daily Transaction Summary',
      description: 'Complete daily transaction breakdown and analysis',
      icon: Activity,
      color: 'bg-blue-600',
      lastGenerated: '2024-01-15',
      frequency: 'Daily',
      status: 'Available'
    },
    {
      title: 'Payment Method Analysis',
      description: 'Transaction distribution by payment methods',
      icon: CreditCard,
      color: 'bg-green-600',
      lastGenerated: '2024-01-15',
      frequency: 'Weekly',
      status: 'Available'
    },
    {
      title: 'Revenue Trend Report',
      description: 'Revenue patterns and growth analysis',
      icon: TrendingUp,
      color: 'bg-purple-600',
      lastGenerated: '2024-01-14',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'Customer Transaction History',
      description: 'Individual customer purchase patterns',
      icon: Users,
      color: 'bg-orange-600',
      lastGenerated: '2024-01-13',
      frequency: 'On-demand',
      status: 'Available'
    },
    {
      title: 'Failed Transaction Report',
      description: 'Analysis of failed and cancelled transactions',
      icon: TrendingDown,
      color: 'bg-red-600',
      lastGenerated: '2024-01-12',
      frequency: 'Weekly',
      status: 'Available'
    },
    {
      title: 'Peak Hours Analysis',
      description: 'Transaction volume by time periods',
      icon: BarChart3,
      color: 'bg-indigo-600',
      lastGenerated: '2024-01-11',
      frequency: 'Monthly',
      status: 'Available'
    }
  ];

  const transactionMetrics = [
    {
      title: 'Total Transactions',
      value: '8,456',
      change: '+12.3%',
      isPositive: true,
      period: 'This Month'
    },
    {
      title: 'Transaction Value',
      value: '₱2,847,650',
      change: '+18.5%',
      isPositive: true,
      period: 'This Month'
    },
    {
      title: 'Average Transaction',
      value: '₱2,284',
      change: '+5.2%',
      isPositive: true,
      period: 'Monthly Average'
    },
    {
      title: 'Success Rate',
      value: '98.7%',
      change: '+0.3%',
      isPositive: true,
      period: 'Transaction Success'
    }
  ];

  const paymentMethodAnalysis = [
    {
      method: 'Cash',
      transactions: 3456,
      value: '₱1,245,600',
      percentage: 43.7,
      trend: '+8.5%',
      color: 'bg-green-500'
    },
    {
      method: 'Credit Card',
      transactions: 2847,
      value: '₱987,450',
      percentage: 34.7,
      trend: '+12.1%',
      color: 'bg-blue-500'
    },
    {
      method: 'Bank Transfer',
      transactions: 1456,
      value: '₱456,800',
      percentage: 16.0,
      trend: '+15.3%',
      color: 'bg-purple-500'
    },
    {
      method: 'Digital Wallet',
      transactions: 697,
      value: '₱157,800',
      percentage: 5.6,
      trend: '+25.7%',
      color: 'bg-orange-500'
    }
  ];

  const hourlyTransactions = [
    { hour: '08:00', transactions: 45, value: 89500 },
    { hour: '09:00', transactions: 78, value: 156800 },
    { hour: '10:00', transactions: 123, value: 245600 },
    { hour: '11:00', transactions: 156, value: 312400 },
    { hour: '12:00', transactions: 89, value: 178900 },
    { hour: '13:00', transactions: 134, value: 267800 },
    { hour: '14:00', transactions: 167, value: 334500 },
    { hour: '15:00', transactions: 145, value: 289700 },
    { hour: '16:00', transactions: 98, value: 196400 },
    { hour: '17:00', transactions: 67, value: 134200 }
  ];

  const recentReports = [
    {
      name: 'Monthly Transaction Summary - January 2024',
      type: 'Summary',
      generatedDate: '2024-01-15',
      size: '3.2 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Payment Method Analysis Report',
      type: 'Analysis',
      generatedDate: '2024-01-14',
      size: '1.8 MB',
      format: 'Excel',
      status: 'Completed'
    },
    {
      name: 'Failed Transaction Report',
      type: 'Error Analysis',
      generatedDate: '2024-01-13',
      size: '896 KB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Customer Transaction Patterns',
      type: 'Customer Analysis',
      generatedDate: '2024-01-12',
      size: '2.7 MB',
      format: 'Excel',
      status: 'Completed'
    }
  ];

  const maxTransactions = Math.max(...hourlyTransactions.map(h => h.transactions));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transaction Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive transaction analysis and financial reporting</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Schedule Report</span>
          </button>
        </div>
      </div>

      {/* Transaction Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {transactionMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
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

      {/* Payment Method Analysis and Hourly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Payment Method Analysis</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {paymentMethodAnalysis.map((method, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${method.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{method.value}</span>
                    <span className="text-xs text-green-600 ml-2">{method.trend}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{method.transactions.toLocaleString()} transactions</span>
                  <span>{method.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${method.color}`}
                    style={{ width: `${method.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Transaction Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Hourly Transaction Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {hourlyTransactions.map((hour, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-600">{hour.hour}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{hour.transactions} transactions</span>
                    <span className="text-xs text-gray-500">₱{(hour.value / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(hour.transactions / maxTransactions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

export default TransactionReports;