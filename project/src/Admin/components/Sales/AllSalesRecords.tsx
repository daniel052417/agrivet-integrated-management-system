import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Edit, Calendar, DollarSign, User, Package, Clock, ChevronDown } from 'lucide-react';

const AllSalesRecords: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this-month');

  const salesRecords = [
    {
      id: 'TXN-2024-001',
      date: '2024-01-15',
      time: '10:30 AM',
      customer: 'Maria Santos',
      items: 5,
      total: 2450.00,
      payment: 'Cash',
      staff: 'Juan Dela Cruz',
      status: 'Completed',
      branch: 'Main Branch'
    },
    {
      id: 'TXN-2024-002',
      date: '2024-01-15',
      time: '11:15 AM',
      customer: 'Pedro Martinez',
      items: 3,
      total: 1850.00,
      payment: 'Credit Card',
      staff: 'Ana Rodriguez',
      status: 'Completed',
      branch: 'Branch 2'
    },
    {
      id: 'TXN-2024-003',
      date: '2024-01-15',
      time: '02:20 PM',
      customer: 'Carmen Lopez',
      items: 8,
      total: 3200.00,
      payment: 'Bank Transfer',
      staff: 'Maria Santos',
      status: 'Completed',
      branch: 'Main Branch'
    },
    {
      id: 'TXN-2024-004',
      date: '2024-01-15',
      time: '03:45 PM',
      customer: 'Roberto Garcia',
      items: 2,
      total: 890.00,
      payment: 'Cash',
      staff: 'Juan Dela Cruz',
      status: 'Pending',
      branch: 'Branch 3'
    },
    {
      id: 'TXN-2024-005',
      date: '2024-01-14',
      time: '09:10 AM',
      customer: 'Lisa Chen',
      items: 6,
      total: 4150.00,
      payment: 'Credit Card',
      staff: 'Ana Rodriguez',
      status: 'Completed',
      branch: 'Main Branch'
    }
  ];

  const summaryStats = [
    { label: 'Total Transactions', value: '1,247', change: '+12.5%', color: 'text-blue-600' },
    { label: 'Total Revenue', value: '₱2,847,650', change: '+18.3%', color: 'text-green-600' },
    { label: 'Average Transaction', value: '₱2,284', change: '+5.2%', color: 'text-purple-600' },
    { label: 'Today\'s Sales', value: '₱47,265', change: '+8.7%', color: 'text-orange-600' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment: string) => {
    switch (payment) {
      case 'Cash': return 'bg-blue-100 text-blue-800';
      case 'Credit Card': return 'bg-purple-100 text-purple-800';
      case 'Bank Transfer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All Sales Records</h2>
          <p className="text-gray-600 mt-1">Complete transaction history and sales data</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </button>
        </div>
      </div>

      {/* Sales Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.id}</div>
                    <div className="text-sm text-gray-500">{record.branch}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.date}</div>
                    <div className="text-sm text-gray-500">{record.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{record.customer}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Package className="w-4 h-4 mr-1 text-gray-400" />
                      {record.items}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">₱{record.total.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(record.payment)}`}>
                      {record.payment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.staff}
                  </td>
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

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
            <span className="font-medium">1,247</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllSalesRecords;