import React, { useId } from 'react';

export interface CustomTextAreaProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  error?: string | false;
  className?: string;
  disabled?: boolean;
}

export const CustomTextArea: React.FC<CustomTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  error,
  className = '',
  disabled = false,
}) => {
  const id = useId();

  return (
    <div className={`flex w-full flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-2 text-sm font-medium text-[#0F172A]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full rounded-[6px] border p-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
          error ? 'border-[#DC2626] focus:ring-[rgba(220,38,38,0.12)]' : 'border-[#CBD5E1] focus:ring-[rgba(21,128,61,0.12)]'
        } ${disabled ? 'bg-[#F1F5F9] cursor-not-allowed text-[#94A3B8]' : 'bg-white text-[#0F172A]'}`}
      />
      <div className="flex justify-between mt-1">
        {error ? <p className="text-sm text-[#DC2626]">{error}</p> : <span />}
        {maxLength && (
          <span className="text-xs text-gray-500">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default CustomTextArea;
