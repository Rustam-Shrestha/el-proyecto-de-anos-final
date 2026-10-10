import React, { useId } from 'react';
import { ChevronDown } from '@/shared/icons';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | false;
  className?: string;
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  className = '',
  disabled = false,
}) => {
  const id = useId();

  return (
    <div className={`flex w-full flex-col ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="mb-2 text-sm font-medium text-[#0F172A]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full h-10 appearance-none rounded-[6px] border px-3 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 ${
            error ? 'border-[#DC2626] focus:ring-[rgba(220,38,38,0.12)]' : 'border-[#CBD5E1] focus:ring-[rgba(21,128,61,0.12)]'
          } ${disabled ? 'bg-[#F1F5F9] cursor-not-allowed text-[#94A3B8]' : 'bg-white text-[#0F172A]'}`}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
    </div>
  );
};

export default SelectField;
