import React from 'react';

const SalesChart: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const salesData = [2500, 3200, 2800, 4100, 3600, 4500, 5200];
  const ordersData = [45, 52, 48, 65, 58, 72, 85];

  const maxSales = Math.max(...salesData);
  const minSales = Math.min(...salesData);
  const maxOrders = Math.max(...ordersData);
  const minOrders = Math.min(...ordersData);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Sales Overview</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-lg">
            Sales (₱K)
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            Orders
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">₱{salesData[salesData.length - 1]}K</p>
          <p className="text-sm text-gray-600">This Month</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">+15.6%</p>
          <p className="text-sm text-gray-600">Growth</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{ordersData[ordersData.length - 1]}</p>
          <p className="text-sm text-gray-600">Orders</p>
        </div>
      </div>
      <div className="relative">
        <svg className="w-full h-64" viewBox="0 0 700 200">
          <defs>
            <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ordersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="50"
              y1={40 + i * 30}
              x2="650"
              y2={40 + i * 30}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}

          {/* Sales area */}
          <path
            d={`M 50,${170 - ((salesData[0] - minSales) / (maxSales - minSales)) * 120} ${salesData
              .map((value, index) => {
                const x = 50 + (index * 100);
                const y = 170 - ((value - minSales) / (maxSales - minSales)) * 120;
                return `L ${x},${y}`;
              })
              .join(' ')} L 650,170 L 50,170 Z`}
            fill="url(#salesGradient)"
          />

          {/* Sales line */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            points={salesData
              .map((value, index) => {
                const x = 50 + (index * 100);
                const y = 170 - ((value - minSales) / (maxSales - minSales)) * 120;
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Sales points */}
          {salesData.map((value, index) => {
            const x = 50 + (index * 100);
            const y = 170 - ((value - minSales) / (maxSales - minSales)) * 120;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill="#10B981"
                stroke="white"
                strokeWidth="3"
              />
            );
          })}

          {/* X-axis labels */}
          {months.map((month, index) => (
            <text
              key={month}
              x={50 + (index * 100)}
              y="190"
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default SalesChart;