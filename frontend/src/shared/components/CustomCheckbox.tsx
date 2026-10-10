import React, { useId } from 'react';
import { Check } from '@/shared/icons';

export interface CustomCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | false;
  className?: string;
  disabled?: boolean;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  checked,
  onChange,
  error,
  className = '',
  disabled = false,
}) => {
  const id = useId();

  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer select-none">
        <div className="relative flex items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="peer sr-only"
          />
          <div className={`size-5 rounded border transition-colors peer-focus:ring-2 peer-focus:ring-green-500/20 ${
            checked ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
          {checked && <Check className="absolute size-3.5 text-white pointer-events-none" />}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
      {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
    </div>
  );
};

export default CustomCheckbox;
