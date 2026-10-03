import React, { useState, useRef } from 'react';
import { portfolioService } from '../../services/portfolioService';
import { FINANCIAL_DOCUMENT_TYPES } from '../../types/financial';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function FinancialDocumentUpload() {
  const [selectedType, setSelectedType] = useState('SALARY_SLIP');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const maxSize = 10 * 1024 * 1024;
    if (f.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(f.type)) {
      setError('Only JPEG, PNG, WebP, and PDF files are accepted');
      return;
    }

    setFile(f);
    setError('');

    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploadStatus('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', selectedType);

      const data = await portfolioService.uploadDocument(formData);
      setUploadStatus('success');
      setResult(data);
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setUploadStatus('error');
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    }
  };

  const handleReset = () => {
    setUploadStatus('idle');
    setResult(null);
    setError('');
    setFile(null);
    setPreviewUrl(null);
  };

  if (uploadStatus === 'success' && result) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
        <div style={{ textAlign: 'center', padding: 32, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', color: '#166534' }}>Document Uploaded</h2>
          <p style={{ color: '#15803d', margin: '0 0 4px' }}>{result.message}</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            Document ID: {result.id}
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
            OCR processing started — you can check status in document list.
          </p>
        </div>
        <button
          onClick={handleReset}
          style={{ marginTop: 16, width: '100%', padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Upload Another Document
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>Upload Financial Document</h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
        Supported formats: PDF, JPEG, PNG, WebP (max 10MB)
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Document Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
        >
          {FINANCIAL_DOCUMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #d1d5db',
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          cursor: 'pointer',
          background: file ? '#f0fdf4' : '#f9fafb',
          marginBottom: 16,
        }}
      >
        {previewUrl ? (
          <div>
            <img src={previewUrl} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{file?.name}</p>
          </div>
        ) : file ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>{file.name}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Click or drag to select a file</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploadStatus === 'uploading' || !file}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: uploadStatus === 'uploading' ? '#93c5fd' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: uploadStatus === 'uploading' || !file ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Document'}
      </button>
    </div>
  );
}
