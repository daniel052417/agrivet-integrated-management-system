import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, color }) => {
  const colorClasses = {
    green: {
      bg: 'bg-white',
      accent: 'bg-green-500',
      text: 'text-green-600',
      lightBg: 'bg-green-50'
    },
    blue: {
      bg: 'bg-white',
      accent: 'bg-blue-500',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50'
    },
    orange: {
      bg: 'bg-white',
      accent: 'bg-orange-500',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50'
    },
    purple: {
      bg: 'bg-white',
      accent: 'bg-purple-500',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50'
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.lightBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <div className={`w-6 h-6 ${colors.accent} rounded-lg`}></div>
        </div>
        <div className="flex items-center space-x-1">
          {isPositive ? (
            <TrendingUp className={`w-4 h-4 ${colors.text}`} />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? colors.text : 'text-red-500'}`}>
            {change}
          </span>
        </div>
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      </div>
      <div className={`w-full h-1 ${colors.accent} rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
    </div>
  );
};

export default MetricCard;