import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";
import type {
  LoanApplication,
  LoanStatus,
  LoanPurpose,
} from "@shared/types/common";

type LoanListApiResponse =
  | {
      loans: LoanApplication[];
      total: number;
    }
  | {
      success: boolean;
      data: LoanApplication[];
      meta: { total: number; page: number; limit: number };
    };

type LoanDetailApiResponse =
  | LoanApplication
  | {
      success: boolean;
      data: LoanApplication;
    };

type PredictionApiResponse =
  | {
      riskLevel: string;
      approvalProbability: number;
      recommendedLimit: number;
    }
  | {
      success: boolean;
      data: {
        riskLevel: string;
        approvalProbability: number;
        recommendedLimit: number;
      };
    };

export const loanKeys = {
  all: ["loans"] as const,
  list: (page: number, limit: number, status?: string) =>
    ["loans", "list", page, limit, status].filter(Boolean) as readonly string[],
  detail: (id: string) => ["loans", id] as const,
  prediction: (userId: string) => ["loans", "prediction", userId] as const,
};

const normalizeLoan = (raw: any): LoanApplication => {
  if (!raw) return raw;
  const amount = Number(raw.amount ?? raw.requestedAmount ?? 0);
  const termMonths = Number(raw.termMonths ?? raw.tenureMonths ?? 0);
  const monthlyPayment = Number(raw.monthlyPayment ?? raw.calculatedEmi ?? raw.calculatedEMI ?? 0);
  const totalRepayment = Number(raw.totalRepayment ?? (monthlyPayment && termMonths ? monthlyPayment * termMonths : 0));
  const appliedAt = raw.appliedAt ?? raw.createdAt ?? raw.submittedAt ?? new Date().toISOString();
  return {
    ...raw,
    amount,
    termMonths,
    monthlyPayment,
    totalRepayment,
    appliedAt,
    userId: raw.user?.email || raw.user?.id || raw.userId,
    applicantEmail: raw.user?.email || raw.applicantEmail,
    riskLevel: raw.riskLevel,
    riskScore: raw.riskScore,
    creditScore: raw.creditScore,
    defaultProbability: raw.defaultProbability,
    mlDecision: raw.mlDecision,
    shapValues: raw.shapValues,
  };
};

export const useLoansList = (page: number, limit: number, status?: string) => {
  return useQuery({
    queryKey: loanKeys.list(page, limit, status),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (status && status !== "ALL") {
        params.set("status", status);
      }

      const { data } = await apiClient.get<LoanListApiResponse>(
        `/loan?${params.toString()}`
      );

      if ("loans" in data) {
        return {
          loans: (data.loans || []).map(normalizeLoan),
          total: data.total,
        };
      }

      return {
        loans: ((data as any).data || []).map(normalizeLoan),
        total: (data as any).meta?.total ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

export const useGetLoan = (id: string) => {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Loan id is required");

      const { data } = await apiClient.get<LoanDetailApiResponse>(`/loan/${id}`);
      if ("success" in data) {
        return normalizeLoan((data as any).data);
      }
      return normalizeLoan(data);
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useApplyLoanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: {
        amount: number;
        purpose: LoanPurpose;
        termMonths: number;
        notes?: string;
      }
    ) => {
      const { data } = await apiClient.post<ApiResponse<LoanApplication>>(
        "/loan/apply",
        {
          requestedAmount: payload.amount,
          tenureMonths: payload.termMonths,
          purpose: payload.purpose,
        }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
};

export const useReviewLoanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
      rejectionReason,
      interestRate,
    }: {
      id: string;
      status: LoanStatus;
      notes?: string;
      rejectionReason?: string;
      interestRate?: number;
    }) => {
      const { data } = await apiClient.patch<ApiResponse<LoanApplication>>(
        `/loan/${id}/review`,
        { status, notes, rejectionReason, interestRate }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
};

export type HomeCreditFeatures = {
  AMT_INCOME_TOTAL: number;
  AMT_CREDIT: number;
  DAYS_BIRTH: number;
  DAYS_EMPLOYED: number;
  AMT_ANNUITY: number;
  OCCUPATION_TYPE: string;
  CNT_CHILDREN: number;
};

export type DeriveFeatures = {
  CREDIT_INCOME_PERCENT: number;
  ANNUITY_INCOME_PERCENT: number;
  INCOME_PER_PERSON: number;
  DAYS_EMPLOYED_PERCENT: number;
  EMPLOYMENT_STABILITY: number;
  AGE_CATEGORY: number;
};

type CalculateRiskResponse = {
  requestedLoanAmount: number;
  loanTenureMonths: number;
  calculatedEMI: number;
  riskScore: number;
  riskLevel: string;
  homeCredtFeatures: HomeCreditFeatures;
  derivedFeatures: DeriveFeatures;
  approvalRecommendation: string;
};

export const useCalculateRiskMutation = () => {
  return useMutation({
    mutationFn: async (payload: {
      requestedLoanAmount: number;
      loanTenureMonths: number;
    }) => {
      const { data } = await apiClient.post<ApiResponse<CalculateRiskResponse>>(
        "/loan/calculate-risk",
        payload
      );
      return data.data;
    },
  });
};

export const useGetLoanPrediction = (userId: string) => {
  return useQuery({
    queryKey: loanKeys.prediction(userId),
    queryFn: async () => {
      const { data } = await apiClient.get<PredictionApiResponse>(
        `/loan/predict/${userId}`
      );

      if ("success" in data) {
        return data.data;
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000,
  });
};
