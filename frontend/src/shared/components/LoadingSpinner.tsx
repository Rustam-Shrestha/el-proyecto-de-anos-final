import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'gray' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'green',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'size-4 border-2',
    md: 'size-8 border-3',
    lg: 'size-12 border-4',
  }[size];

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  }[color];

  return (
    <div className={`inline-block rounded-full animate-spin ${sizeClasses} ${colorClasses} ${className}`} />
  );
};

export default LoadingSpinner;
