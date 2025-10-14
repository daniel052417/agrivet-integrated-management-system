import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  disabled = false,
  className = '',
  fullWidth = false,
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-300',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-300',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-300',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-300',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
    xl: 'px-10 py-5 text-xl min-h-[64px]',
  };

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed active:scale-100' 
    : '';

  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${widthClasses}
        ${className}
      `}
    >
      <div className="flex items-center justify-center space-x-2">
        {Icon && <Icon className="w-5 h-5" />}
        <span>{children}</span>
      </div>
    </button>
  );
};

export default TouchButton;




















