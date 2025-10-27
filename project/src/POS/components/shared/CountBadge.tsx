import React from 'react';

interface CountBadgeProps {
  count: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const CountBadge: React.FC<CountBadgeProps> = ({ 
  count, 
  variant = 'default',
  size = 'sm' 
}) => {
  if (count === 0) return null;

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[20px]',
    md: 'text-sm px-2 py-1 min-w-[24px]',
  };

  return (
    <span 
      className={`
        inline-flex items-center justify-center 
        font-semibold rounded-full 
        ${variantClasses[variant]} 
        ${sizeClasses[size]}
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};