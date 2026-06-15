import { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent } from "react";
import { DocumentType } from "@shared/types/common";

interface FileUploadFieldProps {
  label: string
  documentType: DocumentType
  accept: string
  maxSizeMB: number
  onFileSelect: (file: File) => void
  onClear: () => void
  currentFile?: File | null
  uploadedUrl?: string | null
  isUploading?: boolean
  error?: string
  isRequired?: boolean
}

const PDFIcon = () => (
  <svg className="h-10 w-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const UploadIcon = () => (
  <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const FileUploadField = ({
  label,
  documentType: _documentType,
  accept,
  maxSizeMB,
  onFileSelect,
  onClear,
  currentFile,
  uploadedUrl,
  isUploading,
  error,
  isRequired,
}: FileUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const displayError = error || internalError;

  useEffect(() => {
    if (uploadedUrl && uploadedUrl.startsWith("data:")) {
      setPreview(uploadedUrl);
    }
  }, [uploadedUrl]);

  const readFilePreview = useCallback((file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, []);

  useEffect(() => {
    if (currentFile) {
      readFilePreview(currentFile);
    }
  }, [currentFile, readFilePreview]);

  const validateAndSelect = useCallback(
    (file: File) => {
      setInternalError(null);

      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setInternalError(`File must be under ${maxSizeMB}MB`);
        return;
      }

      const allowed = accept.split(",").map((t) => t.trim());
      if (!allowed.includes(file.type)) {
        setInternalError(`Accepted formats: ${allowed.join(", ")}`);
        return;
      }

      onFileSelect(file);
    },
    [accept, maxSizeMB, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.item(0);
      if (file) {
        validateAndSelect(file);
      }
      e.target.value = "";
    },
    [validateAndSelect]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        validateAndSelect(file);
      }
    },
    [validateAndSelect]
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    setInternalError(null);
    onClear();
  }, [onClear]);

  const isImage = currentFile?.type.startsWith("image/");
  const isPdf = currentFile?.type === "application/pdf";
  const hasFile = Boolean(currentFile || uploadedUrl);

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-color)" }}>
        {label}
        {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
      </label>

      {hasFile ? (
        <div
          className="relative flex items-center gap-3 rounded-xl border p-3"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
        >
          {isImage ? (
            <img
              src={preview || undefined}
              alt="Upload preview"
              className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
            />
          ) : isPdf ? (
            <PDFIcon />
          ) : null}

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              style={{ color: "var(--text-color)" }}
            >
              {currentFile?.name || "Uploaded file"}
            </p>
            {currentFile ? (
              <p className="text-xs" style={{ color: "var(--gray-column-text, #6b7280)" }}>
                {formatSize(currentFile.size)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={isUploading}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Remove file"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              inputRef.current?.click();
            }
          }}
          aria-label={`Upload ${label}`}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
            dragOver ? "border-blue-500 bg-blue-50" : ""
          } ${isUploading ? "cursor-not-allowed opacity-60" : "hover:border-blue-400 hover:bg-blue-50/50"}`}
          style={{
            backgroundColor: dragOver ? undefined : "var(--surface-color)",
            borderColor: dragOver ? undefined : "var(--border-color)",
          }}
        >
          <UploadIcon />
          <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
            {isUploading ? "Uploading..." : dragOver ? "Drop file here" : "Click or drag to upload"}
          </p>
          <p className="text-xs" style={{ color: "var(--gray-column-text, #6b7280)" }}>
            Max {maxSizeMB}MB &middot; {accept.split(",").join(", ")}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={isUploading}
        className="sr-only"
        aria-hidden="true"
      />

      {displayError ? (
        <p className="mt-1.5 text-sm" style={{ color: "var(--red, #ef4444)" }} role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
};

FileUploadField.displayName = "FileUploadField";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default FileUploadField;
