import React, { useState, useRef } from "react";
import { useUploadStatement } from "../api/finguardApi";

const StatementUpload: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadStatement();

  const handleFile = async (file: File) => {
    if (!file) return;
    try {
      await uploadMutation.mutateAsync(file);
    } catch {
      /* error handled by mutation */
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      } ${uploadMutation.isPending ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
        onChange={handleChange}
        className="hidden"
      />

      {uploadMutation.isPending ? (
        <div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Processing your bank statement...</p>
        </div>
      ) : uploadMutation.isSuccess ? (
        <div>
          <p className="text-green-600 font-semibold">Statement processed successfully!</p>
          <p className="text-xs text-gray-500 mt-1">
            {uploadMutation.data?.bankName && `Bank: ${uploadMutation.data.bankName}`}
            {uploadMutation.data?._count?.transactions !== undefined &&
              ` • ${uploadMutation.data._count.transactions} transactions`}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 font-medium mb-1">
            Drop your bank statement here or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supports PDF, Excel, CSV, and image files
          </p>
        </div>
      )}

      {uploadMutation.isError && (
        <p className="text-red-500 text-sm mt-2">
          {uploadMutation.error instanceof Error ? uploadMutation.error.message : "Upload failed"}
        </p>
      )}
    </div>
  );
};

export default StatementUpload;
