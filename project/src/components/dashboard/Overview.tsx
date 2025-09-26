import React from 'react';
import MetricCard from '../shared/charts/MetricCard';
import SalesChart from './SalesChart';
import InventorySummary from './InventorySummary';
import SalesByBranch from './SalesByBranch';
import SalesByProduct from './SalesByProduct';
import TopPerformers from './TopPerformers';
import RecentActivity from './RecentActivity';
import LowStockAlert from './LowStockAlert';

const Overview: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Sales"
          color="green"
          metricType="todays_sales"
        />
        <MetricCard
          title="Products in Stock"
          color="blue"
          metricType="products_in_stock"
        />
        <MetricCard
          title="Active Orders"
          color="orange"
          metricType="active_orders"
        />
        <MetricCard
          title="Low Stock Alerts"
          color="purple"
          metricType="low_stock_alerts"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <InventorySummary />
      </div>

      {/* Sales Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesByBranch />
        <SalesByProduct />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopPerformers />
        <RecentActivity />
        <LowStockAlert />
      </div>
    </div>
  );
};

export default Overview;