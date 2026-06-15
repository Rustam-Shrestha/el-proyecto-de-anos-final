import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse, PaginationMeta } from "@shared/types/common";
import type {
  LoanApplication,
  LoanStatus,
  LoanPurpose,
  BorrowerFeatures,
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
        return data;
      }

      return {
        loans: data.data,
        total: data.meta.total,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: true,
  });
};

export const useGetLoan = (id: string) => {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Loan id is required");

      const { data } = await apiClient.get<LoanDetailApiResponse>(`/loan/${id}`);
      if ("success" in data) {
        return data.data;
      }
      return data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: true,
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
        payload
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
