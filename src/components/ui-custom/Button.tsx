
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eloquent-400 focus:ring-opacity-50 active:scale-[0.98]';
  
  const variantStyles = {
    primary: 'bg-eloquent-500 hover:bg-eloquent-600 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm hover:shadow border border-gray-200',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-800',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-800 border border-gray-300',
    link: 'bg-transparent text-eloquent-500 hover:underline p-0 shadow-none'
  };
  
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  const isLink = variant === 'link';
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        !isLink && sizeStyles[size],
        fullWidth && 'w-full',
        (loading || disabled) && 'opacity-70 cursor-not-allowed',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : iconLeft ? (
        <span className="mr-2">{iconLeft}</span>
      ) : null}
      
      {children}
      
      {!loading && iconRight && <span className="ml-2">{iconRight}</span>}
    </button>
  );
};

export default Button;
