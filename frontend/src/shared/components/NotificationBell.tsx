import React from 'react';
import { Bell } from '@/shared/icons';

export interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      aria-label="Notifications"
    >
      <Bell className="size-6" />
      {count > 0 && (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
