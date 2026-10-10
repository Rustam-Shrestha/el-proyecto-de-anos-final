import React from 'react';
import CustomDatePicker from './CustomDatePicker';

export interface MultiSelectDatePickerProps {
  label?: string;
  startDate: string;
  endDate: string;
  onStartChange: (dateStr: string) => void;
  onEndChange: (dateStr: string) => void;
  className?: string;
}

export const MultiSelectDatePicker: React.FC<MultiSelectDatePickerProps> = ({
  label,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && <span className="mb-2 text-sm font-medium text-[#0F172A]">{label}</span>}
      <div className="flex items-center gap-2">
        <CustomDatePicker value={startDate} onChange={onStartChange} />
        <span className="text-gray-400 font-medium">to</span>
        <CustomDatePicker value={endDate} onChange={onEndChange} />
      </div>
    </div>
  );
};

export default MultiSelectDatePicker;
