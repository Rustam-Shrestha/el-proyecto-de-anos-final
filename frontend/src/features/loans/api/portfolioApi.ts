import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";

export type EmploymentInfo = {
  id: string;
  userId: string;
  employmentStatus: string;
  occupationJobTitle: string | null;
  employerName: string | null;
  employmentStartDate: string | null;
  monthlyGrossIncome: number;
  annualIncome: number;
  dependentsCount: number;
  incomeSourceType: string;
  incomeStabilityScore: number;
  employmentTenureMonths: number | null;
  employmentTenureDays: number | null;
  employmentStable: boolean;
  businessName: string | null;
  businessType: string | null;
  institutionName: string | null;
  educationLevel: string | null;
  expectedGraduationDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmploymentInput = {
  employmentStatus: string;
  occupationJobTitle?: string;
  employerName?: string;
  employmentStartDate?: string;
  monthlyGrossIncome?: number;
  annualIncome?: number;
  dependentsCount?: number;
  incomeSourceType?: string;
  businessName?: string;
  businessType?: string;
  institutionName?: string;
  educationLevel?: string;
  expectedGraduationDate?: string;
};

export type FinancialDocument = {
  id: string;
  userId: string;
  documentType: string;
  filePath: string;
  fileMimeType: string | null;
  fileSize: number | null;
  originalName: string | null;
  ocrStatus: string;
  ocrData: Record<string, unknown> | null;
  ocrConfidence: number | null;
  verificationStatus: string;
  adminNotes: string | null;
  isExpired: boolean;
  expiryDate: string | null;
  createdAt: string;
};

export type PortfolioVerification = {
  id: string;
  userId: string;
  verificationStatus: string;
  loanToIncomeRatio: number | null;
  emiToIncomeRatio: number | null;
  incomePerDependent: number | null;
  employmentStabilityScore: number | null;
  ageCategory: string | null;
  overallRiskScore: number | null;
  riskLevel: string | null;
  flagsCount: number;
  flagDetails: Array<{ field: string; issue: string; severity: string }> | null;
  adminNotes: string | null;
  lastUpdated: string;
};

export type PortfolioSummary = {
  employment: EmploymentInfo | null;
  verification: PortfolioVerification | null;
  documents: FinancialDocument[];
  loanFeatures: Record<string, unknown> | null;
  activeAccounts: Array<Record<string, unknown>>;
  isComplete: boolean;
  documentSummary: {
    total: number;
    verified: number;
    pending: number;
  };
};

export type VerificationReport = {
  generatedAt: string;
  userId: string;
  employmentInfo: Record<string, unknown> | null;
  verification: Record<string, unknown> | null;
  documents: Array<Record<string, unknown>>;
  activeLoans: Array<Record<string, unknown>>;
  loanFeatures: Record<string, unknown> | null;
};

export type PendingPortfolio = {
  id: string;
  userId: string;
  verificationStatus: string;
  user: {
    id: string;
    email: string;
    profile: { fullName: string | null } | null;
    employmentInfo: { employmentStatus: string; annualIncome: number } | null;
  };
  lastUpdated: string;
};

export const portfolioKeys = {
  all: ["portfolio"] as const,
  employment: ["portfolio", "employment"] as const,
  documents: ["portfolio", "documents"] as const,
  summary: ["portfolio", "summary"] as const,
  verificationStatus: ["portfolio", "verification-status"] as const,
  metrics: ["portfolio", "metrics"] as const,
  report: ["portfolio", "report"] as const,
  loans: ["portfolio", "loans"] as const,
  admin: {
    pending: ["portfolio", "admin", "pending"] as const,
    detail: (userId: string) => ["portfolio", "admin", userId] as const,
    report: (userId: string) => ["portfolio", "admin", "report", userId] as const,
    documents: (userId: string) => ["portfolio", "admin", "documents", userId] as const,
  },
};

export const useGetMyEmployment = () => {
  return useQuery({
    queryKey: portfolioKeys.employment,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<EmploymentInfo | null>>(
        "/portfolio/employment"
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useSaveEmploymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EmploymentInput) => {
      const { data } = await apiClient.post<ApiResponse<EmploymentInfo>>(
        "/portfolio/employment",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
};

export const useGetPortfolioDocuments = () => {
  return useQuery({
    queryKey: portfolioKeys.documents,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<FinancialDocument[]>>(
        "/portfolio/documents"
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { documentType: string; file: File }) => {
      const formData = new FormData();
      formData.append("document", payload.file);
      formData.append("documentType", payload.documentType);
      const { data } = await apiClient.post<ApiResponse<FinancialDocument>>(
        "/portfolio/documents/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.documents });
    },
  });
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data } = await apiClient.delete<ApiResponse<FinancialDocument>>(
        `/portfolio/documents/${documentId}`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.documents });
    },
  });
};

export const useGetPortfolioSummary = () => {
  return useQuery({
    queryKey: portfolioKeys.summary,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PortfolioSummary>>(
        "/portfolio/summary"
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetVerificationStatus = () => {
  return useQuery({
    queryKey: portfolioKeys.verificationStatus,
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean;
        data: {
          verificationStatus: string;
          isComplete: boolean;
          riskScore: number | null;
          riskLevel: string | null;
          flagsCount: number | null;
        };
      }>("/portfolio/verification-status");
      return data.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useGetPortfolioMetrics = () => {
  return useQuery({
    queryKey: portfolioKeys.metrics,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
        "/portfolio/metrics"
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetVerificationReport = () => {
  return useQuery({
    queryKey: portfolioKeys.report,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<VerificationReport>>(
        "/portfolio/report"
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useGetLoanHistory = () => {
  return useQuery({
    queryKey: portfolioKeys.loans,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Array<Record<string, unknown>>>>(
        "/portfolio/loans"
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
};

// ─── Admin Hooks ─────────────────────────────────────────────────

export const useGetPendingPortfolios = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: [...portfolioKeys.admin.pending, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<
        ApiResponse<PendingPortfolio[]> & { meta: { page: number; limit: number; total: number; pages: number } }
      >(`/portfolio/admin/pending?page=${page}&limit=${limit}`);
      return data;
    },
    staleTime: 30 * 1000,
  });
};

export const useGetAdminPortfolioDetail = (userId: string) => {
  return useQuery({
    queryKey: portfolioKeys.admin.detail(userId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ summary: PortfolioSummary; report: VerificationReport }>>(
        `/portfolio/admin/users/${userId}`
      );
      return data.data;
    },
    enabled: Boolean(userId),
  });
};

export const useGetAdminUserDocuments = (userId: string) => {
  return useQuery({
    queryKey: portfolioKeys.admin.documents(userId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<FinancialDocument[]>>(
        `/portfolio/admin/users/${userId}/documents`
      );
      return data.data;
    },
    enabled: Boolean(userId),
  });
};

export const useVerifyPortfolioMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      verificationStatus: string;
      adminNotes?: string;
    }) => {
      const { data } = await apiClient.patch<ApiResponse<PortfolioVerification>>(
        `/portfolio/admin/users/${payload.userId}/verify`,
        {
          verificationStatus: payload.verificationStatus,
          adminNotes: payload.adminNotes,
        }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
};

export const useSubmitPortfolioMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<PortfolioVerification>>(
        "/portfolio/submit"
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
};

export const useVerifyFinancialDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      documentId: string;
      verificationStatus: string;
      adminNotes?: string;
    }) => {
      const { data } = await apiClient.patch<ApiResponse<FinancialDocument>>(
        `/portfolio/admin/documents/${payload.documentId}/verify`,
        {
          verificationStatus: payload.verificationStatus,
          adminNotes: payload.adminNotes,
        }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
};
