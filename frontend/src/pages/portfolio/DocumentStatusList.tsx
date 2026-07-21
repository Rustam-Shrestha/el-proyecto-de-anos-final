import React, { useEffect, useState } from 'react';
import { portfolioService } from '../../services/portfolioService';
import type { FinancialDocument } from '../../types/financial';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const VERIFY_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  VERIFIED: '#10b981',
  REJECTED: '#ef4444',
  FLAGGED_REVIEW: '#f97316',
};

export default function DocumentStatusList() {
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [summary, setSummary] = useState<{ total: number; verified: number; pending: number; flagged: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docs, docSummary] = await Promise.all([
        portfolioService.listDocuments(),
        portfolioService.getDocumentSummary(),
      ]);
      setDocuments(docs);
      setSummary(docSummary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && documents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
        Loading documents...
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Financial Documents</h2>
        <button
          onClick={fetchData}
          style={{ padding: '6px 14px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          Refresh
        </button>
      </div>

      {summary && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <SummaryCard label="Total" value={summary.total} color="#6b7280" />
          <SummaryCard label="Verified" value={summary.verified} color="#10b981" />
          <SummaryCard label="Pending" value={summary.pending} color="#f59e0b" />
          <SummaryCard label="Flagged" value={summary.flagged} color="#f97316" />
        </div>
      )}

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ margin: 0 }}>No documents uploaded yet.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>Go to Upload page to add documents.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{doc.originalName || 'Unnamed document'}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>
                    {doc.documentType.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <StatusBadge label={STATUS_LABELS[doc.ocrStatus] || doc.ocrStatus} color={STATUS_COLORS[doc.ocrStatus] || '#6b7280'} />
                  {doc.verificationStatus && (
                    <StatusBadge label={doc.verificationStatus.replace('_', ' ')} color={VERIFY_COLORS[doc.verificationStatus] || '#6b7280'} />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                {doc.ocrConfidence !== null && (
                  <span>OCR: {Math.round(doc.ocrConfidence * 100)}%</span>
                )}
                {doc.flagCount > 0 && (
                  <span style={{ color: '#ef4444', fontWeight: 500 }}>
                    🚩 {doc.flagCount} flag{doc.flagCount > 1 ? 's' : ''}
                  </span>
                )}
                {doc.ocrStatus === 'FAILED' && doc.ocrErrorMessage && (
                  <span style={{ color: '#ef4444' }}>Error: {doc.ocrErrorMessage}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: '12px 20px', border: `1px solid ${color}40`, borderRadius: 8, background: '#fff', minWidth: 100, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: `${color}20`, color }}>
      {label}
    </span>
  );
}
