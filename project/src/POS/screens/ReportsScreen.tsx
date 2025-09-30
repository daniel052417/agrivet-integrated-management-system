import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  FileText,
  PieChart,
  Activity,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';

interface ReportData {
  id: string;
  title: string;
  type: 'sales' | 'inventory' | 'customer' | 'staff' | 'financial';
  period: string;
  lastUpdated: string;
  data: any;
}

interface SalesData {
  date: string;
  amount: number;
  transactions: number;
  averageTicket: number;
}

interface InventoryData {
  product: string;
  currentStock: number;
  sold: number;
  value: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const ReportsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  // Mock sales data
  const salesData: SalesData[] = [
    { date: '2024-01-15', amount: 15750.00, transactions: 25, averageTicket: 630.00 },
    { date: '2024-01-14', amount: 18920.00, transactions: 32, averageTicket: 591.25 },
    { date: '2024-01-13', amount: 12340.00, transactions: 18, averageTicket: 685.56 },
    { date: '2024-01-12', amount: 22100.00, transactions: 35, averageTicket: 631.43 },
    { date: '2024-01-11', amount: 16890.00, transactions: 28, averageTicket: 603.21 },
  ];

  // Mock inventory data
  const inventoryData: InventoryData[] = [
    { product: 'Premium Chicken Feed 50kg', currentStock: 25, sold: 15, value: 31250.00, status: 'in_stock' },
    { product: 'Vitamin Supplement 1L', currentStock: 3, sold: 8, value: 1350.00, status: 'low_stock' },
    { product: 'Antibiotic Injection 10ml', currentStock: 50, sold: 12, value: 4250.00, status: 'in_stock' },
    { product: 'Poultry Waterer 5L', currentStock: 0, sold: 5, value: 0, status: 'out_of_stock' },
  ];

  const reportTypes = [
    { id: 'all', name: 'All Reports', icon: FileText },
    { id: 'sales', name: 'Sales Reports', icon: ShoppingCart },
    { id: 'inventory', name: 'Inventory Reports', icon: Package },
    { id: 'customer', name: 'Customer Reports', icon: Users },
    { id: 'staff', name: 'Staff Reports', icon: Activity },
    { id: 'financial', name: 'Financial Reports', icon: DollarSign },
  ];

  const periods = [
    { id: 'today', name: 'Today' },
    { id: 'yesterday', name: 'Yesterday' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' },
    { id: 'year', name: 'This Year' },
    { id: 'custom', name: 'Custom Range' },
  ];

  const totalSales = salesData.reduce((sum, day) => sum + day.amount, 0);
  const totalTransactions = salesData.reduce((sum, day) => sum + day.transactions, 0);
  const averageTicket = totalSales / totalTransactions;
  const inventoryValue = inventoryData.reduce((sum, item) => sum + item.value, 0);
  const lowStockItems = inventoryData.filter(item => item.status === 'low_stock').length;
  const outOfStockItems = inventoryData.filter(item => item.status === 'out_of_stock').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'text-green-600 bg-green-100';
      case 'low_stock': return 'text-yellow-600 bg-yellow-100';
      case 'out_of_stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {reportTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <TouchButton
              onClick={() => setShowFilterModal(true)}
              variant="outline"
              icon={Filter}
            >
              Filters
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowExportModal(true)}
              variant="primary"
              icon={Download}
            >
              Export
            </TouchButton>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">₱{totalSales.toLocaleString()}</p>
                <p className="text-xs text-gray-500">+12% from last period</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
                <p className="text-xs text-gray-500">+8% from last period</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Ticket</p>
                <p className="text-2xl font-bold text-purple-600">₱{averageTicket.toFixed(2)}</p>
                <p className="text-xs text-gray-500">+5% from last period</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-orange-600">₱{inventoryValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{lowStockItems} low stock items</p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
              <div className="flex space-x-2">
                <TouchButton
                  onClick={() => console.log('Refresh sales data')}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                >
                  Refresh
                </TouchButton>
              </div>
            </div>
            
            {/* Simple bar chart representation */}
            <div className="space-y-3">
              {salesData.map((day, index) => (
                <div key={day.date} className="flex items-center space-x-3">
                  <div className="w-16 text-xs text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${(day.amount / Math.max(...salesData.map(d => d.amount))) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-sm font-medium text-gray-900 text-right">
                    ₱{day.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Status */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Status</h3>
              <TouchButton
                onClick={() => console.log('View full inventory')}
                variant="outline"
                size="sm"
              >
                View All
              </TouchButton>
            </div>
            
            <div className="space-y-3">
              {inventoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{item.product}</div>
                    <div className="text-xs text-gray-500">
                      Stock: {item.currentStock} • Sold: {item.sold} • Value: ₱{item.value.toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Daily Sales Summary</h4>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Complete daily sales breakdown with tax calculations</p>
            <TouchButton
              onClick={() => console.log('Generate daily sales report')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Generate Report
            </TouchButton>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Inventory Valuation</h4>
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Current inventory value and cost analysis</p>
            <TouchButton
              onClick={() => console.log('Generate inventory valuation report')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Generate Report
            </TouchButton>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Tax/VAT Report</h4>
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">BIR-compliant tax and VAT reporting</p>
            <TouchButton
              onClick={() => console.log('Generate tax report')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Generate Report
            </TouchButton>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Staff Performance</h4>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Sales performance by staff member</p>
            <TouchButton
              onClick={() => console.log('Generate staff performance report')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Generate Report
            </TouchButton>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Low Stock Alert</h4>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Products running low on stock</p>
            <TouchButton
              onClick={() => console.log('Generate low stock report')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Generate Report
            </TouchButton>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Customer Analytics</h4>
              <PieChart className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Customer behavior and loyalty analysis</p>
            <TouchButton
              onClick={() => console.log('Generate customer analytics report')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Generate Report
            </TouchButton>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
            <TouchButton
              onClick={() => console.log('View all reports')}
              variant="outline"
              size="sm"
            >
              View All
            </TouchButton>
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'Daily Sales Summary - Jan 15, 2024', type: 'Sales', size: '2.3 MB', status: 'Ready' },
              { name: 'Inventory Valuation - Jan 14, 2024', type: 'Inventory', size: '1.8 MB', status: 'Ready' },
              { name: 'Tax Report - Q4 2023', type: 'Financial', size: '4.1 MB', status: 'Ready' },
              { name: 'Staff Performance - Dec 2023', type: 'Staff', size: '3.2 MB', status: 'Processing' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{report.name}</div>
                  <div className="text-sm text-gray-500">{report.type} • {report.size}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === 'Ready' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                  }`}>
                    {report.status}
                  </span>
                  <TouchButton
                    onClick={() => console.log('Download report:', report.name)}
                    variant="outline"
                    size="sm"
                    icon={Download}
                  >
                    Download
                  </TouchButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Reports"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option>Daily Sales Summary</option>
              <option>Inventory Valuation</option>
              <option>Tax/VAT Report</option>
              <option>Staff Performance</option>
              <option>Customer Analytics</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="date"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex space-x-2">
              <TouchButton variant="outline" size="sm" className="flex-1">PDF</TouchButton>
              <TouchButton variant="outline" size="sm" className="flex-1">Excel</TouchButton>
              <TouchButton variant="outline" size="sm" className="flex-1">CSV</TouchButton>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <TouchButton
              onClick={() => setShowExportModal(false)}
              variant="outline"
            >
              Cancel
            </TouchButton>
            <TouchButton
              onClick={() => console.log('Export report')}
              variant="primary"
              icon={Download}
            >
              Export
            </TouchButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsScreen;





