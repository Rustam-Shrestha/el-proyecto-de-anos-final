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
  employmentTenureMonths: number | null;
  employmentTenureDays: number | null;
  employmentStable: boolean;
  incomeSourceType: string;
  incomeStabilityScore: number;
};

export type EmploymentInput = {
  occupationJobTitle: string;
  employmentStartDate: string;
  annualIncome: number;
  employerName?: string;
  dependentsCount?: number;
};

export const employmentKeys = {
  all: ["employment"] as const,
  my: ["employment", "mine"] as const,
};

export const useGetMyEmployment = () => {
  return useQuery({
    queryKey: employmentKeys.my,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<EmploymentInfo | null>>(
        "/employment"
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
        "/employment",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employmentKeys.all });
    },
  });
};
