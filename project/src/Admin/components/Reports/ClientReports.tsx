import React, { useState } from 'react';
import { Users, TrendingUp, TrendingDown, Heart, BarChart3, PieChart, Download, Calendar, Filter, Eye, FileText, UserPlus, Star, MapPin } from 'lucide-react';

const ClientReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const reportTypes = [
    {
      title: 'Customer Demographics Report',
      description: 'Age, location, and profile analysis of customers',
      icon: Users,
      color: 'bg-blue-600',
      lastGenerated: '2024-01-15',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'Purchase Behavior Analysis',
      description: 'Buying patterns and preferences tracking',
      icon: BarChart3,
      color: 'bg-green-600',
      lastGenerated: '2024-01-15',
      frequency: 'Weekly',
      status: 'Available'
    },
    {
      title: 'Customer Satisfaction Report',
      description: 'Feedback scores and satisfaction metrics',
      icon: Star,
      color: 'bg-purple-600',
      lastGenerated: '2024-01-14',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'Customer Retention Analysis',
      description: 'Loyalty metrics and churn analysis',
      icon: Heart,
      color: 'bg-red-600',
      lastGenerated: '2024-01-13',
      frequency: 'Quarterly',
      status: 'Available'
    },
    {
      title: 'Geographic Distribution',
      description: 'Customer locations and regional analysis',
      icon: MapPin,
      color: 'bg-orange-600',
      lastGenerated: '2024-01-12',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'New Customer Acquisition',
      description: 'Growth trends and acquisition channels',
      icon: UserPlus,
      color: 'bg-indigo-600',
      lastGenerated: '2024-01-11',
      frequency: 'Weekly',
      status: 'Available'
    }
  ];

  const clientMetrics = [
    {
      title: 'Total Customers',
      value: '4,892',
      change: '+245',
      isPositive: true,
      period: 'Active Customers'
    },
    {
      title: 'Customer Retention',
      value: '87.3%',
      change: '+2.1%',
      isPositive: true,
      period: 'Annual Rate'
    },
    {
      title: 'Average Lifetime Value',
      value: '₱18,450',
      change: '+12.5%',
      isPositive: true,
      period: 'Per Customer'
    },
    {
      title: 'Satisfaction Score',
      value: '4.8/5',
      change: '+0.2',
      isPositive: true,
      period: 'Average Rating'
    }
  ];

  const customerSegments = [
    {
      segment: 'Pet Owners',
      count: 2156,
      percentage: 44.1,
      avgSpend: '₱15,600',
      retention: 92.5,
      growth: '+18.5%',
      color: 'bg-blue-500'
    },
    {
      segment: 'Farmers',
      count: 1834,
      percentage: 37.5,
      avgSpend: '₱24,800',
      retention: 89.2,
      growth: '+12.3%',
      color: 'bg-green-500'
    },
    {
      segment: 'Veterinarians',
      count: 567,
      percentage: 11.6,
      avgSpend: '₱45,200',
      retention: 95.8,
      growth: '+8.7%',
      color: 'bg-red-500'
    },
    {
      segment: 'Retailers',
      count: 335,
      percentage: 6.8,
      avgSpend: '₱67,500',
      retention: 88.1,
      growth: '+15.2%',
      color: 'bg-purple-500'
    }
  ];

  const topCustomers = [
    {
      name: 'Green Valley Farm',
      type: 'Business',
      totalSpent: '₱245,600',
      orders: 45,
      lastPurchase: '2024-01-14',
      satisfaction: 4.9,
      segment: 'Farmers'
    },
    {
      name: 'Pet Care Clinic',
      type: 'Business',
      totalSpent: '₱189,400',
      orders: 38,
      lastPurchase: '2024-01-15',
      satisfaction: 4.8,
      segment: 'Veterinarians'
    },
    {
      name: 'Maria Santos',
      type: 'Individual',
      totalSpent: '₱156,800',
      orders: 67,
      lastPurchase: '2024-01-13',
      satisfaction: 5.0,
      segment: 'Pet Owners'
    },
    {
      name: 'Agricultural Supply Co.',
      type: 'Business',
      totalSpent: '₱134,500',
      orders: 28,
      lastPurchase: '2024-01-12',
      satisfaction: 4.7,
      segment: 'Retailers'
    },
    {
      name: 'Juan Dela Cruz',
      type: 'Individual',
      totalSpent: '₱98,700',
      orders: 52,
      lastPurchase: '2024-01-15',
      satisfaction: 4.9,
      segment: 'Farmers'
    }
  ];

  const geographicData = [
    { region: 'Metro Manila', customers: 1892, percentage: 38.7, revenue: '₱1,245,600' },
    { region: 'Central Luzon', customers: 1245, percentage: 25.4, revenue: '₱856,400' },
    { region: 'Southern Luzon', customers: 867, percentage: 17.7, revenue: '₱567,800' },
    { region: 'Visayas', customers: 534, percentage: 10.9, revenue: '₱345,200' },
    { region: 'Mindanao', customers: 354, percentage: 7.2, revenue: '₱234,500' }
  ];

  const monthlyTrends = [
    { month: 'Jul', newCustomers: 45, retention: 87.2, satisfaction: 4.6 },
    { month: 'Aug', newCustomers: 52, retention: 88.1, satisfaction: 4.7 },
    { month: 'Sep', newCustomers: 38, retention: 86.5, satisfaction: 4.6 },
    { month: 'Oct', newCustomers: 67, retention: 89.3, satisfaction: 4.8 },
    { month: 'Nov', newCustomers: 78, retention: 87.8, satisfaction: 4.7 },
    { month: 'Dec', newCustomers: 89, retention: 90.1, satisfaction: 4.9 },
    { month: 'Jan', newCustomers: 95, retention: 87.3, satisfaction: 4.8 }
  ];

  const recentReports = [
    {
      name: 'Monthly Customer Analysis - January 2024',
      type: 'Demographics',
      generatedDate: '2024-01-15',
      size: '2.8 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Customer Satisfaction Survey Results',
      type: 'Satisfaction',
      generatedDate: '2024-01-14',
      size: '1.5 MB',
      format: 'Excel',
      status: 'Completed'
    },
    {
      name: 'Purchase Behavior Analysis Q4 2023',
      type: 'Behavior',
      generatedDate: '2024-01-13',
      size: '3.1 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Customer Retention Report',
      type: 'Retention',
      generatedDate: '2024-01-12',
      size: '1.9 MB',
      format: 'Excel',
      status: 'Completed'
    }
  ];

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Pet Owners': return 'bg-blue-100 text-blue-800';
      case 'Farmers': return 'bg-green-100 text-green-800';
      case 'Veterinarians': return 'bg-red-100 text-red-800';
      case 'Retailers': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const maxNewCustomers = Math.max(...monthlyTrends.map(m => m.newCustomers));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Client Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive customer analysis and insights</p>
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

      {/* Client Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {clientMetrics.map((metric, index) => (
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

      {/* Customer Segments and Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Customer Segments</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {customerSegments.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{segment.count.toLocaleString()}</span>
                    <span className="text-xs text-green-600 ml-2">{segment.growth}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>Avg Spend: {segment.avgSpend}</div>
                  <div>Retention: {segment.retention}%</div>
                  <div>Share: {segment.percentage}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${segment.color}`}
                    style={{ width: `${segment.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Geographic Distribution</h3>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {geographicData.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{region.region}</p>
                  <p className="text-xs text-gray-500">{region.customers.toLocaleString()} customers ({region.percentage}%)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{region.revenue}</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${region.percentage * 2.5}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
          <Star className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Purchase</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topCustomers.map((customer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{customer.type}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{customer.totalSpent}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{customer.orders}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{customer.lastPurchase}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span>{customer.satisfaction}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSegmentColor(customer.segment)}`}>
                      {customer.segment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Customer Acquisition & Retention Trends</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {monthlyTrends.map((trend, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-gray-600">{trend.month}</div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">New Customers</span>
                    <span className="text-sm font-medium">{trend.newCustomers}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(trend.newCustomers / maxNewCustomers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Retention</span>
                    <span className="text-sm font-medium">{trend.retention}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${trend.retention}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Satisfaction</span>
                    <span className="text-sm font-medium">{trend.satisfaction}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(trend.satisfaction / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

export default ClientReports;