import React from 'react';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Shield, 
  TrendingUp,
  Activity,
  AlertTriangle,
  Database
} from 'lucide-react';
import MetricCard from '../shared/charts/MetricCard';
import SalesChart from './SalesChart';
import InventorySummary from './InventorySummary';
import SalesByBranch from './SalesByBranch';
import SalesByProduct from './SalesByProduct';
import TopPerformers from './TopPerformers';
import RecentActivity from './RecentActivity';
import LowStockAlert from './LowStockAlert';
import SystemStatus from './SystemStatus';
import BranchPerformance from './BranchPerformance';
import AuditLogs from './AuditLogs';

const Overview: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Super Admin Header
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">Complete business oversight and management</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div> */}

      {/* Today's Overview - Key Metrics */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Today's Sales"
            color="green"
            metricType="todays_sales"
            leftIcon={<TrendingUp className="w-6 h-6 text-green-600" />}
          />
          <MetricCard
            title="Total Transactions"
            color="blue"
            metricType="total_transactions"
            leftIcon={<Activity className="w-6 h-6 text-blue-600" />}
          />
          <MetricCard
            title="Active POS Sessions"
            color="orange"
            metricType="active_sessions"
            leftIcon={<Users className="w-6 h-6 text-orange-600" />}
          />
          <MetricCard
            title="Low Stock Alerts"
            color="purple"
            metricType="low_stock_alerts"
            leftIcon={<AlertTriangle className="w-6 h-6 text-purple-600" />}
          />
        </div>
      </div>

      {/* System Overview - Additional Metrics */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Branches"
            color="blue"
            metricType="total_branches"
            leftIcon={<MapPin className="w-6 h-6 text-blue-600" />}
          />
          <MetricCard
            title="Active Cashiers"
            color="green"
            metricType="active_cashiers"
            leftIcon={<Users className="w-6 h-6 text-green-600" />}
          />
          <MetricCard
            title="Products in Stock"
            color="orange"
            metricType="products_in_stock"
            leftIcon={<Database className="w-6 h-6 text-orange-600" />}
          />
          <MetricCard
            title="Pending Orders"
            color="purple"
            metricType="active_orders"
            leftIcon={<Activity className="w-6 h-6 text-purple-600" />}
          />
        </div>
      </div>

      {/* System Status & Inventory Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SystemStatus />
        <InventorySummary />
      </div>

      {/* Sales Performance & Branch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesChart />
        <BranchPerformance />
      </div>

      {/* Sales Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesByBranch />
        <SalesByProduct />
      </div>

      {/* Top Performers & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TopPerformers />
        <RecentActivity />
      </div>

      {/* Low Stock Alerts & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlert />
        <AuditLogs />
      </div>
    </div>
  );
};

export default Overview;