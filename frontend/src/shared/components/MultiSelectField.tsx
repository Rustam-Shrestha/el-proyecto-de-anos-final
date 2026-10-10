import React, { useState, useRef } from 'react';
import { ChevronDown, X } from '@/shared/icons';
import { useClickOutside } from '@/shared/hooks';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectFieldProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string | false;
  className?: string;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  options,
  value = [],
  onChange,
  placeholder = 'Choose options...',
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeValue = (val: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div ref={dropdownRef} className={`flex flex-col w-full relative ${className}`}>
      {label && <span className="mb-2 text-sm font-medium text-[#0F172A]">{label}</span>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[40px] rounded-[6px] border px-3 py-1.5 text-sm flex flex-wrap items-center gap-1.5 cursor-pointer bg-white ${
          error ? 'border-[#DC2626]' : 'border-[#CBD5E1]'
        }`}
      >
        {value.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          value.map((val) => {
            const labelText = options.find((o) => o.value === val)?.label || val;
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-medium"
              >
                {labelText}
                <X className="size-3 cursor-pointer hover:text-green-900" onClick={(e) => removeValue(val, e)} />
              </span>
            );
          })
        )}
        <ChevronDown className="ml-auto size-4 text-gray-500" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto p-1">
          {options.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer ${
                  isSelected ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="text-green-600 font-bold">✓</span>}
              </div>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
    </div>
  );
};

export default MultiSelectField;
