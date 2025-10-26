import React from 'react';
import { CountBadge } from '../shared/CountBadge';

interface DropdownOption {
  value: string;
  label: string;
  count?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

interface OrderFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  allLabel?: string;
  className?: string;
}

export const OrderFilterDropdown: React.FC<OrderFilterDropdownProps> = ({
  value,
  onChange,
  options,
  allLabel = 'All',
  className = '',
}) => {
  // Calculate total for "All" option
  const totalCount = options.reduce((sum, opt) => sum + (opt.count || 0), 0);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          appearance-none
          px-4 py-3 pr-10
          border border-gray-300 rounded-lg
          bg-white
          focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          cursor-pointer
          text-gray-900 font-medium
          ${className}
        `}
      >
        {/* All option with total count */}
        <option value="">
          {allLabel} {totalCount > 0 ? `(${totalCount})` : ''}
        </option>

        {/* Individual options with counts */}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} {option.count !== undefined && option.count > 0 ? `(${option.count})` : ''}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};