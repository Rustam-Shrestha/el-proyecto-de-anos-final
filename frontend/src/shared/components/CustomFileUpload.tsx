import React, { useRef } from 'react';
import { CloudUpload } from '@/shared/icons';

export interface CustomFileUploadProps {
  label?: string;
  accept?: string;
  onFileSelect?: (file: File) => void;
  maxSize?: number;
  error?: string | false;
  hint?: string;
  className?: string;
}

export const CustomFileUpload: React.FC<CustomFileUploadProps> = ({
  label,
  accept = '.pdf,.jpg,.png',
  onFileSelect,
  maxSize,
  error,
  hint = 'Accepted: PDF, JPG, PNG (max 5MB)',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (maxSize && file.size > maxSize) {
        alert('File size exceeds maximum limit');
        return;
      }
      onFileSelect?.(file);
    }
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && <span className="mb-2 text-sm font-medium text-[#0F172A]">{label}</span>}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 ${
          error ? 'border-red-400' : 'border-gray-300 hover:border-green-500'
        }`}
      >
        <CloudUpload className="size-8 text-gray-500 mb-2" />
        <span className="text-sm font-medium text-gray-700">Click to upload document</span>
        {hint && <span className="mt-1 text-xs text-gray-500">{hint}</span>}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CustomFileUpload;
