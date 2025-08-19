import React from 'react';
import MetricCard from './MetricCard';
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

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300 group">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
            <div className="w-6 h-6 bg-green-500 rounded-lg"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">₱1.2M</p>
          <p className="text-sm text-gray-500 font-medium mt-1">Monthly Revenue</p>
          <p className="text-xs text-green-600 font-semibold mt-2">+18.5% vs last month</p>
          <div className="w-full h-1 bg-green-500 rounded-full mt-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300 group">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
            <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">4,892</p>
          <p className="text-sm text-gray-500 font-medium mt-1">Total Customers</p>
          <p className="text-xs text-blue-600 font-semibold mt-2">+245 new this month</p>
          <div className="w-full h-1 bg-blue-500 rounded-full mt-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300 group">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
            <div className="w-6 h-6 bg-purple-500 rounded-lg"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">₱245</p>
          <p className="text-sm text-gray-500 font-medium mt-1">Avg Order Value</p>
          <p className="text-xs text-green-600 font-semibold mt-2">+7.2% improvement</p>
          <div className="w-full h-1 bg-purple-500 rounded-full mt-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300 group">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
            <div className="w-6 h-6 bg-orange-500 rounded-lg"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">98.5%</p>
          <p className="text-sm text-gray-500 font-medium mt-1">Order Fulfillment</p>
          <p className="text-xs text-green-600 font-semibold mt-2">Excellent performance</p>
          <div className="w-full h-1 bg-orange-500 rounded-full mt-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300 group">
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
            <div className="w-6 h-6 bg-pink-500 rounded-lg"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">4.8/5</p>
          <p className="text-sm text-gray-500 font-medium mt-1">Customer Rating</p>
          <p className="text-xs text-green-600 font-semibold mt-2">Based on 1,247 reviews</p>
          <div className="w-full h-1 bg-pink-500 rounded-full mt-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
      </div>
      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SalesChart />
        </div>
        <div>
          <InventorySummary />
        </div>
      </div>

      {/* Sales Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SalesByBranch />
        </div>
        <div>
          <SalesByProduct />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <TopPerformers />
        </div>
        <div>
          <LowStockAlert />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Overview;