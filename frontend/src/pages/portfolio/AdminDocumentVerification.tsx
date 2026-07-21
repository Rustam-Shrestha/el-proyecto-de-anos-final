import React, { useEffect, useState, useCallback } from 'react';
import { portfolioService } from '../../services/portfolioService';
import type { FinancialDocument } from '../../types/financial';

const FILTERS = ['', 'PENDING', 'FLAGGED', 'VERIFIED', 'REJECTED'] as const;
const FILTER_LABELS: Record<string, string> = { '': 'All', PENDING: 'Pending', FLAGGED: 'Flagged', VERIFIED: 'Verified', REJECTED: 'Rejected' };

export default function AdminDocumentVerification() {
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<FinancialDocument | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [adminAction, setAdminAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [acting, setActing] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await portfolioService.adminListDocuments(filter || undefined);
      setDocuments(result.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleAction = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION') => {
    if (!selectedDoc) return;
    setAdminAction(decision);
  };

  const confirmAction = async () => {
    if (!selectedDoc || !adminAction) return;
    setActing(true);
    try {
      await portfolioService.adminVerifyDocument(selectedDoc.id, adminAction, adminNotes || undefined);
      setSelectedDoc(null);
      setShowDetail(false);
      setAdminNotes('');
      setAdminAction(null);
      fetchDocuments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const openDetail = (doc: FinancialDocument) => {
    setSelectedDoc(doc);
    setShowDetail(true);
    setAdminNotes(doc.adminNotes || '');
    setAdminAction(null);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600 }}>Document Verification</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: 13,
              background: filter === f ? '#2563eb' : '#fff',
              color: filter === f ? '#fff' : '#374151',
            }}
          >
            {FILTER_LABELS[f] || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>Loading...</div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>No documents found for this filter.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {doc.user?.profile?.fullName || doc.user?.email || 'Unknown User'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {doc.documentType.replace('_', ' ')} | {new Date(doc.createdAt).toLocaleDateString()}
                  {doc.ocrConfidence !== null && ` | OCR: ${Math.round(doc.ocrConfidence * 100)}%`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {doc.flagCount > 0 && (
                  <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                    🚩 {doc.flagCount}
                  </span>
                )}
                <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: getStatusBg(doc.verificationStatus), color: getStatusColor(doc.verificationStatus) }}>
                  {doc.verificationStatus.replace('_', ' ')}
                </span>
                <button onClick={() => openDetail(doc)} style={{ padding: '4px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selectedDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowDetail(false)}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 900, width: '95%', maxHeight: '90vh', overflow: 'auto', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Document Review</h3>
              <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <DocInfo label="User" value={selectedDoc.user?.profile?.fullName || selectedDoc.user?.email || 'N/A'} />
            <DocInfo label="Document Type" value={selectedDoc.documentType.replace('_', ' ')} />
            <DocInfo label="File" value={selectedDoc.originalName || 'N/A'} />
            <DocInfo label="Uploaded" value={new Date(selectedDoc.createdAt).toLocaleString()} />
            <DocInfo label="OCR Status" value={selectedDoc.ocrStatus} />
            <DocInfo label="OCR Confidence" value={selectedDoc.ocrConfidence !== null ? `${Math.round(selectedDoc.ocrConfidence * 100)}%` : 'N/A'} />
            <DocInfo label="Verification Status" value={selectedDoc.verificationStatus.replace('_', ' ')} />

            {selectedDoc.ocrErrorMessage && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 6, color: '#991b1b', fontSize: 13, marginBottom: 12 }}>
                OCR Error: {selectedDoc.ocrErrorMessage}
              </div>
            )}

            {selectedDoc.anomalyFlags.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#ef4444' }}>🚩 Anomaly Flags ({selectedDoc.flagCount})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedDoc.anomalyFlags.map((flag) => (
                    <span key={flag} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                      {flag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedDoc.ocrRawText && (
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>Raw OCR Text</h4>
                <pre style={{ fontSize: 11, background: '#f9fafb', padding: 12, borderRadius: 6, maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb', margin: 0 }}>
                  {selectedDoc.ocrRawText}
                </pre>
              </div>
            )}

            {selectedDoc.comparisonResult && (
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Field Comparison</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={thStyle}>Field</th>
                      <th style={thStyle}>Declared</th>
                      <th style={thStyle}>Extracted</th>
                      <th style={thStyle}>Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedDoc.comparisonResult).map(([key, val]) => {
                      const field = val as { matched?: boolean; declared?: unknown; extracted?: unknown; differencePercent?: number };
                      return (
                        <tr key={key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={tdStyle}>{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                          <td style={tdStyle}>{String(field.declared ?? '-')}</td>
                          <td style={tdStyle}>{String(field.extracted ?? '-')}</td>
                          <td style={tdStyle}>
                            {field.matched ? (
                              <span style={{ color: '#10b981' }}>✅ Match</span>
                            ) : (
                              <span style={{ color: '#ef4444' }}>❌ Mismatch{field.differencePercent ? ` (${field.differencePercent}%)` : ''}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>Admin Notes</h4>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this document..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical' }}
              />
            </div>

            {adminAction && (
              <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                Confirm {adminAction === 'APPROVE' ? 'approval' : adminAction === 'REJECT' ? 'rejection' : 'resubmission request'}?
                {adminAction === 'REQUEST_RESUBMISSION' && !adminNotes && (
                  <span style={{ color: '#dc2626', marginLeft: 4 }}>(Add notes explaining what to fix)</span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                disabled={acting || selectedDoc.verificationStatus === 'VERIFIED'}
                onClick={() => handleAction('APPROVE')}
                style={{ padding: '8px 20px', background: adminAction === 'APPROVE' ? '#059669' : '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, opacity: selectedDoc.verificationStatus === 'VERIFIED' ? 0.5 : 1 }}
              >
                ✅ Approve
              </button>
              <button
                disabled={acting || selectedDoc.verificationStatus === 'REJECTED'}
                onClick={() => handleAction('REJECT')}
                style={{ padding: '8px 20px', background: adminAction === 'REJECT' ? '#dc2626' : '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, opacity: selectedDoc.verificationStatus === 'REJECTED' ? 0.5 : 1 }}
              >
                ❌ Reject
              </button>
              <button
                disabled={acting}
                onClick={() => handleAction('REQUEST_RESUBMISSION')}
                style={{ padding: '8px 20px', background: adminAction === 'REQUEST_RESUBMISSION' ? '#d97706' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                📝 Request Resubmit
              </button>
              {adminAction && (
                <button
                  onClick={confirmAction}
                  disabled={acting}
                  style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                >
                  {acting ? 'Processing...' : 'Confirm'}
                </button>
              )}
              {adminAction && (
                <button
                  onClick={() => setAdminAction(null)}
                  style={{ padding: '8px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocInfo({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ fontWeight: 500, minWidth: 130, color: '#6b7280' }}>{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function getStatusBg(status: string): string {
  const colors: Record<string, string> = { PENDING: '#fef3c7', VERIFIED: '#d1fae5', REJECTED: '#fee2e2', FLAGGED_REVIEW: '#ffedd5' };
  return colors[status] || '#f3f4f6';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = { PENDING: '#92400e', VERIFIED: '#065f46', REJECTED: '#991b1b', FLAGGED_REVIEW: '#9a3412' };
  return colors[status] || '#374151';
}

const thStyle: React.CSSProperties = { padding: '6px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #e5e7eb' };
const tdStyle: React.CSSProperties = { padding: '6px 10px', fontSize: 12, borderBottom: '1px solid #e5e7eb' };
