import React, { useId } from 'react';
import { Calendar } from '@/shared/icons';

export interface CustomDatePickerProps {
  label?: string;
  value: string;
  onChange: (dateStr: string) => void;
  maxDate?: Date;
  minDate?: Date;
  error?: string | false;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  maxDate,
  minDate,
  error,
  className = '',
}) => {
  const id = useId();

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-2 text-sm font-medium text-[#0F172A]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
          min={minDate ? minDate.toISOString().split('T')[0] : undefined}
          className={`w-full h-10 rounded-[6px] border px-3 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 ${
            error ? 'border-[#DC2626] focus:ring-[rgba(220,38,38,0.12)]' : 'border-[#CBD5E1] focus:ring-[rgba(21,128,61,0.12)]'
          }`}
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
    </div>
  );
};

export default CustomDatePicker;
