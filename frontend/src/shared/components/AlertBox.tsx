import React from 'react';
import { AlertTriangleIcon, CheckCircle, InfoIcon, XCircle } from '@/shared/icons';

export interface AlertBoxProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

export const AlertBox: React.FC<AlertBoxProps> = ({
  type = 'info',
  title,
  message,
  className = '',
}) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 icon-blue-600',
    success: 'bg-green-50 border-green-200 text-green-800 icon-green-600',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 icon-yellow-600',
    error: 'bg-red-50 border-red-200 text-red-800 icon-red-600',
  }[type];

  const IconComponent = {
    info: InfoIcon,
    success: CheckCircle,
    warning: AlertTriangleIcon,
    error: XCircle,
  }[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles} ${className}`}>
      <IconComponent className="size-5 mt-0.5 shrink-0" />
      <div>
        {title && <h5 className="font-semibold text-sm mb-0.5">{title}</h5>}
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export const ErrorAlert: React.FC<{ message: string; className?: string }> = ({ message, className }) => (
  <AlertBox type="error" message={message} className={className} />
);

export const SuccessAlert: React.FC<{ message: string; className?: string }> = ({ message, className }) => (
  <AlertBox type="success" message={message} className={className} />
);

export default AlertBox;
