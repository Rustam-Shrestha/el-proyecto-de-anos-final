import { apiService } from './apiService';
import type {
  FinancialDocument,
  DocumentUploadResponse,
} from '../types/financial';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page: number; limit: number; total: number; pages?: number };
}

export const portfolioService = {
  async uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
    const res = await apiService.post<ApiResponse<DocumentUploadResponse>>(
      '/portfolio/documents/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
  },

  async listDocuments(): Promise<FinancialDocument[]> {
    const res = await apiService.get<ApiResponse<FinancialDocument[]>>('/portfolio/documents');
    return res.data.data;
  },

  async getDocument(id: string): Promise<FinancialDocument> {
    const res = await apiService.get<ApiResponse<FinancialDocument>>(`/portfolio/documents/${id}`);
    return res.data.data;
  },

  async getDocumentStatus(id: string): Promise<FinancialDocument> {
    const res = await apiService.get<ApiResponse<FinancialDocument>>(`/portfolio/documents/${id}/status`);
    return res.data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await apiService.delete(`/portfolio/documents/${id}`);
  },

  async getDocumentSummary(): Promise<{ total: number; verified: number; pending: number; rejected: number; flagged: number }> {
    const res = await apiService.get<ApiResponse<{ total: number; verified: number; pending: number; rejected: number; flagged: number }>>('/portfolio/documents/summary');
    return res.data.data;
  },

  async getPortfolioSummary(): Promise<Record<string, unknown>> {
    const res = await apiService.get<ApiResponse<Record<string, unknown>>>('/portfolio/summary');
    return res.data.data;
  },

  async submitPortfolio(): Promise<Record<string, unknown>> {
    const res = await apiService.post<ApiResponse<Record<string, unknown>>>('/portfolio/submit');
    return res.data.data;
  },

  async adminListDocuments(status?: string, page = 1, limit = 20): Promise<{ items: FinancialDocument[]; total: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const res = await apiService.get<ApiResponse<FinancialDocument[]>>(`/portfolio/admin/documents?${params}`);
    return { items: res.data.data, total: res.data.meta?.total ?? 0 };
  },

  async adminVerifyDocument(id: string, verificationStatus: string, adminNotes?: string): Promise<FinancialDocument> {
    const res = await apiService.patch<ApiResponse<FinancialDocument>>(`/portfolio/admin/documents/${id}/verify`, {
      verificationStatus,
      adminNotes,
    });
    return res.data.data;
  },

  async getEmployment(): Promise<Record<string, unknown>> {
    const res = await apiService.get<ApiResponse<Record<string, unknown>>>('/portfolio/employment');
    return res.data.data;
  },

  async saveEmployment(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await apiService.post<ApiResponse<Record<string, unknown>>>('/portfolio/employment', data);
    return res.data.data;
  },
};
