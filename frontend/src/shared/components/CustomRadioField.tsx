import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
}

export interface CustomRadioFieldProps {
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (val: string) => void;
  name?: string;
  className?: string;
  error?: string | false;
}

export const CustomRadioField: React.FC<CustomRadioFieldProps> = ({
  label,
  options,
  value,
  onChange,
  name = 'custom-radio',
  className = '',
  error,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <span className="mb-2 text-sm font-medium text-[#0F172A]">{label}</span>}
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="size-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
    </div>
  );
};

export default CustomRadioField;
