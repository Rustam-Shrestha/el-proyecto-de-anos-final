import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";

export const finguardKeys = {
  all: ["finguard"] as const,
  profile: ["finguard", "profile"] as const,
  trends: ["finguard", "trends"] as const,
  categories: ["finguard", "categories"] as const,
  uploads: ["finguard", "uploads"] as const,
  uploadDetail: (id: string) => ["finguard", "uploads", id] as const,
  transactions: (params?: Record<string, string>) =>
    ["finguard", "transactions", params].filter(Boolean) as readonly string[],
  loanAssessments: ["finguard", "loan-assessments"] as const,
  chatSession: (sessionId: string) => ["finguard", "chat", sessionId] as const,
};

export interface BankStatement {
  id: string;
  userId: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  statementFromDate: string | null;
  statementToDate: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  parsingStatus: string;
  createdAt: string;
  _count?: { transactions: number };
}

export interface Transaction {
  id: string;
  bankStatementId: string;
  userId: string;
  transactionDate: string;
  description: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  transactionType: string | null;
  category: string | null;
}

export interface FinancialProfile {
  id: string;
  userId: string;
  totalStatements: number;
  avgMonthlyIncome: number | null;
  avgMonthlyExpense: number | null;
  totalIncome: number | null;
  totalExpense: number | null;
  totalSavings: number | null;
  savingsRate: number | null;
  debtToIncomeRatio: number | null;
  incomeStabilityScore: number | null;
  creditScoreEstimate: number | null;
}

export interface LoanAssessment {
  id: string;
  userId: string;
  requestedAmount: number;
  loanTenureMonths: number | null;
  eligibleAmount: number | null;
  maxMonthlyEmi: number | null;
  eligibilityScore: number | null;
  riskLevel: string | null;
  recommendation: string | null;
  createdAt: string;
}

export interface ChatResponse {
  intent: string;
  extractedEntities: Record<string, unknown>;
  answer: string;
  sessionId: string;
}

export const useFinancialProfile = () =>
  useQuery({
    queryKey: finguardKeys.profile,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<FinancialProfile>>("/financial/profile");
      return data.data;
    },
    staleTime: 30 * 1000,
  });

export const useRecalculateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<FinancialProfile>>("/financial/recalculate");
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: finguardKeys.profile });
    },
  });
};

export const useMonthlyTrends = () =>
  useQuery({
    queryKey: finguardKeys.trends,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Array<{ month: string; income: number; expense: number }>>>("/financial/trends");
      return data.data;
    },
    staleTime: 30 * 1000,
  });

export const useCategoryBreakdown = () =>
  useQuery({
    queryKey: finguardKeys.categories,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{
        expenses: Array<{ transactionType: string; _sum: { debit: number }; _count: number }>;
        income: Array<{ transactionType: string; _sum: { credit: number }; _count: number }>;
      }>>("/financial/categories");
      return data.data;
    },
    staleTime: 30 * 1000,
  });

export const useUploadStatement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<ApiResponse<BankStatement>>("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: finguardKeys.all });
    },
  });
};

export const useListUploads = () =>
  useQuery({
    queryKey: finguardKeys.uploads,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<BankStatement[]>>("/uploads");
      return data.data;
    },
  });

export const useTransactions = (params?: Record<string, string>) =>
  useQuery({
    queryKey: finguardKeys.transactions(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams(params).toString();
      const { data } = await apiClient.get<ApiResponse<Transaction[]> & { meta: { total: number } }>(
        `/transactions${searchParams ? `?${searchParams}` : ""}`
      );
      return data;
    },
    staleTime: 10 * 1000,
  });

export const useAssessLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { requestedAmount: number; loanTenureMonths?: number; interestRateAssumed?: number }) => {
      const { data } = await apiClient.post<ApiResponse<LoanAssessment>>("/loan-assessment/assess", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: finguardKeys.loanAssessments });
    },
  });
};

export const useLoanAssessmentHistory = () =>
  useQuery({
    queryKey: finguardKeys.loanAssessments,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<LoanAssessment[]>>("/loan-assessment/history");
      return data.data;
    },
  });

export const useChatMutation = () =>
  useMutation({
    mutationFn: async (payload: { message: string; sessionId?: string }) => {
      const { data } = await apiClient.post<ApiResponse<ChatResponse>>("/chat/ask", payload);
      return data.data;
    },
  });

export const useChatHistory = (sessionId: string) =>
  useQuery({
    queryKey: finguardKeys.chatSession(sessionId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ messages: Array<{ role: string; content: string; timestamp: string }> }>>(
        `/chat/history/${sessionId}`
      );
      return data.data;
    },
    enabled: Boolean(sessionId),
  });
